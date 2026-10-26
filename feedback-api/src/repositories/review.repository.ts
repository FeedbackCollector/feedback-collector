import { QueryTypes } from "sequelize";
import { sequelize } from "../db/connection.js";
import { ICs } from "../models/ic.js";
import { Review } from "../models/review.js";
import type { ReviewChanges, NewReview } from "../types/review.js";

export function findOwnedIC(icId: number, managerId: number) {
  return ICs.findOne({ where: { IC_id: icId, manager_id: managerId } });
}

export function findReviewByIC(icId: number) {
  return Review.findAll({
    where: { ic_id: icId },
    order: [["occurred_on", "DESC"], ["review_id", "DESC"]],
  });
}

export async function findOwnedReview(reviewId: number, managerId: number) {
  const row = await Review.findByPk(reviewId);
  if (!row) return null;
  const ic = await findOwnedIC(row.ic_id, managerId);
  return ic ? row : null;
}

export function createReview(data: NewReview) {
  return Review.create(data);
}

export function updateReview(row: Review, changes: ReviewChanges) {
  return row.update(changes);
}

export function deleteReview(row: Review) {
  return row.destroy();
}

export async function syncICEntries(icId: number) {
  const count = await Review.count({ where: { ic_id: icId } });
  await ICs.update({ entries: count }, { where: { IC_id: icId } });
}

export async function projectBelongsToManager(projectId: number, managerId: number) {
  const rows = await sequelize.query(
    `SELECT 1 FROM project_managers WHERE project_id = :projectId AND manager_id = :managerId LIMIT 1`,
    { replacements: { projectId, managerId }, type: QueryTypes.SELECT }
  );
  return rows.length > 0;
}

export async function listProjectsOfManager(managerId: number) {
  return sequelize.query<{ id: number; name: string }>(
    `SELECT p.id, p.name FROM projects p
     JOIN project_managers pm ON pm.project_id = p.id
     WHERE pm.manager_id = :managerId ORDER BY p.name`,
    { replacements: { managerId }, type: QueryTypes.SELECT }
  );
}

export async function findProjectNames(ids: number[]) {
  const names = new Map<number, string>();
  if (ids.length === 0) return names;
  const rows = await sequelize.query<{ id: number; name: string }>(
    `SELECT id, name FROM projects WHERE id IN (:ids)`,
    { replacements: { ids }, type: QueryTypes.SELECT }
  );
  for (const r of rows) names.set(r.id, r.name);
  return names;
}