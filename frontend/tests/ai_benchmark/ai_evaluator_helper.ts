import { antigravityAI, EvaluationResult } from '../../services/antigravityAI';

/**
 * Judge helper - evaluates if AI response adheres to Lexportal rules
 */
export async function validateAgainstRules(aiResponse: string, checklist: string[]): Promise<EvaluationResult> {
    return await antigravityAI.evaluate(aiResponse, checklist);
}
