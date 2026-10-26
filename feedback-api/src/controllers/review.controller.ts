import type { Request, Response } from "express";
import * as Service from "../services/review.service.ts";
import type { ReviewInput } from "../types/review.js";
import { parseScreenshot } from "../utils/screenshot.js";

const isPositiveInt = (v: unknown) => Number.isInteger(v) && Number(v) >= 1;
const isNonEmptyString = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";
const isIsoDate = (v: unknown): v is string =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

function paramId(raw: string | string[]): number | null {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return isPositiveInt(n) ? n : null;
}


function parseBody(body: Record<string, unknown>, mode: "create" | "update"): { error?: string; value?: ReviewInput } {
  const create = mode === "create";
  const has = (k: string) => body[k] !== undefined;
  const value: ReviewInput = {};

  if (create || has("occurred_on")) {
    if (!isIsoDate(body.occurred_on)) return { error: "Invalid date (expected YYYY-MM-DD)" };
    value.occurred_on = body.occurred_on;
  }
  if (create || has("origin")) {
    if (!isNonEmptyString(body.origin) || body.origin.trim().length > 100) return { error: "Invalid source" };
    value.origin = body.origin.trim();
  }
  if (create || has("text")) {
    if (!isNonEmptyString(body.text) || body.text.trim().length > 5000) return { error: "Invalid comment" };
    value.text = body.text.trim();
  }
  if (create || has("score")) {
    const score = Number(body.score);
    if (!Number.isInteger(score) || score < 1 || score > 5) return { error: "Score must be an integer from 1 to 5" };
    value.score = score;
  }
  if (has("screenshot")) {
    const parsedShot = parseScreenshot(body.screenshot);
    if (parsedShot.error) return { error: parsedShot.error };
    value.screenshot = parsedShot.screenshot;
  }
  if (has("source_title")) {
    if (typeof body.source_title !== "string" || body.source_title.length > 255) return { error: "Invalid source title" };
    value.source_title = body.source_title.trim();
  }
  if (has("project_id")) {
    if (body.project_id === null || body.project_id === "") value.project_id = null;
    else if (isPositiveInt(Number(body.project_id))) value.project_id = Number(body.project_id);
    else return { error: "Invalid project" };
  }
  if (mode === "update" && has("remove_screenshot")) {
    value.remove_screenshot = body.remove_screenshot === true || body.remove_screenshot === "true";
  }
  return { value };
}

function sendError(res: Response, error: unknown) {
  if (error instanceof Service.ICNotFoundError || error instanceof Service.ReviewNotFoundError) {
    return res.status(404).json({ message: (error as Error).message });
  }
  if (error instanceof Service.ProjectNotAllowedError) {
    return res.status(403).json({ message: (error as Error).message });
  }
  if (error instanceof Service.EmptyUpdateError) {
    return res.status(400).json({ message: (error as Error).message });
  }
  return res.status(500).json({ message: "Error processing the review" });
}

export async function getICReview(req: Request, res: Response) {
  const icId = paramId(req.params.id);
  if (icId === null) return res.status(400).json({ message: "Invalid ID" });
  try {
    res.status(200).json(await Service.getICReview(icId, req.user!.id));
  } catch (error) {
    sendError(res, error);
  }
}

export async function createReview(req: Request, res: Response) {
  const icId = paramId(req.params.id);
  if (icId === null) return res.status(400).json({ message: "Invalid ID" });

  const parsed = parseBody(req.body ?? {}, "create");
  if (parsed.error) return res.status(400).json({ message: parsed.error });

  try {
    const entry = await Service.createReview(
      icId,
      req.user!.id,
      parsed.value as ReviewInput & { occurred_on: string; origin: string; text: string; score: number }
    );
    res.status(201).json(entry);
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateReview(req: Request, res: Response) {
  const id = paramId(req.params.id);
  if (id === null) return res.status(400).json({ message: "Invalid ID" });

  const parsed = parseBody(req.body ?? {}, "update");
  if (parsed.error) return res.status(400).json({ message: parsed.error });

  try {
    const entry = await Service.updateReview(id, req.user!.id, parsed.value!);
    res.status(200).json(entry);
  } catch (error) {
    sendError(res, error);
  }
}

export async function deleteReview(req: Request, res: Response) {
  const id = paramId(req.params.id);
  if (id === null) return res.status(400).json({ message: "Invalid ID" });
  try {
    await Service.deleteReview(id, req.user!.id);
    res.status(204).send();
  } catch (error) {
    sendError(res, error);
  }
}

export async function getScreenshot(req: Request, res: Response) {
  const id = paramId(req.params.id);
  if (id === null) return res.status(400).json({ message: "Invalid ID" });
  try {
    res.sendFile(await Service.getScreenshotPath(id, req.user!.id));
  } catch (error) {
    sendError(res, error);
  }
}

export async function getProjects(req: Request, res: Response) {
  try {
    res.status(200).json(await Service.listProjects(req.user!.id));
  } catch {
    res.status(500).json({ message: "Error retrieving projects" });
  }
}