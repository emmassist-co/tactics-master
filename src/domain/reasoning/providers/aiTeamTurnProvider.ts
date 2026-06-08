import { getModelConfig } from "../../../config/model";
import { buildTeamTurnPrompt } from "../prompting";
import { normalizeTeamDecision } from "../teamDecisionSchema";
import type { TeamTurnProvider } from "../types";
import { fallbackTeamTurnProvider } from "./fallbackTeamTurnProvider";

function parseJson(text: string): Record<string, unknown> | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? text;
  try {
    return JSON.parse(candidate) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export const aiTeamTurnProvider: TeamTurnProvider = {
  async decide(context) {
    const config = getModelConfig();
    if (!config) {
      return fallbackTeamTurnProvider.decide(context);
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      };
      if (config.siteUrl) {
        headers["HTTP-Referer"] = config.siteUrl;
      }
      if (config.appTitle) {
        headers["X-OpenRouter-Title"] = config.appTitle;
      }

      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: config.model,
          temperature: 0.4,
          messages: [
            {
              role: "system",
              content: "You output only valid JSON for bounded football tactical decisions.",
            },
            {
              role: "user",
              content: buildTeamTurnPrompt(context),
            },
          ],
        }),
      });

      if (!response.ok) {
        return fallbackTeamTurnProvider.decide(context);
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = payload.choices?.[0]?.message?.content ?? "";
      const parsed = parseJson(content);
      if (!parsed) {
        return fallbackTeamTurnProvider.decide(context);
      }

      return normalizeTeamDecision(parsed, context.side, context.window);
    } catch {
      return fallbackTeamTurnProvider.decide(context);
    }
  },
};
