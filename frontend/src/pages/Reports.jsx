import React, { useState } from 'react';
import ReportView from '../components/ReportView';

export default function Reports() {
  return (
    <div className="p-4 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        <ReportView type="week" title="周报" />
        <ReportView type="month" title="月报" />
      </div>
    </div>
  );
}





