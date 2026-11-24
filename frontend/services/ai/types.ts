/**
 * LEXPORTAL AI ORCHESTRATION TYPES
 * Zgodne z v2.0: Strict Functional Programming i Result/Either Pattern.
 */

export type Result<T> =
  | { success: true; data: T; provider: string }
  | { success: false; error: string; provider?: string };

export interface AIRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  templateId?: string;
}

export interface IAIProvider {
  readonly name: string;
  processLegalRequest(request: AIRequest): Promise<Result<string>>;
}
