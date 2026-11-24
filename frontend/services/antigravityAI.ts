/**
 * AntigravityAI Service
 * Frontend wrapper for LexPortal AI (LLM-as-a-Judge ready)
 */

export interface EvaluationResult {
  score: number;
  missing_elements: string[];
  is_tech_compliant: boolean;
  legal_risk: 'low' | 'medium' | 'high';
  comment: string;
}

export class AntigravityAI {
  // In Node.js (vitest), fetch requires an absolute URL.
  // In browser (Vite), relative '/api/v1/ai' works fine via proxy.
  private baseUrl: string = (typeof process !== 'undefined' && process.env.BASE_URL && process.env.BASE_URL !== '/')
    ? `${process.env.BASE_URL}/api/v1/ai`
    : 'http://localhost:8000/api/v1/ai';


  /**
   * Generates a response from the AI model
   */
  async generate(prompt: string, sessionId: string = 'benchmark'): Promise<string> {
    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, session_id: sessionId }),
    });

    if (!response.ok) {
      throw new Error(`AI Generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.text;
  }

  /**
   * Evaluates a text against a checklist using LLM-as-a-Judge
   */
  async evaluate(textToEvaluate: string, checklist: string[]): Promise<EvaluationResult> {
    const response = await fetch(`${this.baseUrl}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text_to_evaluate: textToEvaluate, checklist }),
    });

    if (!response.ok) {
      throw new Error(`AI Evaluation failed: ${response.statusText}`);
    }

    return await response.json();
  }
}

export const antigravityAI = new AntigravityAI();
