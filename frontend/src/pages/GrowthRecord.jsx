import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { API_ROOT } from '../utils/apiConfig';

export default function GrowthRecord() {
  const [growthData, setGrowthData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrowthData();
  }, []);

  const fetchGrowthData = async () => {
    try {
      const response = await axios.get(`${API_ROOT}/growth-data`);
      setGrowthData(response.data);
    } catch (error) {
      console.error('获取成长数据失败:', error);
      alert('获取数据失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-amber-700">加载中...</div>;
  }

  if (!growthData) {
    return <div className="p-8 text-center text-amber-700">暂无数据</div>;
  }

  // 计算情绪平均值
  const avgEmotion = parseFloat(growthData.avgEmotion) || 0;
  const recentAvgEmotion = parseFloat(growthData.recentAvgEmotion) || 0;
  const emotionChange = parseFloat(growthData.emotionChange) || 0;

  // 生成情绪总结
  const emotionSummary = emotionChange > 0
    ? `过去一周你的情绪较为稳定，平均分 ${recentAvgEmotion > 0 ? '+' : ''}${recentAvgEmotion}，比上周提升 ${emotionChange > 0 ? '+' : ''}${emotionChange.toFixed(1)}。`
    : emotionChange < 0
    ? `过去一周你的情绪平均分 ${recentAvgEmotion > 0 ? '+' : ''}${recentAvgEmotion}，比上周下降 ${Math.abs(emotionChange).toFixed(1)}。`
    : `过去一周你的情绪较为稳定，平均分 ${recentAvgEmotion > 0 ? '+' : ''}${recentAvgEmotion}。`;

  // 格式化日期显示
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const emotionData = growthData.emotionData.map(item => ({
    ...item,
    date: formatDate(item.date)
  }));

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // 生成日历形式的热力图数据（当月，按周排列）
  const calendarStart = new Date(currentYear, currentMonth, 1);
  const startOffset = calendarStart.getDay(); // 0-6, 以周日为起点
  const calendarStartDate = new Date(calendarStart.getTime() - startOffset * 86400000);

  const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六'];

  const calendarDays = Array.from({ length: 42 }, (_, idx) => {
    const date = new Date(calendarStartDate.getTime() + idx * 86400000);
    const dateStr = date.toISOString().split('T')[0];
    const isCurrentMonth = date.getMonth() === currentMonth;
    const isToday = date.toDateString() === today.toDateString();
    const isActive = !!growthData.heatmapData[dateStr];
    return {
      date,
      dateStr,
      dayNumber: date.getDate(),
      isCurrentMonth,
      isToday,
      isActive
    };
  });

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-amber-800 mb-8 text-center">成长记录</h1>
      
      {/* 情绪曲线 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-amber-800 mb-4">情绪曲线</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={emotionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              domain={[-2, 2]} 
              tick={{ fontSize: 12 }}
              label={{ value: '情绪值', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="emotion" 
              stroke={avgEmotion >= 0 ? "#10b981" : "#6b7280"} 
              strokeWidth={2}
              dot={{ fill: avgEmotion >= 0 ? "#10b981" : "#6b7280", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="mt-4 text-amber-700">
          {emotionSummary}
        </p>
        <p className="mt-2 text-sm text-amber-600">
          过去30天平均情绪分：{avgEmotion > 0 ? '+' : ''}{avgEmotion}
        </p>
      </div>

      {/* 主题雷达 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-amber-800 mb-4">主题雷达</h2>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={growthData.radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis angle={90} domain={[0, 1]} tick={{ fontSize: 10 }} />
            <Radar 
              name="活跃度" 
              dataKey="value" 
              stroke="#f59e0b" 
              fill="#fbbf24" 
              fillOpacity={0.6} 
            />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* 活动热力图 - 日历形式 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-amber-800 mb-4">活动热力图</h2>
        <div className="grid grid-cols-7 gap-2 text-center text-sm text-amber-500 mb-2">
          {weekdayLabels.map((label) => (
            <div key={label} className="uppercase tracking-widest">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {calendarDays.map((day, index) => (
            <div
              key={`${day.dateStr}-${index}`}
              className={`h-16 md:h-20 rounded-xl border transition-all flex flex-col items-center justify-start p-1 md:p-2 text-xs md:text-sm ${
                day.isCurrentMonth
                  ? day.isActive
                    ? 'bg-green-500/80 border-green-500 text-white'
                    : 'bg-amber-50 border-amber-200 text-amber-400'
                  : 'bg-transparent border-transparent text-amber-200'
              } ${day.isToday && day.isCurrentMonth ? 'ring-2 ring-offset-2 ring-amber-400' : ''}`}
              title={`${day.dateStr} ${day.isActive ? '有记录' : '无记录'}`}
            >
              <div className={`self-end ${day.isCurrentMonth ? '' : 'opacity-60'}`}>
                {day.dayNumber}
              </div>
              <div className="flex-1 flex items-center justify-center w-full">
                {day.isActive ? (
                  <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wide">已记录</span>
                ) : (
                  <span className="text-[10px] md:text-xs text-amber-300">-</span>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="text-amber-700">
          活跃天数：{growthData.activeDays} / 30 天 | 活跃率：{growthData.activeRate}%
        </p>
      </div>
    </div>
  );
}




