import { NextResponse } from "next/server";
import { processTelegramUpdate, type TelegramUpdate } from "@/lib/intake/process-telegram";
import { verifyTelegramSecret } from "@/lib/intake/telegram";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!verifyTelegramSecret(request)) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const result = await processTelegramUpdate(update);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[telegram webhook] failed:", error);
    return NextResponse.json({ error: "Failed to process Telegram update" }, { status: 500 });
  }
}
