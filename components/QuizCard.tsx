import React, { useState, useEffect } from 'react';
import { Question, AnswerState } from '../types';
import { getAIExplanation } from '../services/geminiService';

interface QuizCardProps {
  question: Question;
  currentAnswer: AnswerState | undefined;
  onAnswer: (questionId: string | number, selectedOption: number) => void;
  onExit: () => void;
  totalQuestions: number;
  currentIndex: number;
  modeName?: string;
}

const QuizCard: React.FC<QuizCardProps> = ({
  question,
  currentAnswer,
  onAnswer,
  onExit,
  totalQuestions,
  currentIndex,
  modeName
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Reset local state when question changes
  useEffect(() => {
    setAiAnalysis(null);
    setLoadingAi(false);
  }, [question.id]);

  const hasAnswered = currentAnswer !== undefined;
  
  const handleOptionClick = (index: number) => {
    if (hasAnswered) return;
    onAnswer(question.id, index);
  };

  const handleAskAI = async () => {
    if (!currentAnswer || loadingAi || aiAnalysis) return;
    
    setLoadingAi(true);
    const analysis = await getAIExplanation(
      question,
      currentAnswer.selectedOption!
    );
    setAiAnalysis(analysis);
    setLoadingAi(false);
  };

  const getOptionStyle = (index: number) => {
    const baseStyle = "w-full p-4 text-left rounded-xl border-2 transition-all duration-200 flex items-center mb-3 group relative overflow-hidden";
    
    if (!hasAnswered) {
      return `${baseStyle} border-gray-100 bg-white hover:border-blue-400 hover:bg-blue-50 cursor-pointer active:scale-[0.99] shadow-sm`;
    }

    if (index === question.answer) {
      return `${baseStyle} border-green-500 bg-green-50 text-green-900 font-medium shadow-sm`;
    }

    if (index === currentAnswer.selectedOption && currentAnswer.selectedOption !== question.answer) {
      return `${baseStyle} border-red-500 bg-red-50 text-red-900 shadow-sm`;
    }

    return `${baseStyle} border-gray-100 bg-gray-50 text-gray-400 opacity-60`;
  };

  const getOptionIcon = (index: number) => {
    const labels = ['A', 'B', 'C', 'D'];
    const label = labels[index] || '?';

    if (!hasAnswered) {
      return (
        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 mr-4 font-bold text-sm group-hover:bg-blue-200 group-hover:text-blue-700 transition-colors">
          {label}
        </span>
      );
    }

    if (index === question.answer) {
      return (
        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500 text-white mr-4 shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </span>
      );
    }

    if (index === currentAnswer.selectedOption && currentAnswer.selectedOption !== question.answer) {
      return (
        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500 text-white mr-4 shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </span>
      );
    }

    return (
      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-400 mr-4 font-bold text-sm">
        {label}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar inside Card */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={onExit}
          className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          返回
        </button>
        <div className="text-gray-400 text-sm font-mono">
          <span className="text-blue-600 font-bold text-lg">{currentIndex + 1}</span>
          <span className="mx-1">/</span>
          {totalQuestions}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 flex-1 overflow-y-auto">
        {modeName && (
           <div className="mb-4">
             <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full font-medium">
               {modeName}
             </span>
           </div>
        )}

        {/* Question Text */}
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 leading-relaxed mb-8">
          {question.question}
        </h2>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleOptionClick(idx)}
              className={getOptionStyle(idx)}
              disabled={hasAnswered}
            >
              {getOptionIcon(idx)}
              <span className="text-base md:text-lg text-gray-800">{option}</span>
            </button>
          ))}
        </div>

        {/* Feedback & Analysis Section */}
        {hasAnswered && (
          <div className="mt-8 animate-[fadeIn_0.3s_ease-out]">
            <div className={`p-6 rounded-2xl ${currentAnswer.isCorrect ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
              <h3 className={`font-bold text-lg mb-3 flex items-center gap-2 ${currentAnswer.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                {currentAnswer.isCorrect ? (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    回答正确
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    回答错误
                  </>
                )}
              </h3>
              
              <div className="text-gray-700 leading-relaxed text-sm md:text-base">
                <span className="font-bold text-gray-900 block mb-2">解析：</span>
                <p>{question.explanation || "暂无详细解析"}</p>
              </div>

              {/* AI Tutor Button */}
              {!currentAnswer.isCorrect && (
                <div className="mt-5 pt-5 border-t border-gray-200/50">
                  {!aiAnalysis ? (
                    <button
                      onClick={handleAskAI}
                      disabled={loadingAi}
                      className="flex items-center gap-2 text-sm font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 px-4 py-2.5 rounded-lg transition-colors w-full md:w-auto justify-center"
                    >
                      {loadingAi ? (
                        <>
                           <svg className="animate-spin h-4 w-4 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          AI 老师思考中...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          看不懂？点我让 AI 老师讲讲
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="bg-purple-50 p-5 rounded-xl border border-purple-100">
                      <h4 className="text-purple-800 font-bold mb-2 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        AI 智能点拨
                      </h4>
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{aiAnalysis}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizCard;