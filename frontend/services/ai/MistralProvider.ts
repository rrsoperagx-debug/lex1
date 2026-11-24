import axios from 'axios';
import { Result, AIRequest, IAIProvider } from './types';

/**
 * MISTRAL AI PROVIDER
 * Zabezpieczenie (Fallback) dla systemu Lexportal zgodnie z zasadami v2.0.
 */
export class MistralProvider implements IAIProvider {
  readonly name = 'MistralAI';
  
  // UWAGA: Klucz API docelowo powinien być pobierany z process.env.MISTRAL_API_KEY
  private readonly apiKey: string = "1yTxtJEZD6UetIR0v05WkWayonz6BkGs";
  private readonly endpoint: string = "https://api.mistral.ai/v1/chat/completions";

  async processLegalRequest(request: AIRequest): Promise<Result<string>> {
    try {
      const response = await axios.post(
        this.endpoint,
        {
          model: "mistral-large-latest", // Najwyższa precyzja prawna dla tekstów po polsku
          messages: [
            { role: "system", content: request.systemPrompt },
            { role: "user", content: request.userPrompt }
          ],
          temperature: request.temperature ?? 0.1,
          response_format: { type: "json_object" } // Wymuszamy format JSON (Lexportal v2.0)
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30s timeout dla stabilności
        }
      );

      const content = response.data.choices[0].message.content;
      
      if (!content) {
        return { success: false, error: "Empty response from Mistral", provider: this.name };
      }

      return { success: true, data: content, provider: this.name };

    } catch (error: any) {
      // Logowanie błędu do konsoli (w produkcji do Audit Log bez danych wrażliwych)
      console.error(`[AI_ERROR] [${this.name}] Failure: ${error.message}`);
      
      const errorMessage = error.response?.data?.message || error.message;
      return { 
        success: false, 
        error: `Mistral Provider Error: ${errorMessage}`,
        provider: this.name 
      };
    }
  }
}
