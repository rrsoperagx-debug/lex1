import { describe, it, expect, vi } from 'vitest';
import { AIOrchestrator } from '../AIOrchestrator';
import { IAIProvider, AIRequest, Result } from '../types';

/**
 * MOCK PROVIDER
 */
class MockProvider implements IAIProvider {
  constructor(public name: string, private success: boolean, private response: string) {}
  async processLegalRequest(request: AIRequest): Promise<Result<string>> {
    if (this.success) {
      return { success: true, data: this.response, provider: this.name };
    }
    return { success: false, error: `${this.name} failed`, provider: this.name };
  }
}

describe('AIOrchestrator Tiered Selection', () => {
  const request: AIRequest = {
    systemPrompt: 'sys',
    userPrompt: 'user content',
    templateId: 't1'
  };

  it('should select Gemini for short texts (Tier 1)', async () => {
    const gemini = new MockProvider('Gemini', true, 'short');
    const cerebras = new MockProvider('Cerebras', true, 'medium');
    const mistral = new MockProvider('MistralAI', true, 'long');
    
    const orchestrator = new AIOrchestrator([gemini, cerebras, mistral]);
    const shortRequest = { ...request, userPrompt: 'A'.repeat(500) };
    const result = await orchestrator.execute(shortRequest);

    expect(result.success).toBe(true);
    expect(result.provider).toBe('Gemini');
  });

  it('should select Cerebras for medium texts (Tier 2)', async () => {
    const gemini = new MockProvider('Gemini', true, 'short');
    const cerebras = new MockProvider('Cerebras', true, 'medium');
    const mistral = new MockProvider('MistralAI', true, 'long');
    
    const orchestrator = new AIOrchestrator([gemini, cerebras, mistral]);
    const mediumRequest = { ...request, userPrompt: 'A'.repeat(5000) };
    const result = await orchestrator.execute(mediumRequest);

    expect(result.success).toBe(true);
    expect(result.provider).toBe('Cerebras');
  });

  it('should failover to MistralAI if Tier 1 or 2 fails', async () => {
    const gemini = new MockProvider('Gemini', false, 'fail');
    const mistral = new MockProvider('MistralAI', true, 'success');
    
    const orchestrator = new AIOrchestrator([gemini, mistral]);
    const shortRequest = { ...request, userPrompt: 'A'.repeat(500) };
    const result = await orchestrator.execute(shortRequest);

    expect(result.success).toBe(true);
    expect(result.provider).toBe('MistralAI');
  });
});
