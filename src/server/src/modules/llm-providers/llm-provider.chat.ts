import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { eq } from "drizzle-orm";
import { getDb } from "../../common/db/client.js";
import { llmProviders } from "../../common/db/schema.js";
import { DEFAULT_BASE_URLS, type ProviderType } from "./llm-provider.schema.js";

// ── LLM Factory ─────────────────────────────────────────────────────────────
// Generic utility to create a LangChain chat model from a stored provider config.
// Used by any module that needs LLM capabilities (e.g. dynamic-apis coding agent).

export async function getModelForProvider(providerId: string, modelName: string): Promise<BaseChatModel> {
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
      const opts: Record<string, unknown> = { anthropicApiKey: apiKey, model: modelName, temperature: 0.2 };
      if (hasCustomBaseUrl) opts.anthropicApiUrl = provider.baseUrl;
      return new ChatAnthropic(opts as ConstructorParameters<typeof ChatAnthropic>[0]);
    }
    case "gemini": {
      const opts: Record<string, unknown> = { apiKey, model: modelName, temperature: 0.2 };
      if (hasCustomBaseUrl) opts.baseUrl = provider.baseUrl;
      return new ChatGoogleGenerativeAI(opts as unknown as ConstructorParameters<typeof ChatGoogleGenerativeAI>[0]);
    }
    // openai, openrouter, ollama, custom → all OpenAI-compatible
    default: {
      const baseURL = provider.baseUrl || defaultURL || "";
      if (!baseURL) throw new Error("Cannot determine base URL for provider");
      return new ChatOpenAI({
        apiKey,
        model: modelName,
        temperature: 0.2,
        configuration: { baseURL, apiKey },
      });
    }
  }
}
