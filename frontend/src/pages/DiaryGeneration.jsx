import React, { useState, useEffect } from 'react';
import DiaryBook from '../components/DiaryBook';
import DiaryChat from '../components/DiaryChat';

export default function DiaryGeneration() {
  const [authorName, setAuthorName] = useState(() => {
    if (typeof window === 'undefined') return '我';
    return localStorage.getItem('diaryAuthor') || '我';
  });

  const [diaryTitle, setDiaryTitle] = useState(() => {
    if (typeof window === 'undefined') return '我的日记';
    return localStorage.getItem('diaryTitle') || '我的日记';
  });

  const [diaryData, setDiaryData] = useState(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('diaryData');
    try {
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.warn('Failed to parse diaryData from storage:', e);
      return null;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('diaryAuthor', authorName);
  }, [authorName]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('diaryTitle', diaryTitle);
  }, [diaryTitle]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (diaryData) {
      localStorage.setItem('diaryData', JSON.stringify(diaryData));
    }
  }, [diaryData]);

  return (
    <div className="flex flex-col md:flex-row gap-6 md:gap-10 p-4 md:p-8 min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="flex-1 flex justify-center items-center">
        <DiaryBook
          title={diaryTitle}
          author={authorName}
          onTitleChange={setDiaryTitle}
          onAuthorChange={setAuthorName}
          content={diaryData?.content}
          emotionScore={diaryData?.emotionScore}
          keywords={diaryData?.keywords}
        />
      </div>

      <div className="w-full md:w-[360px] lg:w-[400px]">
        <DiaryChat
          authorName={authorName}
          diaryTitle={diaryTitle}
          onDiaryGenerated={(data) => setDiaryData(data)}
        />
      </div>
    </div>
  );
}

