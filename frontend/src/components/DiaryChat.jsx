import React, { useState } from 'react';
import axios from 'axios';
import { API_ROOT } from '../utils/apiConfig';

export default function DiaryChat({ authorName, diaryTitle, onDiaryGenerated }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showManualSave, setShowManualSave] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    setLoading(true);
    setStatusMessage('');
    try {
      console.log('Sending request to generate diary...');
      const response = await axios.post(`${API_ROOT}/generate-diary`, {
        userInput: message,
        authorName,
        diaryTitle
      });

      console.log('Diary generated successfully:', response.data);

      if (response.data && response.data.content) {
        onDiaryGenerated?.(response.data);
        setMessage('');
        setShowManualSave(false);
        setStatusMessage('✅ 日记已生成并铺展在书页上～');
      } else {
        throw new Error('服务器返回的数据格式不正确');
      }
    } catch (error) {
      console.error('生成日记失败 - 完整错误信息:', error);
      console.error('错误响应:', error.response);
      console.error('错误状态:', error.response?.status);
      console.error('错误数据:', error.response?.data);

      const errorMessage = error.response?.data?.error || error.message || '生成日记失败，请重试';

      // 如果是余额不足错误，提供手动保存选项
      if (error.response?.status === 402 || errorMessage.includes('余额不足') || errorMessage.includes('Insufficient Balance')) {
        setShowManualSave(true);
        setStatusMessage('⚠️ API 余额不足。可以尝试手动保存日记。');
      } else if (error.response?.status === 500) {
        alert('服务器错误：' + errorMessage);
        setShowManualSave(true);
      } else if (!error.response) {
        alert('网络连接失败，请确认后端服务是否启动。错误：' + errorMessage);
        setShowManualSave(true);
      } else {
        alert('生成失败：' + errorMessage);
        setShowManualSave(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = async () => {
    if (!message.trim()) return;

    setLoading(true);
    setStatusMessage('');
    try {
      const response = await axios.post(`${API_ROOT}/save-diary-manual`, {
        content: message,
        authorName,
        diaryTitle
      });
      onDiaryGenerated?.(response.data);
      setMessage('');
      setShowManualSave(false);
      setStatusMessage('✅ 已手动保存当前日记内容。');
    } catch (error) {
      console.error('保存日记失败:', error);
      alert('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 h-full flex flex-col border border-amber-100">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-amber-800">今日心情</h2>
        <p className="text-sm text-amber-500 mt-1">写下今日的感受，让我陪你一起整理思绪。</p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="写下今天想分享的心情、事件或感受..."
          className="flex-1 border-2 border-amber-200 rounded-2xl p-4 bg-amber-50/60 resize-none focus:outline-none focus:border-amber-400 focus:bg-white transition-colors"
        />
        <div className="flex flex-col gap-3 mt-4">
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="w-full bg-amber-500 text-white px-6 py-3 rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '生成中...' : '生成今日日记'}
          </button>
          {showManualSave && (
            <button
              type="button"
              onClick={handleManualSave}
              disabled={loading || !message.trim()}
              className="w-full bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              手动保存日记
            </button>
          )}
        </div>
        {showManualSave && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            当前无法连接 AI，您可以先手动保存，之后再尝试自动生成。
          </div>
        )}
      </form>

      {statusMessage && (
        <div className="mt-4 text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2">
          {statusMessage}
        </div>
      )}
    </div>
  );
}

