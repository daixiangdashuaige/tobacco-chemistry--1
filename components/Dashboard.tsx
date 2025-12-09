import React, { useState } from 'react';

interface DashboardProps {
  totalQuestions: number;
  wrongCount: number;
  onStartMode: (mode: 'sequential' | 'random' | 'mistake') => void;
  onImport: () => void;
  onReset: () => void;
  onSearch: (term: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  totalQuestions,
  wrongCount,
  onStartMode,
  onImport,
  onReset,
  onSearch,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch(term);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <header className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <h1 className="text-xl font-black text-blue-600 tracking-tight">烟草化学</h1>
        </div>
        <button
          onClick={onImport}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          导入题库
        </button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-blue-500 mb-2">{totalQuestions}</span>
          <span className="text-gray-500 font-medium text-sm">总题量</span>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-red-500 mb-2">{wrongCount}</span>
          <span className="text-gray-500 font-medium text-sm">待消灭错题</span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex items-center px-4">
        <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="搜索知识点（例如：烟碱、糖含量）"
          className="w-full py-3 outline-none text-gray-700 bg-transparent"
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {/* Action List */}
      <div className="space-y-4">
        {/* Mistake Mode */}
        <button
          onClick={() => onStartMode('mistake')}
          disabled={wrongCount === 0}
          className={`w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between group transition-all ${wrongCount === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md hover:border-red-100 active:scale-[0.99]'}`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-xl">
              💀
            </div>
            <div className="text-left">
              <h3 className="font-bold text-gray-800 text-lg group-hover:text-red-600 transition-colors">错题死磕模式</h3>
              <p className="text-gray-400 text-sm">只做错过的题，做对才移出</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-300 group-hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>

        {/* Random Mode */}
        <button
          onClick={() => onStartMode('random')}
          disabled={totalQuestions === 0}
          className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md hover:border-purple-100 transition-all active:scale-[0.99] disabled:opacity-50"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-xl">
              🎲
            </div>
            <div className="text-left">
              <h3 className="font-bold text-gray-800 text-lg group-hover:text-purple-600 transition-colors">随机抽查 (50题)</h3>
              <p className="text-gray-400 text-sm">保持手感，快速过一遍</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-300 group-hover:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>

        {/* Sequential Mode */}
        <button
          onClick={() => onStartMode('sequential')}
          disabled={totalQuestions === 0}
          className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md hover:border-blue-100 transition-all active:scale-[0.99] disabled:opacity-50"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-xl">
              📚
            </div>
            <div className="text-left">
              <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">顺序刷题</h3>
              <p className="text-gray-400 text-sm">地毯式复习，无死角</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-300 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>

      {/* Footer Actions */}
      <div className="mt-8 pt-4">
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-red-400 hover:text-red-600 font-medium text-sm transition-colors px-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          重置所有进度
        </button>
      </div>
    </div>
  );
};

export default Dashboard;