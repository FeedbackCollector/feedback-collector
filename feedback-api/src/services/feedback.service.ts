import * as FeedbackRepository from '../repositories/feedback.repository.ts';
import { getUserByID } from '../repositories/user.repositories.ts';
import { icFindByID } from '../repositories/ic.repository.ts';
import { getProjectByID } from '../repositories/project.repository.ts';
import { Feedback, NewFeedback, UpdateFeedback } from '../types/feedback.ts';
import { Request } from 'express'

type ReferenceError = "AUTHOR_NOT_FOUND" | "IC_NOT_FOUND" | "PROJECT_NOT_FOUND";

async function checkReferences(data: UpdateFeedback): Promise<ReferenceError | null> {
    if (data.author_id !== undefined && !(await getUserByID(data.author_id))) return "AUTHOR_NOT_FOUND";
    
        if (data.ic_id !== undefined && !(await icFindByID(data.ic_id))) return "IC_NOT_FOUND";
    
        if (data.project_id !== undefined && !(await getProjectByID(data.project_id))) return "PROJECT_NOT_FOUND";
    
        return null;
}

export async function getAllFeedbacksService(): Promise<Feedback[]> {
    return FeedbackRepository.getAllFeedbacks();
}

export async function getFeedbackByIdService(id: number): Promise<Feedback | "FEEDBACK_NOT_FOUND"> {
    const feedback = await FeedbackRepository.getFeedbackByID(id);
    
    if (!feedback) return "FEEDBACK_NOT_FOUND";
    return feedback;
}


export async function createFeedbackService(feedbackData: NewFeedback): Promise<Feedback | ReferenceError> {
    const invalid = await checkReferences(feedbackData);
    if (invalid) return invalid;

    const newFeedback = await FeedbackRepository.insertFeedback(feedbackData);
    return newFeedback[0];
}

export async function replaceFeedbackService(feedbackData: NewFeedback, id: number): Promise<Feedback | ReferenceError | "FEEDBACK_NOT_FOUND"> {
    const feedback = await FeedbackRepository.getFeedbackByID(id);
    if (!feedback) return "FEEDBACK_NOT_FOUND";

    const invalid = await checkReferences(feedbackData);
    if (invalid) return invalid;

    const replacedFeedback = await FeedbackRepository.putFeedback(feedbackData, id);
    return replacedFeedback[0];
}

export async function updateFeedbackService(feedbackData: UpdateFeedback, id: number): Promise<Feedback | ReferenceError | "FEEDBACK_NOT_FOUND"> {
    const feedback = await FeedbackRepository.getFeedbackByID(id);
    if (!feedback) return "FEEDBACK_NOT_FOUND";

    const invalid = await checkReferences(feedbackData);
    if (invalid) return invalid;

    const updatedFeedback = await FeedbackRepository.patchFeedback(feedbackData, id);
    return updatedFeedback[0];
}

export async function deleteFeedbackService(id: number): Promise<"FEEDBACK_NOT_FOUND" | "DELETED"> {
    const feedback = await FeedbackRepository.getFeedbackByID(id);
    if (!feedback) return "FEEDBACK_NOT_FOUND";

    await FeedbackRepository.deleteFeedback(id);
    return "DELETED";
}
