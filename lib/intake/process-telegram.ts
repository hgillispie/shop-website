import "server-only";
import { saveIntakeCapture } from "@/lib/intake/create-draft";
import { isAllowedTelegramUser, isIntakeImageType } from "@/lib/intake/fields";
import {
  downloadTelegramFile,
  sendTelegramMessage,
} from "@/lib/intake/telegram";

type TelegramUser = { id: number; first_name?: string; username?: string };
type PhotoSize = { file_id: string; width: number; height: number };
type TelegramDocument = {
  file_id: string;
  file_name?: string;
  mime_type?: string;
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
};

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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
    await sendTelegramMessage(
      message.chat.id,
      [
        "Send screenshots of a customer text thread (an album keeps them on one draft).",
        `Your Telegram user id is ${from.id}.`,
        "Open Drafts: " + `${SITE_URL.replace(/\/$/, "")}/admin/board`,
      ].join("\n"),
    );
    return { ok: true, skipped: "command" };
  }

  if (!isAllowedTelegramUser(from.id)) {
    await sendTelegramMessage(
      message.chat.id,
      `Not on the allowlist. Your Telegram user id is ${from.id} — add it to TELEGRAM_ALLOWED_USER_IDS.`,
    );
    return { ok: true, skipped: "sender not allowed" };
  }

  const images = await collectImages(message);
  const bodyText = message.caption ?? message.text ?? null;
  if (images.length === 0 && !bodyText) {
    await sendTelegramMessage(
      message.chat.id,
      "Send a screenshot (or an album of screenshots) of the customer thread.",
    );
    return { ok: true, skipped: "empty" };
  }

  const saved = await saveIntakeCapture({
    source: "telegram",
    telegramMediaGroupId: message.media_group_id ?? null,
    subject: null,
    bodyText,
    fallbackName: null,
    images,
  });

  const url = `${SITE_URL.replace(/\/$/, "")}/admin/board/${saved.job.id}`;
  if (saved.appended) {
    await sendTelegramMessage(
      message.chat.id,
      `Added to draft #${saved.job.jobNumber}. ${url}`,
    );
  } else {
    await sendTelegramMessage(
      message.chat.id,
      `Open Draft #${saved.job.jobNumber} is ready for review. ${url}`,
    );
  }

  return { ok: true, jobId: saved.job.id };
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
