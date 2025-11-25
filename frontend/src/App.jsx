import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DiaryGeneration from './pages/DiaryGeneration';
import Reports from './pages/Reports';
import GrowthRecord from './pages/GrowthRecord';
import Treehole from './pages/Treehole';

function App() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteAll = async () => {
    try {
      const response = await fetch('/api/clear-all', {
        method: 'DELETE'
      });
      const data = await response.json();
      if (response.ok) {
        alert('所有数据已清除');
        window.location.reload();
      } else {
        alert('清除失败：' + data.error);
      }
    } catch (error) {
      alert('清除失败：' + error.message);
    }
    setShowDeleteConfirm(false);
  };

  return (
    <Router>
      <div className="flex flex-col md:flex-row h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        <Sidebar onDeleteClick={() => setShowDeleteConfirm(true)} />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<DiaryGeneration />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/growth" element={<GrowthRecord />} />
            <Route path="/treehole" element={<Treehole />} />
          </Routes>
        </main>
        
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-xl font-bold text-amber-800 mb-4">确认删除</h3>
              <p className="text-amber-700 mb-6">确定要清除所有数据吗？此操作不可恢复。</p>
              <div className="flex gap-4">
                <button
                  onClick={handleDeleteAll}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                >
                  确认删除
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;

