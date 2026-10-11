import { GoogleGenerativeAI } from '@google/generative-ai';
import { validateAiJson } from './aiValidation.js';
import { z } from 'zod';

export interface AIProviderConfig {
  apiKey?: string;
  modelName: string;
  timeoutMs: number;
  maxRetries: number;
  fallbackMode: 'deterministic' | 'none';
}

export interface AIResponse<T> {
  data: T;
  isAiGenerated: boolean;
  provider: 'gemini' | 'deterministic';
  modelVersion: string;
  latencyMs: number;
  tokenUsage?: { promptTokens?: number; completionTokens?: number };
}

export interface IAIProvider {
  generateStructuredJson<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    systemInstruction?: string
  ): Promise<AIResponse<T>>;
}

/**
 * Production AI Provider Service
 * Manages Google Gemini integration, retries, timeouts, and deterministic fallback.
 */
export class AIProviderService implements IAIProvider {
  private config: AIProviderConfig;
  private geminiClient: GoogleGenerativeAI | null = null;

  constructor(customConfig?: Partial<AIProviderConfig>) {
    const apiKey = customConfig?.apiKey || process.env.GEMINI_API_KEY;
    const modelName = customConfig?.modelName || process.env.AI_MODEL_VERSION || 'gemini-1.5-flash';
    const timeoutMs = customConfig?.timeoutMs || 10000;
    const maxRetries = customConfig?.maxRetries ?? 2;
    const fallbackMode = customConfig?.fallbackMode || (process.env.AI_FALLBACK_MODE as any) || 'deterministic';

    this.config = {
      apiKey,
      modelName,
      timeoutMs,
      maxRetries,
      fallbackMode,
    };

    if (apiKey && apiKey.length > 10 && apiKey !== 'your_google_gemini_api_key_here') {
      try {
        this.geminiClient = new GoogleGenerativeAI(apiKey);
      } catch (err) {
        console.warn('[AIProviderService] Warning: Could not initialize Gemini client, defaulting to deterministic fallback.');
      }
    }
  }

  public isGeminiConfigured(): boolean {
    return this.geminiClient !== null;
  }

  public getModelName(): string {
    return this.config.modelName;
  }

  /**
   * Generates structured JSON output using Gemini with automatic fallback on failure or missing API key.
   */
  public async generateStructuredJson<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    systemInstruction?: string,
    deterministicFallbackGenerator?: () => T
  ): Promise<AIResponse<T>> {
    const startTime = Date.now();

    // If Gemini is not configured, directly invoke deterministic fallback
    if (!this.geminiClient) {
      if (deterministicFallbackGenerator) {
        return {
          data: deterministicFallbackGenerator(),
          isAiGenerated: false,
          provider: 'deterministic',
          modelVersion: 'deterministic-v1',
          latencyMs: Date.now() - startTime,
        };
      }
      throw new Error('Gemini API key is not configured and no deterministic fallback generator was provided.');
    }

    let lastError: Error | null = null;
    let attempts = 0;

    while (attempts <= this.config.maxRetries) {
      attempts++;
      try {
        const result = await this.callGeminiWithTimeout(prompt, systemInstruction);
        const validated = validateAiJson(schema, result.text);

        if (validated.success) {
          return {
            data: validated.data,
            isAiGenerated: true,
            provider: 'gemini',
            modelVersion: this.config.modelName,
            latencyMs: Date.now() - startTime,
            tokenUsage: result.tokenUsage,
          };
        } else {
          lastError = new Error(`AI structured output schema validation failed: ${validated.error}`);
        }
      } catch (err: any) {
        lastError = err;
        // Exponential backoff before retry
        if (attempts <= this.config.maxRetries) {
          await new Promise((res) => setTimeout(res, attempts * 500));
        }
      }
    }

    // If all retries failed and fallback mode is active
    if (this.config.fallbackMode === 'deterministic' && deterministicFallbackGenerator) {
      console.warn(`[AIProviderService] AI call failed after ${attempts} attempts (${lastError?.message}). Using deterministic fallback.`);
      return {
        data: deterministicFallbackGenerator(),
        isAiGenerated: false,
        provider: 'deterministic',
        modelVersion: 'deterministic-fallback',
        latencyMs: Date.now() - startTime,
      };
    }

    throw lastError || new Error('Failed to generate structured AI response');
  }

  private async callGeminiWithTimeout(
    prompt: string,
    systemInstruction?: string
  ): Promise<{ text: string; tokenUsage?: { promptTokens?: number; completionTokens?: number } }> {
    if (!this.geminiClient) throw new Error('Gemini client not initialized');

    const model = this.geminiClient.getGenerativeModel({
      model: this.config.modelName,
      systemInstruction: systemInstruction || 'You are an expert AI recruiting and resume analysis assistant. Output strictly valid JSON.',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`AI generation timed out after ${this.config.timeoutMs}ms`)), this.config.timeoutMs)
    );

    const callPromise = model.generateContent(prompt).then((res) => {
      const candidate = res.response;
      return {
        text: candidate.text(),
        tokenUsage: {
          promptTokens: candidate.usageMetadata?.promptTokenCount,
          completionTokens: candidate.usageMetadata?.candidatesTokenCount,
        },
      };
    });

    return Promise.race([callPromise, timeoutPromise]);
  }
}

export const aiProvider = new AIProviderService();
