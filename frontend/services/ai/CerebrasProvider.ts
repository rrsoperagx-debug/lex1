import axios from 'axios';
import { IAIProvider, AIRequest, Result } from './types';

/**
 * CEREBRAS PROVIDER - Ultra-fast inference layer
 * Zintegrowane zgodnie z LEXPORTAL v2.0 (Tier 2).
 */
export class CerebrasProvider implements IAIProvider {
  readonly name = 'Cerebras';
  private readonly apiKey: string = "csk-tppcfe4tv3hjv698hhmvyjt5e368hw884jrdf4wvyfkxt6y8";
  private readonly endpoint: string = "https://api.cerebras.ai/v1/chat/completions";

  async processLegalRequest(request: AIRequest): Promise<Result<string>> {
    try {
      const response = await axios.post(
        this.endpoint,
        {
          model: "llama3.1-70b", 
          messages: [
            { role: "system", content: request.systemPrompt },
            { role: "user", content: request.userPrompt }
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const content = response.data.choices[0].message.content;
      
      if (!content) {
        return { success: false, error: "Empty response from Cerebras", provider: this.name };
      }

      return { success: true, data: content, provider: this.name };

    } catch (error: any) {
      console.error(`[AI_ERROR] [${this.name}] Failure: ${error.message}`);
      return { 
        success: false, 
        error: `Cerebras Error: ${error.response?.data?.message || error.message}`, 
        provider: this.name 
      };
    }
  }
}
