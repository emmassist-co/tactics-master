export interface ModelConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  siteUrl?: string;
  appTitle?: string;
}

export function getModelConfig(): ModelConfig | null {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) return null;

  return {
    apiKey,
    model: import.meta.env.VITE_OPENROUTER_MODEL ?? "openai/gpt-4.1-mini",
    baseUrl: import.meta.env.VITE_OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
    siteUrl: import.meta.env.VITE_OPENROUTER_SITE_URL,
    appTitle: import.meta.env.VITE_OPENROUTER_APP_TITLE ?? "tactics-master",
  };
}
