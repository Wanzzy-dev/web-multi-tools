import axios from 'axios';

export async function chatWithAI(prompt, model = 'qwen/qwen-2.5-7b-instruct') {
  if (!prompt) {
    return { success: false, mess: 'please input a prompt!' };
  }

  const response = await axios.post(
    'https://api.rewind.ai/v1/chat/completions/',
    {
      messages: [{ role: 'user', content: prompt }],
      model,
      stream: true,
    },
    {
      headers: { 'Content-Type': 'application/json' },
      responseType: 'stream',
    }
  );

  let fullText = '';
  for await (const chunk of response.data) {
    const lines = chunk.toString().split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') return { success: true, prompt, response: fullText };
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) fullText += content;
        } catch {}
      }
    }
  }
  return { success: true, prompt, response: fullText };
}
