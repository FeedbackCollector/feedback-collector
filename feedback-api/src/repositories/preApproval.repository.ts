import { PreApprovedEmail } from "../models/PreApprovedEmail.ts";

export async function listPreApprovedEmails() {
    const rows = await PreApprovedEmail.findAll({ order: [['created_at', 'DESC']] });
    return rows.map(row => row.toJSON());
}

export async function findPreApprovedEmail(email: string) {
    const row = await PreApprovedEmail.findByPk(email);
    return row ? row.toJSON() : null;
}

export async function insertPreApprovedEmail(email: string) {
    const row = await PreApprovedEmail.create({ email });
    return row.toJSON();
}

export async function deletePreApprovedEmail(email: string): Promise<boolean> {
    const deleted = await PreApprovedEmail.destroy({ where: { email } });
    return deleted > 0;
}
