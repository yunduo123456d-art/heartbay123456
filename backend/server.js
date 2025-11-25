const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const app = express();
app.set('trust proxy', 1);

const allowedOrigins =
  (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true
  })
);
app.use(express.json());

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

if (!DEEPSEEK_API_KEY) {
  console.warn('⚠️  未检测到 DEEPSEEK_API_KEY，请在 backend/.env.local 中配置该值。');
}

// 初始化数据库
const dbPath = path.join(__dirname, 'diary.db');
const db = new sqlite3.Database(dbPath);

// 创建表
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS diaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    content TEXT NOT NULL,
    emotion_score INTEGER,
    keywords TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS treehole_chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    content TEXT NOT NULL,
    is_included INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// 调用DeepSeek API
async function callDeepSeek(prompt, systemPrompt = '') {
  try {
    console.log('Calling DeepSeek API...');
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
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    console.log('DeepSeek API Response received');
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek API Error Details:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response Data:', error.response?.data);
    console.error('Error Message:', error.message);
    
    // 如果是402错误（账户问题），返回友好提示
    if (error.response?.status === 402) {
      throw new Error('API账户余额不足或配置错误，请检查API密钥和账户状态');
    }
    
    // 如果是其他错误，抛出原始错误
    throw new Error(error.response?.data?.error?.message || error.message || 'API调用失败');
  }
}

// 生成日记
app.post('/api/generate-diary', async (req, res) => {
  try {
    console.log('=== 收到生成日记请求 ===');
    console.log('Request body:', req.body);
    const { userInput, authorName } = req.body;
    
    if (!userInput || !userInput.trim()) {
      console.log('错误：用户输入为空');
      return res.status(400).json({ error: '请输入内容' });
    }
    
    console.log('Generating diary for:', userInput.substring(0, 50));
    console.log('Author name:', authorName);
    
    const systemPrompt = '你是一个温馨的日记助手，根据用户的输入生成一篇简短、温馨的日记（200-300字）。';
    const prompt = `用户今天想记录：${userInput}\n\n请生成一篇温馨的日记。`;
    
    let diaryContent;
    try {
      diaryContent = await callDeepSeek(prompt, systemPrompt);
    } catch (apiError) {
      console.error('Failed to call DeepSeek API:', apiError.message);
      
        // 如果是余额不足错误，提供友好的提示
      if (apiError.message.includes('余额不足') || apiError.message.includes('Insufficient Balance')) {
        return res.status(402).json({ 
          error: 'API账户余额不足。请前往DeepSeek平台充值：https://platform.deepseek.com/ 或检查API密钥配置。' +
                 '\n\n临时方案：您可以手动输入日记内容，系统仍会保存您的记录。'
        });
      }
      
      return res.status(500).json({ 
        error: apiError.message || '无法生成日记，请检查API配置或稍后重试'
      });
    }
    
    if (!diaryContent) {
      return res.status(500).json({ error: 'AI返回内容为空' });
    }
    
    // 分析情绪和关键词（简化处理，避免二次API调用失败）
    let emotionScore = 0;
    let keywords = '';
    
    try {
      const emotionPrompt = `分析这篇日记的情绪（只返回一个-2到2的整数：-2悲伤，-1低落，0平稳，+1愉快，+2高兴）和关键词（3-5个，用逗号分隔）。\n\n日记内容：${diaryContent}\n\n请严格按照格式返回：情绪分数|关键词1,关键词2,关键词3`;
      const analysis = await callDeepSeek(emotionPrompt, '只返回格式：情绪分数|关键词1,关键词2,关键词3，不要其他文字');
      
      if (analysis.includes('|')) {
        const parts = analysis.split('|');
        emotionScore = parseInt(parts[0].trim()) || 0;
        keywords = parts[1] ? parts[1].trim() : '';
      } else {
        // 如果没有|，尝试提取数字
        const match = analysis.match(/-?\d+/);
        if (match) emotionScore = parseInt(match[0]);
      }
    } catch (analysisError) {
      console.warn('Emotion analysis failed, using default values:', analysisError.message);
      // 如果情绪分析失败，使用默认值，但不影响日记生成
    }
    
    const date = new Date().toISOString().split('T')[0];
    
    db.run(
      'INSERT INTO diaries (date, content, emotion_score, keywords) VALUES (?, ?, ?, ?)',
      [date, diaryContent, emotionScore, keywords],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: '保存日记失败：' + err.message });
        }
        
        console.log('Diary saved with ID:', this.lastID);
        res.json({
          id: this.lastID,
          content: diaryContent,
          emotionScore: emotionScore,
          keywords: keywords
        });
      }
    );
  } catch (error) {
    console.error('Unexpected error in generate-diary:', error);
    res.status(500).json({ error: error.message || '生成日记时发生未知错误' });
  }
});

// 手动保存日记（当API余额不足时使用）
app.post('/api/save-diary-manual', (req, res) => {
  try {
    const { content, authorName } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ error: '请输入日记内容' });
    }
    
    const date = new Date().toISOString().split('T')[0];
    
    // 简单分析情绪（基于关键词，不调用API）
    let emotionScore = 0;
    const positiveWords = ['开心', '高兴', '快乐', '愉快', '兴奋', '满意', '幸福'];
    const negativeWords = ['难过', '悲伤', '失望', '沮丧', '焦虑', '担心', '烦恼'];
    const contentLower = content.toLowerCase();
    
    const positiveCount = positiveWords.filter(word => contentLower.includes(word)).length;
    const negativeCount = negativeWords.filter(word => contentLower.includes(word)).length;
    
    if (positiveCount > negativeCount) {
      emotionScore = positiveCount >= 2 ? 2 : 1;
    } else if (negativeCount > positiveCount) {
      emotionScore = negativeCount >= 2 ? -2 : -1;
    }
    
    // 提取简单关键词（基于常见词）
    const keywords = ['学习', '工作', '生活', '社交', '健康', '情绪']
      .filter(keyword => content.includes(keyword))
      .slice(0, 3)
      .join(',');
    
    db.run(
      'INSERT INTO diaries (date, content, emotion_score, keywords) VALUES (?, ?, ?, ?)',
      [date, content.trim(), emotionScore, keywords],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: '保存日记失败：' + err.message });
        }
        
        console.log('Manual diary saved with ID:', this.lastID);
        res.json({
          id: this.lastID,
          content: content.trim(),
          emotionScore: emotionScore,
          keywords: keywords
        });
      }
    );
  } catch (error) {
    console.error('Unexpected error in save-diary-manual:', error);
    res.status(500).json({ error: error.message || '保存日记时发生未知错误' });
  }
});

// 获取日记列表
app.get('/api/diaries', (req, res) => {
  const { startDate, endDate } = req.query;
  let query = 'SELECT * FROM diaries WHERE 1=1';
  const params = [];
  
  if (startDate) {
    query += ' AND date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }
  
  query += ' ORDER BY date DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 生成周报/月报
app.post('/api/generate-report', async (req, res) => {
  try {
    const { type, startDate, endDate } = req.body;
    
    db.all(
      'SELECT * FROM diaries WHERE date >= ? AND date <= ? ORDER BY date',
      [startDate, endDate],
      async (err, diaries) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        if (diaries.length === 0) {
          res.json({
            report: '暂无日记记录，无法生成报告。',
            avgEmotion: 0,
            diaryCount: 0
          });
          return;
        }
        
        const contents = diaries.map(d => d.content).join('\n\n');
        const avgEmotion = diaries.reduce((sum, d) => sum + (d.emotion_score || 0), 0) / diaries.length || 0;
        
        const prompt = `根据以下${type === 'week' ? '一周' : '一个月'}的日记内容，生成一份${type === 'week' ? '周报' : '月报'}，包括：
1. 简要总结（2-3句话）
2. 情绪趋势分析
3. 1-2条成长建议

日记内容：
${contents}`;
        
        try {
          const report = await callDeepSeek(
            prompt,
            `你是一个温暖的成长顾问，生成温馨的${type === 'week' ? '周报' : '月报'}。`
          );

          res.json({
            report,
            avgEmotion: avgEmotion.toFixed(1),
            diaryCount: diaries.length
          });
        } catch (apiError) {
          console.error('生成报告失败:', apiError.message);

          if (apiError.message.includes('余额不足') || apiError.message.includes('Insufficient Balance')) {
            res.status(402).json({
              error: 'API账户余额不足，暂时无法自动生成报告。',
              diaryCount: diaries.length,
              avgEmotion: avgEmotion.toFixed(1)
            });
          } else {
            res.status(500).json({ error: apiError.message || '生成报告失败，请稍后重试。' });
          }
        }
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取成长记录数据
app.get('/api/growth-data', (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = thirtyDaysAgo.toISOString().split('T')[0];
  
  db.all(
    'SELECT date, emotion_score, keywords FROM diaries WHERE date >= ? ORDER BY date',
    [startDate],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // 情绪曲线数据
      const emotionData = rows.map(r => ({
        date: r.date,
        emotion: r.emotion_score || 0
      }));
      
      // 主题雷达数据
      const categories = ['学习', '社交', '健康', '情绪', '项目', '生活'];
      const categoryCounts = {};
      categories.forEach(cat => categoryCounts[cat] = 0);
      
      rows.forEach(row => {
        if (row.keywords) {
          const keywords = row.keywords.split(',').map(k => k.trim().toLowerCase());
          keywords.forEach(kw => {
            categories.forEach(cat => {
              if (kw.includes(cat.toLowerCase()) || cat.toLowerCase().includes(kw)) {
                categoryCounts[cat]++;
              }
            });
          });
        }
      });
      
      const radarData = categories.map(cat => ({
        category: cat,
        value: rows.length > 0 ? categoryCounts[cat] / rows.length : 0
      }));
      
      // 活动热力图数据
      const heatmapData = {};
      rows.forEach(row => {
        heatmapData[row.date] = 1;
      });
      
      // 计算活跃率
      const activeDays = Object.keys(heatmapData).length;
      const activeRate = (activeDays / 30 * 100).toFixed(1);
      
      // 计算情绪平均值和总结
      const avgEmotion = rows.length > 0 
        ? rows.reduce((sum, r) => sum + (r.emotion_score || 0), 0) / rows.length 
        : 0;
      
      // 计算最近一周的情绪
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentWeekRows = rows.filter(r => r.date >= sevenDaysAgo.toISOString().split('T')[0]);
      const recentAvgEmotion = recentWeekRows.length > 0
        ? recentWeekRows.reduce((sum, r) => sum + (r.emotion_score || 0), 0) / recentWeekRows.length
        : 0;
      
      // 计算前一周的情绪（如果有）
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const prevWeekRows = rows.filter(r => {
        const date = new Date(r.date);
        return date >= fourteenDaysAgo && date < sevenDaysAgo;
      });
      const prevAvgEmotion = prevWeekRows.length > 0
        ? prevWeekRows.reduce((sum, r) => sum + (r.emotion_score || 0), 0) / prevWeekRows.length
        : 0;
      
      const emotionChange = recentAvgEmotion - prevAvgEmotion;
      
      res.json({
        emotionData,
        radarData,
        heatmapData,
        activeDays,
        activeRate,
        avgEmotion: avgEmotion.toFixed(1),
        recentAvgEmotion: recentAvgEmotion.toFixed(1),
        emotionChange: emotionChange.toFixed(1)
      });
    }
  );
});

// 情绪树洞
app.post('/api/treehole-chat', async (req, res) => {
  try {
    const { message, isIncluded } = req.body;
    const systemPrompt = '你是一个温暖的情绪陪伴者，用共情和理解的方式与用户对话，给予情感支持。回复要温暖、简短、有共鸣。';
    const response = await callDeepSeek(message, systemPrompt);
    
    const date = new Date().toISOString().split('T')[0];
    
    db.run(
      'INSERT INTO treehole_chats (date, content, is_included) VALUES (?, ?, ?)',
      [date, message, isIncluded ? 1 : 0],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ response });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除所有数据
app.delete('/api/clear-all', (req, res) => {
  db.run('DELETE FROM diaries', (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    db.run('DELETE FROM treehole_chats', (err2) => {
      if (err2) {
        res.status(500).json({ error: err2.message });
        return;
      }
      res.json({ message: '所有数据已清除' });
    });
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

