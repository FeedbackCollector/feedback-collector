import type { Request, Response } from "express";
import {
  ManagerNotFoundError,
  createIC,
  getIC,
  listICs,
  removeIC,
  updateIC,
} from "../services/ic.service.js";

const isPositiveInt = (v: unknown) => Number.isInteger(v) && Number(v) >= 1;
const isNonNegativeInt = (v: unknown) => Number.isInteger(v) && Number(v) >= 0;
const isNonEmptyString = (v: unknown) => typeof v === "string" && v.trim() !== "";

// GET /ics
export async function getICs (req: Request, res: Response) {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const managerId =
      req.query.manager_id !== undefined
        ? Number(req.query.manager_id)
        : undefined;

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100 ||
      (managerId !== undefined &&
        (!Number.isInteger(managerId) || managerId < 1))
    ) {
      res.status(400).json({ message: "Invalid search parameters" });
      return;
    }

    const result = await listICs({
      name: typeof req.query.name === "string" ? req.query.name : undefined,
      title: typeof req.query.title === "string" ? req.query.title : undefined,
      manager_id: managerId, page, limit,
    });

    res.status(200).json(result);
  } catch {
    res.status(500).json({ message: "Error retrieving ICs" });
  }
};

// GET /ics/:id
export async function getICsByID (req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ message: "Invalid ID" });
      return;
    }

    const ic = await getIC(id);

    if (!ic) {
      res.status(404).json({ message: "IC not found" });
      return;
    }

    res.status(200).json(ic);
  } catch {
    res.status(500).json({ message: "Error retrieving the IC" });
  }
};

// POST /ics
export async function postIC (req: Request, res: Response) {
  try {
    const { name, title, manager_id, entries } = req.body as {
      name?: unknown;
      title?: unknown;
      manager_id?: unknown;
      entries?: unknown;
    };

    if (
      !isNonEmptyString(name) ||
      !isNonEmptyString(title) ||
      !isPositiveInt(manager_id) ||
      !isNonNegativeInt(entries)
    ) {
      res.status(400).json({ message: "Invalid IC data" });
      return;
    }

    const ic = await createIC({
      name: (name as string).trim(),
      title: (title as string).trim(),
      manager_id: Number(manager_id),
      entries: Number(entries),
    });

    res.status(201).json(ic);
  } catch (error) {
    if (error instanceof ManagerNotFoundError) {
      res.status(400).json({ message: "Manager not found" });
      return;
    }
    res.status(500).json({ message: "Error creating the IC" });
  }
};

// PATCH /ics/:id
export async function patchIC (req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ message: "Invalid ID" });
      return;
    }

    const { name, title, manager_id, entries } = req.body as {
      name?: unknown;
      title?: unknown;
      manager_id?: unknown;
      entries?: unknown;
    };

    if (
      (name !== undefined && !isNonEmptyString(name)) ||
      (title !== undefined && !isNonEmptyString(title)) ||
      (manager_id !== undefined && !isPositiveInt(manager_id)) ||
      (entries !== undefined && !isNonNegativeInt(entries)) ||
      (name === undefined &&
        title === undefined &&
        manager_id === undefined &&
        entries === undefined)
    ) {
      res.status(400).json({ message: "Invalid update data" });
      return;
    }

    const ic = await updateIC(id, {
      ...(name !== undefined ? { name: (name as string).trim() } : {}),
      ...(title !== undefined ? { title: (title as string).trim() } : {}),
      ...(manager_id !== undefined ? { manager_id: Number(manager_id) } : {}),
      ...(entries !== undefined ? { entries: Number(entries) } : {}),
    });

    if (!ic) {
      res.status(404).json({ message: "IC not found" });
      return;
    }

    res.status(200).json(ic);
  } catch (error) {
    if (error instanceof ManagerNotFoundError) {
      res.status(400).json({ message: "Manager not found" });
      return;
    }
    res.status(500).json({ message: "Error updating the IC" });
  }
};

// DELETE /ics/:id
export async function deleteIC (req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ message: "Invalid ID" });
      return;
    }

    const deleted = await removeIC(id);

    if (!deleted) {
      res.status(404).json({ message: "IC not found" });
      return;
    }

    res.status(204).send();
  } catch {
    res.status(500).json({ message: "Error deleting the IC" });
  }
};
