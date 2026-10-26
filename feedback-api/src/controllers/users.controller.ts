import { Request, Response } from 'express';
import { registerService, loginService, changePasswordService } from '../services/user.services.js';

export async function register(req: Request, res: Response) {
    const result = await registerService(req.body.email, req.body.password , req.body.name , req.body.area_id);
    if (result === "EMAIL_TAKEN") return res.status(409).json({ error: "Email already registered" });
    res.status(201).json({ message: "Usuario creado" });
}

export async function login(req: Request, res: Response) {
    const result = await loginService(req.body.email, req.body.password);
    if (result === "INVALID_CREDENTIALS") return res.status(400).json({ message: "Invalid credentials" });
    res.json({ token: result });
}


export async function changePassword(req: Request, res: Response) {
    const result = await changePasswordService(res.locals.user.email, req.body.currentPassword, req.body.newPassword);
    if (result === "INVALID_CREDENTIALS") return res.status(400).json({ message: "Invalid credentials" });
    res.json({ message: "Password updated" });
}
