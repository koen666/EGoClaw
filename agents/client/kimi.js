import { loadEnv } from "../../shared/utils/env.js";

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
    if (fenced) {
      return JSON.parse(fenced[1]);
    }
    throw error;
  }
}

export async function runKimiJson({
  system,
  user,
  fallback,
  temperature = 0.2
}) {
  const env = loadEnv();
  if (!env.KIMI_API_KEY) {
    return typeof fallback === "function" ? fallback() : fallback;
  }

  const url = env.KIMI_BASE_URL.replace(/\/$/, "") + "/chat/completions";
  const body = {
    model: env.KIMI_MODEL,
    temperature,
    messages: [
      { role: "system", content: system + "\n请只返回 JSON，不要返回解释。" },
      { role: "user", content: user }
    ]
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.KIMI_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Kimi API failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Kimi API returned empty content");
    return safeJsonParse(content);
  } catch (error) {
    return typeof fallback === "function" ? fallback() : fallback;
  }
}
