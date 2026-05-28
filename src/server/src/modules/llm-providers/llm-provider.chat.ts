import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";
import { eq } from "drizzle-orm";
import { getDb } from "../../common/db/client.js";
import { llmProviders } from "../../common/db/schema.js";
import { DEFAULT_BASE_URLS, type ProviderType } from "./llm-provider.schema.js";

// ── LLM Factory ─────────────────────────────────────────────────────────────
// Generic utility to create an AI SDK language model from a stored provider config.
// Used by any module that needs LLM capabilities (e.g. dynamic-apis coding agent).

export async function getModelForProvider(providerId: string, modelName: string): Promise<LanguageModel> {
  const db = getDb();
  const provider = db.select().from(llmProviders).where(eq(llmProviders.id, providerId)).get();
  if (!provider) throw new Error("LLM Provider not found");

  const providerType = provider.providerType as ProviderType;
  const apiKey = provider.apiKey || "sk-dummy";

  // Only use custom baseURL if user explicitly set one (not the default)
  const defaultURL = DEFAULT_BASE_URLS[providerType];
  const hasCustomBaseUrl = provider.baseUrl && provider.baseUrl !== defaultURL;

  switch (providerType) {
    case "anthropic": {
      const anthropic = createAnthropic({
        apiKey,
        ...(hasCustomBaseUrl ? { baseURL: provider.baseUrl! } : {}),
      });
      return anthropic(modelName);
    }
    case "gemini": {
      const google = createGoogleGenerativeAI({
        apiKey,
        ...(hasCustomBaseUrl ? { baseURL: provider.baseUrl! } : {}),
      });
      return google(modelName);
    }
    // openai, openrouter, ollama, custom → all OpenAI-compatible
    default: {
      const baseURL = provider.baseUrl || defaultURL || "";
      if (!baseURL) throw new Error("Cannot determine base URL for provider");
      const openai = createOpenAI({
        apiKey,
        baseURL,
        // Use Chat Completions API — Responses API is not supported by OpenRouter/Ollama/custom
        useResponsesApi: false,
      });
      return openai(modelName);
    }
  }
}
