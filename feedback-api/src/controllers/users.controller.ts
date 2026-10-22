import { Request, Response } from 'express';
import { registerService, loginService } from '../services/user.services.ts';

export async function register(req: Request, res: Response) {
    const result = await registerService(req.body.email, req.body.password , req.body.name , req.body.area_id);
    if (result === "EMAIL_TAKEN") return res.status(409).json({ error: "Email already registered" });
    res.status(201).json({ message: "Usuario creado" });
}

export async function login(req: Request, res: Response) {
    const result = await loginService(req.body.email, req.body.password);
    if (result === "INVALID_CREDENTIALS") return res.status(400).json({ message: "Credenciales inválidas" });
    res.json({ token: result });
}

