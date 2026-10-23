import {
  icCreate,
  icDelete,
  icFindAll,
  icFindByID,
  icUpdate,
  managerExists,
} from "../repositories/ic.repository.js";

export class ManagerNotFoundError extends Error {
  constructor() {
    super("Manager not found");
  }
}

type ICFilters = Parameters<typeof icFindAll>[0];
type NewICData = Parameters<typeof icCreate>[0];
type ICChanges = Parameters<typeof icUpdate>[1];

// manager_id must match a user with the manager role.
async function assertManagerExists(managerId: number) {
  if (!(await managerExists(managerId))) {
    throw new ManagerNotFoundError();
  }
}

export function listICs(filters: ICFilters) {
  return icFindAll(filters);
}

export function getIC(id: number) {
  return icFindByID(id);
}

export async function createIC(data: NewICData) {
  await assertManagerExists(data.manager_id);
  return icCreate(data);
}

export async function updateIC(id: number, data: ICChanges) {
  if (data.manager_id !== undefined) await assertManagerExists(data.manager_id);
  return icUpdate(id, data);
}

export function removeIC(id: number) {
  return icDelete(id);
}
