import React, { useState } from 'react';
import { Question, ImportMode } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (questions: Question[], mode: ImportMode) => void;
  currentTotal: number;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport, currentTotal }) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ImportMode>('append');

  if (!isOpen) return null;

  const handleImport = () => {
    setError(null);
    try {
      // --- STEP 1: Sanitize Input ---
      let cleanJson = jsonText
        .replace(/\[cite_start\]/g, '') // Remove syntax-breaking markers
        .replace(/\[cite: [^\]]+\]/g, '') // Remove [cite: 12] etc
        .replace(/\[cite_end\]/g, ''); 

      let parsed: any;
      try {
        parsed = JSON.parse(cleanJson);
      } catch (e) {
        // Try to be lenient if user pasted just objects without array brackets
        // or has trailing commas (not supported by strict JSON but common)
        // For now, stick to basic cleaning.
        const arrayMatch = cleanJson.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (arrayMatch) {
          try {
            parsed = JSON.parse(arrayMatch[0]);
          } catch (e2) {
             throw new Error("JSON 语法错误：请检查逗号、引号或括号。");
          }
        } else {
           throw new Error("无法解析 JSON。请确保格式正确（需要是数组格式 [...]）。");
        }
      }

      // --- STEP 2: Normalize Structure ---
      let list = parsed;
      if (!Array.isArray(parsed)) {
        if (parsed.questions && Array.isArray(parsed.questions)) list = parsed.questions;
        else if (parsed.data && Array.isArray(parsed.data)) list = parsed.data;
        else if (parsed.list && Array.isArray(parsed.list)) list = parsed.list;
        else throw new Error("JSON 结构错误：未找到题目数组。");
      }

      // --- STEP 3: Validate & Normalize Fields (Local only) ---
      // We do NOT deduplicate IDs against *themselves* here if they are in different batches,
      // but we do ensure the batch itself is sane.
      
      const normalizedQuestions: Question[] = list.map((item: any, index: number) => {
        // Map fields
        const qText = item.question || item.Question || item.title || item.Title || item.q;
        const opts = item.options || item.Options || item.choices || item.answers;
        let ans = item.answer;
        if (item.Answer !== undefined) ans = item.Answer;
        if (item.correct !== undefined) ans = item.correct;
        
        const exp = item.explanation || item.Explanation || item.analysis || item.desc || "暂无解析";

        // Validation
        if (!qText) throw new Error(`第 ${index + 1} 题缺少题目 (question)`);
        if (!opts || !Array.isArray(opts)) throw new Error(`第 ${index + 1} 题缺少选项 (options)`);

        // Answer Conversion
        if (typeof ans === 'string') {
          const upper = ans.trim().toUpperCase();
          if (['A', 'B', 'C', 'D', 'E'].includes(upper)) {
            ans = upper.charCodeAt(0) - 65;
          } else {
            const foundIdx = opts.findIndex((o: string) => o.trim() === item.answer.trim());
            ans = foundIdx !== -1 ? foundIdx : parseInt(ans);
          }
        }
        if (typeof ans !== 'number' || isNaN(ans) || ans < 0 || ans >= opts.length) {
          ans = 0; // Fallback
        }

        // --- Basic ID Assignment ---
        // We let the parent App handle global deduplication/renaming.
        // Here we just ensure it HAS an ID.
        let finalId = item.id;
        if (finalId === undefined || finalId === null || finalId === '') {
          finalId = `temp_${Date.now()}_${index}`;
        }

        return {
          id: finalId,
          question: qText,
          options: opts,
          answer: ans,
          explanation: exp
        };
      });

      if (normalizedQuestions.length === 0) {
        throw new Error("未找到有效题目。");
      }

      onImport(normalizedQuestions, mode);
      onClose();
      setJsonText('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "导入失败");
    }
  };

  const handleDemoFill = () => {
    const demo = `[
  {
    "id": 1,
    "question": "追加模式测试题 - 新题1",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "answer": 0,
    "explanation": "我是新导入的题目，虽然ID是1，但在追加模式下不会覆盖旧题。"
  }
]`;
    setJsonText(demo);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            导入 JSON 题库
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-auto bg-white">
          <div className="mb-6 bg-blue-50 text-blue-800 p-4 rounded-xl text-sm leading-relaxed">
            <p className="font-bold mb-2">💡 导入说明：</p>
            <ul className="list-disc list-inside space-y-1 opacity-90">
              <li>支持标准 JSON 数组格式。</li>
              <li>系统会自动过滤掉 <code>[cite_start]</code> 等干扰字符。</li>
            </ul>
          </div>

          {/* Mode Switcher */}
          <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
             <label className="block text-sm font-bold text-gray-700 mb-3">当前题库已有 {currentTotal} 道题，请选择导入模式：</label>
             <div className="flex flex-col sm:flex-row gap-4">
                <label className={`flex-1 flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${mode === 'append' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-white'}`}>
                   <input type="radio" name="importMode" value="append" checked={mode === 'append'} onChange={() => setMode('append')} className="w-5 h-5 text-blue-600" />
                   <div className="ml-3">
                      <span className="block font-bold text-gray-800">📥 追加模式 (推荐)</span>
                      <span className="text-xs text-gray-500">保留现有题目和进度。ID冲突时自动重编号。</span>
                   </div>
                </label>

                <label className={`flex-1 flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${mode === 'overwrite' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:bg-white'}`}>
                   <input type="radio" name="importMode" value="overwrite" checked={mode === 'overwrite'} onChange={() => setMode('overwrite')} className="w-5 h-5 text-red-600" />
                   <div className="ml-3">
                      <span className="block font-bold text-red-700">⚠️ 覆盖模式</span>
                      <span className="text-xs text-red-500">清空当前所有题目和进度，仅保留新导入的。</span>
                   </div>
                </label>
             </div>
          </div>

          <textarea
            className="w-full h-48 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm leading-relaxed"
            placeholder={`在此粘贴您的 JSON...`}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
          />
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-start gap-2 animate-[shake_0.5s_ease-in-out]">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between gap-3">
           <button 
            onClick={handleDemoFill}
            className="px-4 py-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors font-medium text-sm hidden sm:block"
          >
            填入测试数据
          </button>
          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl transition-colors font-medium"
            >
              取消
            </button>
            <button 
              onClick={handleImport}
              disabled={!jsonText.trim()}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认导入
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;