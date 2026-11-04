import { Request, Response } from "express";
import * as AreaRepository from "../repositories/area.repository.ts";

export async function getAll(req: Request, res: Response) {
    try {
        const areas = await AreaRepository.getAllAreas();
        return res.json({ data: areas });
    } catch (error) {
        return res.status(500).json({ error: "Error retrieving areas" });
    }
}
