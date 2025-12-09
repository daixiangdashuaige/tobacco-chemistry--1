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
      // --- 核心升级：智能清洗数据 ---
      let rawInput = jsonText.trim();
      
      // 1. 自动剥离 Markdown 代码块标记 (```json ... ```)
      const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
      const match = rawInput.match(codeBlockRegex);
      if (match && match[1]) {
        rawInput = match[1].trim(); 
      }

      // 2. 移除 AI 引用标记
      let cleanJson = rawInput
        .replace(/\[cite_start\]/g, '')
        .replace(/\]+\]/g, '')
        .replace(/\[cite_end\]/g, '');

      // 3. 终极保险：只截取最外层的 [...]
      const firstBracket = cleanJson.indexOf('[');
      const lastBracket = cleanJson.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        cleanJson = cleanJson.substring(firstBracket, lastBracket + 1);
      }

      // --- 解析 JSON ---
      let parsed: any;
      try {
        // 尝试修复末尾多余逗号
        const fixedJson = cleanJson.replace(/,\s*([\]}])/g, '$1'); 
        parsed = JSON.parse(fixedJson);
      } catch (e) {
         throw new Error("无法识别格式。请确保你复制的是 [...] 数组格式，或者直接复制 AI 给出的完整代码块。");
      }

      // --- 结构标准化 ---
      let list = parsed;
      if (!Array.isArray(parsed)) {
        if (parsed.questions && Array.isArray(parsed.questions)) list = parsed.questions;
        else if (parsed.data && Array.isArray(parsed.data)) list = parsed.data;
        else if (parsed.list && Array.isArray(parsed.list)) list = parsed.list;
        else throw new Error("数据格式不对：找不到题目数组。");
      }

      // --- 字段处理 ---
      const normalizedQuestions: Question[] = list.map((item: any, index: number) => {
        const qText = item.question || item.Question || item.title || item.Title || item.q;
        const opts = item.options || item.Options || item.choices || item.answers;
        let ans = item.answer;
        
        // 兼容各种答案字段名
        if (item.Answer !== undefined) ans = item.Answer;
        if (item.correct !== undefined) ans = item.correct;
        if (item.correctAnswer !== undefined) ans = item.correctAnswer;
        
        const exp = item.explanation || item.Explanation || item.analysis || item.desc || "暂无解析";

        if (!qText) throw new Error(`第 ${index + 1} 题缺少题目内容`);
        if (!opts || !Array.isArray(opts)) throw new Error(`第 ${index + 1} 题缺少选项数组`);

        // 智能转换 "A" -> 0
        if (typeof ans === 'string') {
          const upper = ans.trim().toUpperCase();
          if (['A', 'B', 'C', 'D', 'E'].includes(upper)) {
            ans = upper.charCodeAt(0) - 65;
          } else {
            const num = parseInt(ans);
            if (!isNaN(num)) ans = num;
            else {
                // 尝试匹配选项文字
                const foundIdx = opts.findIndex((o: string) => o.trim() === item.answer.trim());
                ans = foundIdx !== -1 ? foundIdx : 0;
            }
          }
        }
        
        // 兜底防止报错
        if (typeof ans !== 'number' || isNaN(ans) || ans < 0 || ans >= opts.length) {
          ans = 0; 
        }

        let finalId = item.id;
        if (!finalId) finalId = `imported_${Date.now()}_${index}`;

        return {
          id: finalId,
          question: qText,
          options: opts,
          answer: ans,
          explanation: exp
        };
      });

      if (normalizedQuestions.length === 0) throw new Error("没有读取到有效题目。");

      onImport(normalizedQuestions, mode);
      onClose();
      setJsonText('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "导入出错，请检查数据。");
    }
  };

  const handleDemoFill = () => {
    const demo = `[
  {
    "id": 1,
    "question": "测试题：烟草中的主要生物碱是？",
    "options": ["咖啡因", "烟碱", "茶碱", "可可碱"],
    "answer": 1,
    "explanation": "烟碱（尼古丁）是烟草特有的生物碱。"
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
            导入题库
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-full">
            ✕
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-auto bg-white">
          <div className="mb-6 bg-blue-50 text-blue-800 p-4 rounded-xl text-sm leading-relaxed">
            <p className="font-bold mb-2">💡 懒人模式：</p>
            <ul className="list-disc list-inside space-y-1 opacity-90">
              <li>直接粘贴 AI 给你的整个回答（哪怕带着 ```json 也没关系）。</li>
              <li>系统会自动提取里面的题目。</li>
            </ul>
          </div>

          <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
             <label className="block text-sm font-bold text-gray-700 mb-3">现有 {currentTotal} 题，请选择：</label>
             <div className="flex gap-4">
                <label className={`flex-1 flex items-center p-3 rounded-lg border-2 cursor-pointer ${mode === 'append' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                   <input type="radio" value="append" checked={mode === 'append'} onChange={() => setMode('append')} className="text-blue-600" />
                   <div className="ml-3"><span className="block font-bold">📥 追加 (保留旧题)</span></div>
                </label>
                <label className={`flex-1 flex items-center p-3 rounded-lg border-2 cursor-pointer ${mode === 'overwrite' ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
                   <input type="radio" value="overwrite" checked={mode === 'overwrite'} onChange={() => setMode('overwrite')} className="text-red-600" />
                   <div className="ml-3"><span className="block font-bold text-red-700">⚠️ 覆盖 (清空旧题)</span></div>
                </label>
             </div>
          </div>

          <textarea
            className="w-full h-48 p-4 border border-gray-300 rounded-xl font-mono text-sm"
            placeholder="在此粘贴..."
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
          />
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between gap-3">
           <button onClick={handleDemoFill} className="text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl text-sm">试一试</button>
           <div className="flex gap-3">
             <button onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl">取消</button>
             <button onClick={handleImport} disabled={!jsonText.trim()} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50">确认导入</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
