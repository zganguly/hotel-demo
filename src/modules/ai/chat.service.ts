export type AiProvider = "OPENAI" | "OPENROUTER";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ProviderChatResult = {
  content: string;
  model: string;
  requestTokens: number;
  responseTokens: number;
  totalTokens: number;
};

function resolveProviderConfig(provider: AiProvider) {
  if (provider === "OPENAI") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured in .env");
    }
    return {
      apiKey,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      url: "https://api.openai.com/v1/chat/completions",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      } as Record<string, string>,
    };
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured in .env");
  }
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://nxt-tst.duckdns.org";
  return {
    apiKey,
    model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
    url: "https://openrouter.ai/api/v1/chat/completions",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": appUrl,
      "X-Title": process.env.APP_NAME || "Hotel PMS",
    } as Record<string, string>,
  };
}

export async function runChatCompletion(opts: {
  provider: AiProvider;
  messages: ChatMessage[];
}): Promise<ProviderChatResult> {
  const config = resolveProviderConfig(opts.provider);

  const response = await fetch(config.url, {
    method: "POST",
    headers: config.headers,
    body: JSON.stringify({
      model: config.model,
      messages: opts.messages,
      temperature: 0.4,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
    model?: string;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message || `Provider request failed (${response.status})`);
  }

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Provider returned an empty response");
  }

  const requestTokens = payload.usage?.prompt_tokens ?? 0;
  const responseTokens = payload.usage?.completion_tokens ?? 0;
  const totalTokens = payload.usage?.total_tokens ?? requestTokens + responseTokens;

  return {
    content,
    model: payload.model || config.model,
    requestTokens,
    responseTokens,
    totalTokens,
  };
}
