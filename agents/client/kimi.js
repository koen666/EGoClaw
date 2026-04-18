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

function extractResponsesText(data) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const chunks = [];
  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (typeof content?.text === "string" && content.text.trim()) {
        chunks.push(content.text.trim());
      }
    }
  }
  return chunks.join("\n").trim();
}

function extractResponsesTextFromSse(raw) {
  const lines = String(raw || "").split(/\r?\n/);
  const doneTexts = [];

  for (const line of lines) {
    if (!line.startsWith("data:")) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    try {
      const parsed = JSON.parse(payload);
      const text =
        parsed?.text ||
        parsed?.part?.text ||
        parsed?.delta ||
        parsed?.item?.content?.map((content) => content?.text).filter(Boolean).join("\n") ||
        parsed?.response?.output_text;
      if (typeof text === "string" && text.trim()) {
        doneTexts.push(text.trim());
      }
    } catch (_error) {
      continue;
    }
  }

  return doneTexts[doneTexts.length - 1] || "";
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

export async function runKimiChat({
  system,
  messages,
  temperature = 0.4
}) {
  const env = loadEnv();
  if (env.OPENAI_API_KEY && env.OPENAI_BASE_URL) {
    const url = env.OPENAI_BASE_URL.replace(/\/$/, "") + (env.OPENAI_WIRE_API === "responses" ? "/responses" : "/chat/completions");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(
        env.OPENAI_WIRE_API === "responses"
          ? {
              model: env.OPENAI_MODEL,
              stream: false,
              instructions: system,
              input: messages.map((message) => ({
                role: message.role,
                content: message.content
              }))
            }
          : {
              model: env.OPENAI_MODEL,
              temperature,
              messages: [{ role: "system", content: system }, ...messages]
            }
      )
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API failed: ${response.status} ${errorText}`.trim());
    }

    const raw = await response.text();
    let content = "";
    if (env.OPENAI_WIRE_API === "responses") {
      if (raw.trim().startsWith("{")) {
        content = extractResponsesText(JSON.parse(raw));
      } else {
        content = extractResponsesTextFromSse(raw);
      }
    } else {
      const data = JSON.parse(raw);
      content = String(data?.choices?.[0]?.message?.content || "").trim();
    }
    if (!content) {
      throw new Error("OpenAI API returned empty content");
    }
    return content;
  }

  if (!env.KIMI_API_KEY) {
    throw new Error("未配置可用模型 API Key");
  }

  const url = env.KIMI_BASE_URL.replace(/\/$/, "") + "/chat/completions";
  const body = {
    model: env.KIMI_MODEL,
    temperature,
    messages: [
      { role: "system", content: system },
      ...messages
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
      const errorText = await response.text();
      throw new Error(`Kimi API failed: ${response.status} ${errorText}`.trim());
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Kimi API returned empty content");
    }
    return String(content).trim();
  } catch (error) {
    throw error;
  }
}
