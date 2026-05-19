import OpenAI from 'openai';

interface GenerateTextOptions {
  input: string;
  systemPrompt: string;
  yandexPromptId?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function generateAiText({ input, systemPrompt, yandexPromptId, temperature = 0.3, maxTokens = 300 }: GenerateTextOptions): Promise<string> {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();

  if (provider === 'yandex') {
    const apiKey = process.env.YANDEX_API_KEY;
    if (!apiKey) throw new Error('YANDEX_API_KEY не задан');

    if (yandexPromptId && process.env.YANDEX_PROJECT_ID) {
      try {
        const client = new OpenAI({ apiKey, baseURL: process.env.YANDEX_BASE_URL || 'https://ai.api.cloud.yandex.net/v1', project: process.env.YANDEX_PROJECT_ID });
        const response = await client.responses.create({ prompt: { id: yandexPromptId }, input } as never);
        const output = (response as { output_text?: string }).output_text?.trim();
        if (output) return output;
      } catch {
        // fallback to direct model
      }
    }

    const folderId = process.env.YANDEX_FOLDER_ID || process.env.YANDEX_PROJECT_ID;
    const modelUri = process.env.YANDEX_MODEL_URI || (folderId ? `gpt://${folderId}/yandexgpt-lite/latest` : '');
    if (!modelUri) throw new Error('Укажите YANDEX_FOLDER_ID или YANDEX_MODEL_URI');

    const response = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Api-Key ${apiKey}` },
      body: JSON.stringify({
        modelUri,
        completionOptions: { stream: false, temperature, maxTokens },
        messages: [
          { role: 'system', text: systemPrompt },
          { role: 'user', text: input }
        ]
      })
    });

    const raw = await response.text();
    if (!response.ok) throw new Error(`YandexGPT error ${response.status}: ${raw}`);
    const data = JSON.parse(raw) as { result?: { alternatives?: Array<{ message?: { text?: string } }> } };
    return data.result?.alternatives?.[0]?.message?.text?.trim() ?? '';
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: input }
    ]
  });
  return completion.choices[0]?.message?.content?.trim() ?? '';
}
