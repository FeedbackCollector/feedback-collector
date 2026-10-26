import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Screenshot } from "../types/review.js";

export const SCREENSHOT_DIR = path.resolve(process.env.SCREENSHOT_DIR ?? "uploads/screenshots");
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

export const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function parseScreenshot(value: unknown): { error?: string; screenshot?: Screenshot } {
  if (typeof value !== "string") return { error: "Invalid screenshot" };

  const match = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return { error: "Screenshot must be a base64 PNG or JPG data URL" };

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length === 0) return { error: "Screenshot is empty" };
  if (buffer.length > MAX_SCREENSHOT_BYTES) return { error: "Screenshot must be at most 5 MB" };

  const isPng = buffer.subarray(0, 8).equals(PNG_SIGNATURE);
  const isJpg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (!isPng && !isJpg) return { error: "File content is not a valid PNG or JPG" };

  return { screenshot: { buffer, ext: isPng ? "png" : "jpg" } };
}

export async function saveScreenshot(screenshot: Screenshot): Promise<string> {
  const filename = `${randomUUID()}.${screenshot.ext}`;
  await fs.promises.writeFile(path.join(SCREENSHOT_DIR, filename), screenshot.buffer);
  return filename;
}

export function removeScreenshot(filename: string | null | undefined) {
  if (!filename) return;
  fs.promises.unlink(path.join(SCREENSHOT_DIR, filename)).catch(() => {});
}