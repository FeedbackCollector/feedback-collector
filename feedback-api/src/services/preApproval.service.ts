import * as PreApprovalRepository from '../repositories/preApproval.repository.ts';
import * as UsersRepository from '../repositories/user.repositories.ts';
import { sendEmailPreApprovedEmail } from './mail.service.ts';

export async function listPreApprovedService() {
    return PreApprovalRepository.listPreApprovedEmails();
}

export async function addPreApprovedService(email: string): Promise<"EMAIL_TAKEN" | "ALREADY_PRE_APPROVED" | Awaited<ReturnType<typeof PreApprovalRepository.insertPreApprovedEmail>>> {
    const normalized = email.trim().toLowerCase();
    if (await UsersRepository.getUserByEmail(normalized)) return "EMAIL_TAKEN";
    if (await PreApprovalRepository.findPreApprovedEmail(normalized)) return "ALREADY_PRE_APPROVED";
    const row = await PreApprovalRepository.insertPreApprovedEmail(normalized);

    sendEmailPreApprovedEmail(normalized).catch((err: unknown) =>
        console.error('Could not send pre-approval email:', err instanceof Error ? err.message : err),
    );
    return row;
}

export async function removePreApprovedService(email: string): Promise<"NOT_FOUND" | "DELETED"> {
    const deleted = await PreApprovalRepository.deletePreApprovedEmail(email.trim().toLowerCase());
    return deleted ? "DELETED" : "NOT_FOUND";
}
