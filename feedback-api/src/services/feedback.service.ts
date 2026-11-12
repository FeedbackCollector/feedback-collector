import * as FeedbackRepository from '../repositories/feedback.repository.ts';
import { getUserByID } from '../repositories/user.repositories.ts';
import { icFindByID } from '../repositories/ic.repository.ts';
import { getProjectByID } from '../repositories/project.repository.ts';
import { Feedback, FeedbackFilters, NewFeedback, UpdateFeedback } from '../types/feedback.ts';
import { Request } from 'express'

type Caller = { id: number; email: string; role: string };

type ReferenceError = "AUTHOR_NOT_FOUND" | "IC_NOT_FOUND" | "PROJECT_NOT_FOUND";

async function canManageIC(user: Caller, icId: number): Promise<boolean> {
    if (user.role === "director") return true;
    const ic = await icFindByID(icId);
    return !!ic && Number.isInteger(user.id) && ic.manager_id === user.id;
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
        return FeedbackRepository.getAllFeedbacks(page, limit, { ...filters, manager_id: user.id });
    }
    return "FORBIDDEN" as const;
}

export async function getFeedbackByIdService(id: number, user: Caller): Promise<Feedback | "FEEDBACK_NOT_FOUND"> {
    const feedback = await FeedbackRepository.getFeedbackByID(id);
    if (!feedback) return "FEEDBACK_NOT_FOUND";

    if (user.role !== "director") {
        const ic = await icFindByID(feedback.ic_id);
        if (!ic || ic.manager_id !== user.id) return "FEEDBACK_NOT_FOUND";
    }
    return feedback;
}


export async function createFeedbackService(feedbackData: NewFeedback, user: Caller): Promise<Feedback | ReferenceError> {
    if (user.role !== "director") {
        if (!(await canManageIC(user, feedbackData.ic_id))) return "IC_NOT_FOUND";
        // A manager always signs their own feedback, whatever author_id the client sent.
        feedbackData = { ...feedbackData, author_id: user.id };
    }

    const invalid = await checkReferences(feedbackData);
    if (invalid) return invalid;

    const newFeedback = await FeedbackRepository.insertFeedback(feedbackData);
    return newFeedback[0];
}

export async function replaceFeedbackService(feedbackData: NewFeedback, id: number, user: Caller): Promise<Feedback | ReferenceError | "FEEDBACK_NOT_FOUND"> {
    const feedback = await FeedbackRepository.getFeedbackByID(id);
    if (!feedback || !(await canManageIC(user, feedback.ic_id))) return "FEEDBACK_NOT_FOUND";

    if (user.role !== "director") {
        if (!(await canManageIC(user, feedbackData.ic_id))) return "IC_NOT_FOUND";
        feedbackData = { ...feedbackData, author_id: user.id };
    }

    const invalid = await checkReferences(feedbackData);
    if (invalid) return invalid;

    const replacedFeedback = await FeedbackRepository.putFeedback(feedbackData, id);
    return replacedFeedback[0];
}

export async function updateFeedbackService(feedbackData: UpdateFeedback, id: number, user: Caller): Promise<Feedback | ReferenceError | "FEEDBACK_NOT_FOUND"> {
    const feedback = await FeedbackRepository.getFeedbackByID(id);
    if (!feedback || !(await canManageIC(user, feedback.ic_id))) return "FEEDBACK_NOT_FOUND";

    if (user.role !== "director") {
        if (feedbackData.ic_id !== undefined && !(await canManageIC(user, feedbackData.ic_id))) return "IC_NOT_FOUND";
        if (feedbackData.author_id !== undefined) feedbackData = { ...feedbackData, author_id: user.id };
    }

    const invalid = await checkReferences(feedbackData);
    if (invalid) return invalid;

    const updatedFeedback = await FeedbackRepository.patchFeedback(feedbackData, id);
    return updatedFeedback[0];
}

export async function deleteFeedbackService(id: number, user: Caller): Promise<"FEEDBACK_NOT_FOUND" | "DELETED"> {
    const feedback = await FeedbackRepository.getFeedbackByID(id);
    if (!feedback || !(await canManageIC(user, feedback.ic_id))) return "FEEDBACK_NOT_FOUND";

    await FeedbackRepository.deleteFeedback(id);
    return "DELETED";
}
