import { config } from "@/config/env";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import CircuitBreaker from "opossum";

export interface AiProvider {
  generate(prompt: string, options?: { temperature?: number; maxTokens?: number }): Promise<string>;
  stream?(prompt: string, options?: { temperature?: number }): AsyncIterable<string>;
}

class OpenAIProvider implements AiProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: config.openai.apiKey });
  }

  async generate(prompt: string, options?: { temperature?: number; maxTokens?: number }): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a brand naming expert. Return only valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
    });
    return response.choices[0]?.message?.content ?? "";
  }
}

class AnthropicProvider implements AiProvider {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: config.anthropic.apiKey });
  }

  async generate(prompt: string, options?: { temperature?: number; maxTokens?: number }): Promise<string> {
    const response = await this.client.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: options?.maxTokens ?? 2000,
      temperature: options?.temperature ?? 0.7,
      system: "You are a brand naming expert. Return only valid JSON.",
      messages: [{ role: "user", content: prompt }],
    });
    const block = response.content[0];
    if (block?.type === "text") return block.text;
    return "";
  }
}

class FallbackAiProvider implements AiProvider {
  private primary: AiProvider;
  private secondary: AiProvider;
  private breaker: CircuitBreaker<string>;

  constructor() {
    this.primary = new OpenAIProvider();
    this.secondary = new AnthropicProvider();

    this.breaker = new CircuitBreaker<string>(async (prompt, options) => {
      return this.primary.generate(prompt as string, options as { temperature?: number; maxTokens?: number });
    }, {
      timeout: 15000,
      errorThresholdPercentage: 30,
      resetTimeout: 30000,
      name: "ai-provider",
    });
  }

  async generate(prompt: string, options?: { temperature?: number; maxTokens?: number }): Promise<string> {
    try {
      return await this.breaker.fire(prompt, options);
    } catch {
      console.warn("Primary AI provider failed, falling back to secondary");
      return this.secondary.generate(prompt, options);
    }
  }
}

class NVIDIAProvider implements AiProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.nvidia.apiKey,
      baseURL: config.nvidia.apiUrl,
    });
  }

  async generate(prompt: string, options?: { temperature?: number; maxTokens?: number }): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: config.nvidia.model,
      messages: [
        { role: "system", content: "You are a brand naming expert. Return only valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
    });
    return response.choices[0]?.message?.content ?? "";
  }
}

class AerolinkProvider implements AiProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.aerolink.apiKey,
      baseURL: config.aerolink.apiUrl,
    });
  }

  async generate(prompt: string, options?: { temperature?: number; maxTokens?: number }): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: config.aerolink.model,
      messages: [
        { role: "system", content: "You are a brand naming expert. Return only valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
    });
    return response.choices[0]?.message?.content ?? "";
  }
}

export function createAiProvider(): AiProvider {
  if (config.openai.apiKey && config.anthropic.apiKey) return new FallbackAiProvider();
  if (config.aerolink.apiKey) return new AerolinkProvider();
  if (config.openai.apiKey) return new OpenAIProvider();
  if (config.anthropic.apiKey) return new AnthropicProvider();
  if (config.nvidia.apiKey) return new NVIDIAProvider();
  throw new Error("No AI provider configured (set OPENAI_API_KEY, ANTHROPIC_API_KEY, NVIDIA_API_KEY, or AEROLINK_API_KEY)");
}
