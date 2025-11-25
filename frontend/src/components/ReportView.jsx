import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ROOT } from '../utils/apiConfig';

export default function ReportView({ type, title }) {
  const [showDetails, setShowDetails] = useState(false);
  const [diaries, setDiaries] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    if (type === 'week') {
      start.setDate(end.getDate() - 7);
    } else {
      start.setMonth(end.getMonth() - 1);
    }
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  const fetchDiaries = async () => {
    try {
      const { startDate, endDate } = getDateRange();
      const response = await axios.get(`${API_ROOT}/diaries`, {
        params: { startDate, endDate }
      });
      setDiaries(response.data);
      setShowDetails(true);
    } catch (error) {
      console.error('获取日记失败:', error);
      alert('获取日记失败，请重试');
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      const response = await axios.post(`${API_ROOT}/generate-report`, {
        type,
        startDate,
        endDate
      });
      setReport(response.data);
    } catch (error) {
      console.error('生成报告失败:', error);
      alert('生成报告失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-green-50 rounded-lg shadow-lg p-6 min-h-[500px] flex flex-col">
      <h2 className="text-2xl font-bold text-green-800 mb-4 text-center">{title}</h2>
      
      {!showDetails ? (
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={fetchDiaries}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
          >
            查看记录
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-96 overflow-y-auto flex-1">
            {diaries.length === 0 ? (
              <div className="col-span-full text-center text-green-600 py-8">
                暂无记录
              </div>
            ) : (
              diaries.map((diary) => (
                <div
                  key={diary.id}
                  className="bg-white p-3 rounded border border-green-200 text-sm hover:shadow-md transition-shadow"
                >
                  <p className="text-green-700 line-clamp-3 text-xs">{diary.content}</p>
                  <p className="text-xs text-green-500 mt-1">{diary.date}</p>
                </div>
              ))
            )}
          </div>
          
          <button
            onClick={generateReport}
            disabled={loading || diaries.length === 0}
            className="w-full bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '生成中...' : `汇总成${title}`}
          </button>
          
          {report && (
            <div className="mt-4 p-4 bg-white rounded border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">{title}内容：</h3>
              <p className="text-green-700 whitespace-pre-wrap text-sm">{report.report}</p>
              <p className="text-sm text-green-600 mt-2">
                平均情绪分：{report.avgEmotion} | 日记数量：{report.diaryCount}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}




