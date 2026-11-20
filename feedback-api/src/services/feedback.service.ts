import * as FeedbackRepository from '../repositories/feedback.repository.ts';
import { toCsv } from '../utils/csv.ts';
import { getUserByID } from '../repositories/user.repositories.ts';
import { icFindByID } from '../repositories/ic.repository.ts';
import { getProjectByID, getProjectIdsForManager, managerHasProject } from '../repositories/project.repository.ts';
import { Feedback, FeedbackFilters, NewFeedback, UpdateFeedback } from '../types/feedback.ts';
import { Request } from 'express'

type Caller = { id: number; email: string; role: string };

type ReferenceError = "AUTHOR_NOT_FOUND" | "IC_NOT_FOUND" | "PROJECT_NOT_FOUND" | "PROJECT_NOT_ASSIGNED";

async function canManageIC(user: Caller, icId: number): Promise<boolean> {
    if (user.role === "director") return true;
    const ic = await icFindByID(icId);
    return !!ic && Number.isInteger(user.id) && ic.manager_id === user.id;
}

async function canManageFeedback(user: Caller, feedback: Feedback): Promise<boolean> {
    if (user.role === "director") return true;
    if (user.role !== "manager" || !(await canManageIC(user, feedback.ic_id))) return false;
    return managerHasProject(user.id, feedback.project_id);
}

async function checkReferences(data: UpdateFeedback): Promise<ReferenceError | null> {
    if (data.author_id !== undefined && !(await getUserByID(data.author_id))) return "AUTHOR_NOT_FOUND";
    
        if (data.ic_id !== undefined && !(await icFindByID(data.ic_id))) return "IC_NOT_FOUND";
    
        if (data.project_id !== undefined && !(await getProjectByID(data.project_id))) return "PROJECT_NOT_FOUND";
    
        return null;
}

export async function getAllFeedbacksService(page: number, limit: number, filters: FeedbackFilters, user: Caller) {
    if (user.role === "director") return FeedbackRepository.getAllFeedbacks(page, limit, filters);

    if (user.role === "manager" && Number.isInteger(user.id)) {
        const projectIds = await getProjectIdsForManager(user.id);
        return FeedbackRepository.getAllFeedbacks(page, limit, {
            ...filters,
            manager_id: user.id,
            project_ids: projectIds,
        });
    }
    return "FORBIDDEN" as const;
}

export async function getFeedbackByIdService(id: number, user: Caller): Promise<Feedback | "FEEDBACK_NOT_FOUND"> {
    const feedback = await FeedbackRepository.getFeedbackByID(id);
    if (!feedback) return "FEEDBACK_NOT_FOUND";

    if (!(await canManageFeedback(user, feedback))) return "FEEDBACK_NOT_FOUND";
    return feedback;
}


export async function exportFeedbackCsvService(ids: number[]): Promise<string | "FEEDBACK_NOT_FOUND"> {
    const feedbacks = await FeedbackRepository.getFeedbacksForExport(ids);
    if (feedbacks.length === 0) return "FEEDBACK_NOT_FOUND";

    return toCsv(
        ['Date', 'Subject', 'Project', 'Source', 'Score', 'Excerpt', 'Attachment'],
        feedbacks.map(feedback => [feedback.date, feedback.ic_name, feedback.project_name, feedback.source_name, feedback.score, feedback.comment, feedback.screenshot_url]),
    );
}

export async function createFeedbackService(feedbackData: NewFeedback, user: Caller): Promise<Feedback | ReferenceError> {
    if (user.role !== "director") {
        if (!(await canManageIC(user, feedbackData.ic_id))) return "IC_NOT_FOUND";
        // A manager always signs their own feedback, whatever author_id the client sent.
        feedbackData = { ...feedbackData, author_id: user.id };
    }

    const invalid = await checkReferences(feedbackData);
    if (invalid) return invalid;
    if (user.role === "manager" && !(await managerHasProject(user.id, feedbackData.project_id))) return "PROJECT_NOT_ASSIGNED";

    const newFeedback = await FeedbackRepository.insertFeedback(feedbackData);
    return newFeedback[0];
}

export async function replaceFeedbackService(feedbackData: NewFeedback, id: number, user: Caller): Promise<Feedback | ReferenceError | "FEEDBACK_NOT_FOUND"> {
    const feedback = await FeedbackRepository.getFeedbackByID(id);
    if (!feedback || !(await canManageFeedback(user, feedback))) return "FEEDBACK_NOT_FOUND";

    if (user.role !== "director") {
        if (!(await canManageIC(user, feedbackData.ic_id))) return "IC_NOT_FOUND";
        feedbackData = { ...feedbackData, author_id: user.id };
    }

    const invalid = await checkReferences(feedbackData);
    if (invalid) return invalid;
    if (user.role === "manager" && !(await managerHasProject(user.id, feedbackData.project_id))) return "PROJECT_NOT_ASSIGNED";

    const replacedFeedback = await FeedbackRepository.putFeedback(feedbackData, id);
    return replacedFeedback[0];
}

export async function updateFeedbackService(feedbackData: UpdateFeedback, id: number, user: Caller): Promise<Feedback | ReferenceError | "FEEDBACK_NOT_FOUND"> {
    const feedback = await FeedbackRepository.getFeedbackByID(id);
    if (!feedback || !(await canManageFeedback(user, feedback))) return "FEEDBACK_NOT_FOUND";

    if (user.role !== "director") {
        if (feedbackData.ic_id !== undefined && !(await canManageIC(user, feedbackData.ic_id))) return "IC_NOT_FOUND";
        if (feedbackData.author_id !== undefined) feedbackData = { ...feedbackData, author_id: user.id };
    }

    const invalid = await checkReferences(feedbackData);
    if (invalid) return invalid;
    if (user.role === "manager" && feedbackData.project_id !== undefined && !(await managerHasProject(user.id, feedbackData.project_id))) {
        return "PROJECT_NOT_ASSIGNED";
    }

    const updatedFeedback = await FeedbackRepository.patchFeedback(feedbackData, id);
    return updatedFeedback[0];
}

export async function deleteFeedbackService(id: number, user: Caller): Promise<"FEEDBACK_NOT_FOUND" | "DELETED"> {
    const feedback = await FeedbackRepository.getFeedbackByID(id);
    if (!feedback || !(await canManageFeedback(user, feedback))) return "FEEDBACK_NOT_FOUND";

    await FeedbackRepository.deleteFeedback(id);
    return "DELETED";
}
