import { Result, AIRequest, IAIProvider } from './types';

/**
 * AI ORCHESTRATOR
 * Zarządza procesem "Failover" i "Tiered Selection" pomiędzy dostawcami AI.
 * Zgodny z zasadami v2.0: Resilience, Audit Logging & Performance Optimization.
 */
export class AIOrchestrator {
  private providers: Map<string, IAIProvider>;

  constructor(providers: IAIProvider[]) {
    this.providers = new Map(providers.map(p => [p.name, p]));
  }

  /**
   * Inteligentny wybór modelu na podstawie długości tekstu (Tiered Selection).
   */
  private getOptimizedProvider(textLength: number): IAIProvider {
    if (textLength < 2000) return this.providers.get('Gemini')! || Array.from(this.providers.values())[0];
    if (textLength < 7000) return this.providers.get('Cerebras')! || this.providers.get('Gemini')!;
    return this.providers.get('MistralAI')! || Array.from(this.providers.values())[0];
  }

  /**
   * Wykonuje zapytanie do AI z automatyczną obsługą błędów i inteligentnym wyborem.
   */
  async execute(request: AIRequest): Promise<Result<string>> {
    const primary = this.getOptimizedProvider(request.userPrompt.length);
    
    // Budujemy łańcuch fallbacku: Primary -> Mistral AI (najbardziej stabilny)
    const executionOrder = [primary];
    const mistral = this.providers.get('MistralAI');
    if (mistral && primary.name !== 'MistralAI') {
      executionOrder.push(mistral);
    }

    let lastError = "";

    for (const provider of executionOrder) {
      console.log(`[AI_ORCHESTRATOR] Attempting request via: ${provider.name}`);
      
      const result = await provider.processLegalRequest(request);

      if (result.success) {
        // Logowanie sukcesu do Audit Log (v2.0 requirement)
        this.logAudit(result.provider, result.data);
        return result;
      }

      lastError = (result as any).error || "Unknown error";
      console.warn(`[AI_ORCHESTRATOR] Provider ${provider.name} failed. Trying next... Error: ${lastError}`);
    }

    return { 
      success: false, 
      error: `All AI providers failed. Last error: ${lastError}` 
    };
  }

  /**
   * Implementacja Audit Log zgodnie z punktem 5 LEXPORTAL RULES v2.0.
   */
  private logAudit(provider: string, data: string): void {
    console.log(`[AUDIT_LOG] Content processed by ${provider}. Length: ${data.length} chars.`);
  }
}
