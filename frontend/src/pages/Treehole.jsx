import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_ROOT } from '../utils/apiConfig';

export default function Treehole() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [includeInAnalysis, setIncludeInAnalysis] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    const userMessage = message;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_ROOT}/treehole-chat`, {
        message: userMessage,
        isIncluded: includeInAnalysis
      });
      
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      console.error('发送消息失败:', error);
      alert('发送失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 min-h-[600px] flex flex-col">
        <div className="mb-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="includeAnalysis"
            checked={includeInAnalysis}
            onChange={(e) => setIncludeInAnalysis(e.target.checked)}
            className="w-4 h-4 text-amber-500"
          />
          <label htmlFor="includeAnalysis" className="text-sm text-amber-700 cursor-pointer">
            纳入分析
          </label>
        </div>

        <div className="space-y-4 mb-6 flex-1 overflow-y-auto max-h-96">
          {messages.length === 0 ? (
            <div className="text-center text-amber-500 py-8">
              开始对话吧...
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-amber-100 ml-auto text-right max-w-[80%]'
                    : 'bg-amber-50 max-w-[80%]'
                }`}
              >
                <p className="text-amber-800 whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))
          )}
          {loading && (
            <div className="bg-amber-50 p-4 rounded-lg max-w-[80%]">
              <p className="text-amber-600">AI 正在思考...</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="你好呀，今天过得如何，无论是开心的小事还是一点点烦恼，都可以和我说～"
            className="w-full border-2 border-amber-200 rounded-lg p-4 resize-none focus:outline-none focus:border-amber-400"
            rows="4"
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="mt-4 bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full md:w-auto"
          >
            {loading ? '发送中...' : '发送'}
          </button>
        </form>
      </div>
    </div>
  );
}

