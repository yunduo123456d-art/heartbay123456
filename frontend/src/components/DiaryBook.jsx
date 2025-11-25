import React from 'react';

export default function DiaryBook({
  title,
  author,
  onTitleChange,
  onAuthorChange,
  content,
  emotionScore,
  keywords
}) {
  const formatEmotion = () => {
    if (typeof emotionScore !== 'number') return '暂无情绪分析';
    const prefix = emotionScore > 0 ? '+' : '';
    return `情绪评分：${prefix}${emotionScore}`;
  };

  const renderKeywords = () => {
    if (!keywords) return null;
    return (
      <p className="text-xs text-amber-500 mt-2">关键词：{keywords}</p>
    );
  };

  return (
    <div className="relative w-full max-w-3xl">
      <div className="absolute inset-y-6 left-1/2 -translate-x-1/2 w-2 rounded-full bg-gradient-to-b from-amber-200 via-amber-300 to-amber-400 shadow-md" />
      <div className="flex bg-amber-100 rounded-3xl shadow-[0_25px_60px_-30px_rgba(217,119,6,0.6)] overflow-hidden border border-amber-200">
        {/* Left Page */}
        <div className="flex-1 bg-amber-50/90 p-8 md:p-10 relative">
          <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-r from-transparent via-amber-100 to-amber-200 pointer-events-none" />
          <div className="uppercase text-xs tracking-[0.4em] text-amber-400">My Diary</div>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange?.(e.target.value)}
            className="mt-6 w-full bg-transparent border-none outline-none text-3xl md:text-4xl font-serif text-amber-800 text-center"
            placeholder="我的日记"
          />
          <div className="mt-8 text-center">
            <span className="text-sm text-amber-400">作者：</span>
            <input
              type="text"
              value={author}
              onChange={(e) => onAuthorChange?.(e.target.value)}
              className="bg-transparent border-none outline-none text-lg font-serif text-amber-600 text-center"
              placeholder="填写名字"
            />
          </div>
          <div
            className="mt-10 h-64 md:h-72 rounded-xl border border-dashed border-amber-200 bg-gradient-to-br from-amber-50 via-amber-100 to-amber-50 shadow-inner flex items-center justify-center text-amber-300 text-sm"
            style={{
              backgroundImage: 'repeating-linear-gradient(#fef3c7, #fef3c7 44px, rgba(217,119,6,0.12) 45px)'
            }}
          >
            <span className="text-amber-300">写下今天值得纪念的瞬间...</span>
          </div>
        </div>

        {/* Right Page */}
        <div className="flex-1 bg-amber-100/95 p-8 md:p-10 relative">
          <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-l from-transparent via-amber-100 to-amber-200 pointer-events-none" />
          <h3 className="text-lg font-semibold text-amber-700 tracking-wider">今日记录</h3>
          <div className="mt-6 h-72 md:h-80 overflow-y-auto pr-2">
            {content ? (
              <p className="whitespace-pre-wrap leading-relaxed text-amber-800 text-base md:text-lg font-serif">
                {content}
              </p>
            ) : (
              <div className="h-full flex items-center justify-center text-amber-400 text-sm">
                等待AI为你写下今日的故事...
              </div>
            )}
          </div>
          <div className="mt-6">
            <p className="text-xs text-amber-500 uppercase tracking-widest">Insight</p>
            <p className="text-sm text-amber-600 mt-1">{formatEmotion()}</p>
            {renderKeywords()}
          </div>
        </div>
      </div>
    </div>
  );
}

