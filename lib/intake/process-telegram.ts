import "server-only";
import { applyOwnerContactToLatestDraft } from "@/lib/intake/apply-reply";
import { saveIntakeCapture } from "@/lib/intake/create-draft";
import { isAllowedTelegramUser, isIntakeImageType, isUsablePhone } from "@/lib/intake/fields";
import {
  downloadTelegramFile,
  sendTelegramMessage,
} from "@/lib/intake/telegram";
import type { IntakeDraftRow, JobRow } from "@/lib/db/schema";

type TelegramUser = { id: number; first_name?: string; username?: string };
type PhotoSize = { file_id: string; width: number; height: number };
type TelegramDocument = {
  file_id: string;
  file_name?: string;
  mime_type?: string;
};
type TelegramContact = {
  phone_number: string;
  first_name?: string;
  last_name?: string;
};

export type TelegramMessage = {
  message_id: number;
  from?: TelegramUser;
  chat: { id: number };
  text?: string;
  caption?: string;
  media_group_id?: string;
  photo?: PhotoSize[];
  document?: TelegramDocument;
  contact?: TelegramContact;
};

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

async function reply(chatId: number, text: string) {
  try {
    await sendTelegramMessage(chatId, text);
  } catch (error) {
    console.warn("[telegram] reply failed:", error);
  }
}

export async function processTelegramUpdate(update: TelegramUpdate): Promise<{
  ok: true;
  skipped?: string;
  jobId?: string;
}> {
  const message = update.message;
  if (!message) return { ok: true, skipped: "not a message" };

  const from = message.from;
  if (!from) return { ok: true, skipped: "no sender" };

  const text = (message.text ?? "").trim();
  if (text === "/start" || text === "/help") {
    await reply(
      message.chat.id,
      [
        "Screenshot a customer thread and send it here. An album stays on one job.",
        "iMessage hides the number — after the pictures, reply with their phone or share their contact card.",
        `Your Telegram id is ${from.id}. The shop owner needs his id on TELEGRAM_ALLOWED_USER_IDS.`,
      ].join("\n"),
    );
    return { ok: true, skipped: "command" };
  }

  if (!isAllowedTelegramUser(from.id)) {
    await reply(
      message.chat.id,
      `Not on the allowlist. Your Telegram id is ${from.id} — add it to TELEGRAM_ALLOWED_USER_IDS.`,
    );
    return { ok: true, skipped: "sender not allowed" };
  }

  const images = await collectImages(message);
  const contactLine = formatContact(message.contact);
  const bodyText = [message.caption, message.text, contactLine].filter(Boolean).join("\n") || null;

  if (images.length === 0 && (message.contact || text)) {
    const applied = await applyOwnerContactToLatestDraft(bodyText ?? text);
    if (!applied) {
      await reply(
        message.chat.id,
        "No open draft waiting. Send the screenshots first, then the number or contact card.",
      );
      return { ok: true, skipped: "no draft for reply" };
    }
    if (!applied.updated) {
      await reply(
        message.chat.id,
        "Send their phone number, or share their contact card.",
      );
      return { ok: true, skipped: applied.reason };
    }
    await reply(message.chat.id, formatDraftReply(applied.job, applied.draft, { appended: true }));
    return { ok: true, jobId: applied.job.id };
  }

  if (images.length === 0 && !bodyText) {
    await reply(
      message.chat.id,
      "Send a screenshot of the thread. Then reply with their number if iMessage hid it.",
    );
    return { ok: true, skipped: "empty" };
  }

  const saved = await saveIntakeCapture({
    source: "telegram",
    telegramMediaGroupId: message.media_group_id ?? null,
    subject: null,
    bodyText,
    fallbackName: contactName(message.contact),
    images,
  });

  await reply(message.chat.id, formatDraftReply(saved.job, saved.draft, { appended: saved.appended }));
  return { ok: true, jobId: saved.job.id };
}

function contactName(contact?: TelegramContact) {
  if (!contact) return null;
  return [contact.first_name, contact.last_name].filter(Boolean).join(" ") || null;
}

function formatContact(contact?: TelegramContact) {
  if (!contact) return null;
  return [contactName(contact), contact.phone_number].filter(Boolean).join(" ");
}

function formatDraftReply(
  job: JobRow,
  draft: IntakeDraftRow,
  opts: { appended: boolean },
) {
  const extracted = draft.extracted;
  const lines = [
    opts.appended ? `Updated draft #${job.jobNumber}.` : `Draft #${job.jobNumber} is in Open Drafts.`,
  ];

  if (extracted?.ownerBrief) lines.push("", extracted.ownerBrief);
  if (extracted?.recommendedNextStep) {
    lines.push("", `Next: ${extracted.recommendedNextStep}`);
  }
  if (extracted?.urgency && extracted.urgency !== "normal") {
    lines.push(`Urgency: ${extracted.urgency}`);
  }

  if (draft.extracted?.matchedFromCrm && isUsablePhone(draft.customerPhone)) {
    lines.push(
      "",
      `Used ${draft.customerName ?? "their"} number from the CRM: ${draft.customerPhone}. Reply with a different number if that's the wrong person.`,
    );
  } else if (!isUsablePhone(draft.customerPhone)) {
    lines.push(
      "",
      "I don't have their phone — iMessage usually hides it. Reply with the number or share their contact card.",
    );
  }

  return lines.join("\n");
}

async function collectImages(message: TelegramMessage) {
  const images: { bytes: Buffer; filename: string; contentType: string }[] = [];
  const largest = message.photo?.at(-1);
  if (largest) {
    images.push(
      await downloadTelegramFile(
        largest.file_id,
        `telegram-${message.message_id}.jpg`,
        "image/jpeg",
      ),
    );
  }

  const doc = message.document;
  if (doc && isIntakeImageType(doc.mime_type)) {
    images.push(
      await downloadTelegramFile(
        doc.file_id,
        doc.file_name || `telegram-${message.message_id}.png`,
        doc.mime_type || "image/png",
      ),
    );
  }

  return images;
}
