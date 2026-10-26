import path from "node:path";
import * as Repo from "../repositories/review.repository.js";
import { removeScreenshot, saveScreenshot, SCREENSHOT_DIR } from "../utils/screenshot.js";
import type { Review } from "../models/review.js";
import type { ReviewEntry, ReviewInput, ICReview, NewReview } from "../types/review.js";

export class ICNotFoundError extends Error {
  constructor() { super("IC not found"); }
}

export class ReviewNotFoundError extends Error {
  constructor() { super("Review not found"); }
}

export class ProjectNotAllowedError extends Error {
  constructor() { super("Project not allowed for this manager"); }
}

export class EmptyUpdateError extends Error {
  constructor() { super("No fields to update"); }
}

const round1 = (n: number) => Math.round(n * 10) / 10;

async function toEntries(rows: Review[]): Promise<ReviewEntry[]> {
  const ids = [...new Set(rows.map((r) => r.project_id).filter((id): id is number => id !== null))];
  const names = await Repo.findProjectNames(ids);
  return rows.map((f) => ({
    id: f.review_id,
    date: f.occurred_on,
    source: f.origin,
    source_title: f.source_title,
    comment: f.text,
    score: f.score,
    project: f.project_id !== null ? { id: f.project_id, name: names.get(f.project_id) ?? "" } : null,
    screenshot_url: f.screenshot_path ? `/reviews/${f.review_id}/screenshot` : null,
  }));
}

async function requireOwnedIC(icId: number, managerId: number) {
  const ic = await Repo.findOwnedIC(icId, managerId);
  if (!ic) throw new ICNotFoundError();
  return ic;
}

async function requireProjectOfManager(projectId: number | null | undefined, managerId: number) {
  if (projectId === null || projectId === undefined) return;
  if (!(await Repo.projectBelongsToManager(projectId, managerId))) throw new ProjectNotAllowedError();
}

export async function getICReview(icId: number, managerId: number): Promise<ICReview> {
  const ic = await requireOwnedIC(icId, managerId);
  const rows = await Repo.findReviewByIC(icId);
  const sum = rows.reduce((acc, r) => acc + r.score, 0);

  return {
    ic: { IC_id: ic.IC_id, name: ic.name, title: ic.title },
    stats: { entries: rows.length, average: rows.length ? round1(sum / rows.length) : null },
    trend: [...rows].reverse().map((r) => r.score),
    entries: await toEntries(rows),
  };
}

export async function createReview(
  icId: number,
  managerId: number,
  input: ReviewInput & { occurred_on: string; origin: string; text: string; score: number }
): Promise<ReviewEntry> {
  await requireOwnedIC(icId, managerId);
  await requireProjectOfManager(input.project_id, managerId);

  const screenshotFile = input.screenshot ? await saveScreenshot(input.screenshot) : null;

  const data: NewReview = {
    ic_id: icId,
    author_id: managerId,
    project_id: input.project_id ?? null,
    origin: input.origin,
    source_title: input.source_title || null,
    text: input.text,
    score: input.score,
    occurred_on: input.occurred_on,
    screenshot_path: screenshotFile,
  };

  try {
    const row = await Repo.createReview(data);
    await Repo.syncICEntries(icId);
    const [entry] = await toEntries([row]);
    return entry;
  } catch (error) {
    removeScreenshot(screenshotFile);   
    throw error;
  }
}

export async function updateReview(
  reviewId: number,
  managerId: number,
  input: ReviewInput
): Promise<ReviewEntry> {
  const row = await Repo.findOwnedReview(reviewId, managerId);
  if (!row) throw new ReviewNotFoundError();

  await requireProjectOfManager(input.project_id, managerId);

  const changes: Record<string, unknown> = {};
  if (input.occurred_on !== undefined) changes.occurred_on = input.occurred_on;
  if (input.project_id !== undefined) changes.project_id = input.project_id;
  if (input.origin !== undefined) changes.origin = input.origin;
  if (input.source_title !== undefined) changes.source_title = input.source_title || null;
  if (input.text !== undefined) changes.text = input.text;
  if (input.score !== undefined) changes.score = input.score;

  const oldScreenshot = row.screenshot_path;
  const newScreenshot = input.screenshot ? await saveScreenshot(input.screenshot) : undefined;
  if (newScreenshot) changes.screenshot_path = newScreenshot;
  else if (input.remove_screenshot) changes.screenshot_path = null;

  if (Object.keys(changes).length === 0) throw new EmptyUpdateError();

  try {
    await Repo.updateReview(row, changes);
  } catch (error) {
    removeScreenshot(newScreenshot);  
    throw error;
  }
  if ((newScreenshot || input.remove_screenshot) && oldScreenshot) removeScreenshot(oldScreenshot);

  const [entry] = await toEntries([row]);
  return entry;
}

export async function deleteReview(reviewId: number, managerId: number): Promise<void> {
  const row = await Repo.findOwnedReview(reviewId, managerId);
  if (!row) throw new ReviewNotFoundError();

  const icId = row.ic_id;
  const screenshot = row.screenshot_path;
  await Repo.deleteReview(row);
  await Repo.syncICEntries(icId);
  removeScreenshot(screenshot);
}

export async function getScreenshotPath(reviewId: number, managerId: number): Promise<string> {
  const row = await Repo.findOwnedReview(reviewId, managerId);
  if (!row?.screenshot_path) throw new ReviewNotFoundError();
  return path.join(SCREENSHOT_DIR, row.screenshot_path);
}

export function listProjects(managerId: number) {
  return Repo.listProjectsOfManager(managerId);
}