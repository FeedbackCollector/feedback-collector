import { Request, Response } from 'express';
import { getAllUsersService, getUserByIdService, createUserService, updateUserService, deleteUserService, registerService, changePasswordService, loginService } from '../services/user.services.ts';

export async function getAll(req: Request, res: Response) {
    const result = await getAllUsersService(res.locals.query);
    return res.json({ data: result });
}

export async function getById(req: Request, res: Response) {
    const result = await getUserByIdService(Number(req.params.id));
    if (result === "USER_NOT_FOUND") return res.status(404).json({ error: "User not found" });
    return res.json({ data: result });
}

export async function create(req: Request, res: Response) {
    const result = await createUserService(req.body);
    if (result === "AREA_NOT_FOUND") return res.status(400).json({ error: "Area not found" });
    if (result === "EMAIL_TAKEN") return res.status(409).json({ error: "Email already registered" });
    return res.status(201).json({ data: result });
}

export async function update(req: Request, res: Response) {
    const result = await updateUserService(req.body, Number(req.params.id));
    if (result === "USER_NOT_FOUND") return res.status(404).json({ error: "User not found" });
    if (result === "AREA_NOT_FOUND") return res.status(400).json({ error: "Area not found" });
    if (result === "EMAIL_TAKEN") return res.status(409).json({ error: "Email already registered" });
    return res.json({ data: result });
}

export async function remove(req: Request, res: Response) {
    const result = await deleteUserService(Number(req.params.id), res.locals.user.id);
    if (result === "USER_NOT_FOUND") return res.status(404).json({ error: "User not found" });
    if (result === "CANNOT_DELETE_SELF") return res.status(409).json({ error: "You cannot delete your own user" });
    if (result === "USER_HAS_ICS") return res.status(409).json({ error: "User has ICs assigned" });
    if (result === "USER_HAS_FEEDBACK") return res.status(409).json({ error: "User has authored feedback" });
    return res.status(204).send();
}

export async function register(req: Request, res: Response) {
    const result = await registerService(req.body.email, req.body.password , req.body.name , req.body.area_id);
    if (result === "AREA_NOT_FOUND") return res.status(400).json({ error: "Area not found" });
    if (result === "EMAIL_TAKEN") return res.status(409).json({ error: "Email already registered" });
    res.status(201).json({ message: "Usuario creado" });
}

export async function login(req: Request, res: Response) {
    const result = await loginService(req.body.email, req.body.password);
    if (result === "INVALID_CREDENTIALS") return res.status(400).json({ message: "Invalid credentials" });
    res.json({ token: result });
}


export async function changePassword(req: Request, res: Response) {
    const result = await changePasswordService(res.locals.user.id, req.body.currentPassword, req.body.newPassword);
    if (result === "INVALID_CREDENTIALS") return res.status(400).json({ message: "Invalid credentials" });
    res.json({ message: "Password updated" });
}
