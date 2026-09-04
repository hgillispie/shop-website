import "server-only";

const API = "https://api.telegram.org";

function botToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set.");
  return token;
}

async function telegram<T>(method: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API}/bot${botToken()}/${method}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await response.json()) as { ok: boolean; result?: T; description?: string };
  if (!json.ok || json.result === undefined) {
    throw new Error(json.description ?? `Telegram ${method} failed`);
  }
  return json.result;
}

export function verifyTelegramSecret(request: Request): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) return process.env.NODE_ENV !== "production";
  return request.headers.get("x-telegram-bot-api-secret-token") === expected;
}

export async function sendTelegramMessage(chatId: number, text: string) {
  await telegram("sendMessage", { chat_id: chatId, text, disable_web_page_preview: true });
}

export async function downloadTelegramFile(
  fileId: string,
  filename: string,
  contentType: string,
): Promise<{ bytes: Buffer; filename: string; contentType: string }> {
  const file = await telegram<{ file_path: string }>("getFile", { file_id: fileId });
  const response = await fetch(`${API}/file/bot${botToken()}/${file.file_path}`);
  if (!response.ok) {
    throw new Error(`Telegram file download failed (${response.status})`);
  }
  return {
    bytes: Buffer.from(await response.arrayBuffer()),
    filename,
    contentType,
  };
}
