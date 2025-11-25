import axios from 'axios';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

const callDeepSeek = async (prompt, systemPrompt = '') => {
  const response = await axios.post(
    DEEPSEEK_API_URL,
    {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.choices[0].message.content;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { userInput = '', authorName = '我' } = req.body || {};

  if (!userInput.trim()) {
    res.status(400).json({ error: '请输入内容' });
    return;
  }

  try {
    const systemPrompt = '你是一个温馨的日记助手，根据用户的输入生成一篇简短、温馨的日记（200-300字）。';
    const diaryContent = await callDeepSeek(
      `作者：${authorName}\n用户今天想记录：${userInput}\n\n请生成一篇温馨的日记。`,
      systemPrompt
    );

    res.status(200).json({
      content: diaryContent,
      emotionScore: 0,
      keywords: ''
    });
  } catch (error) {
    console.error('DeepSeek 调用失败：', error.response?.data || error.message);
    res.status(500).json({
      error: error.response?.data?.error?.message || '生成日记失败，请稍后重试。'
    });
  }
}