import React, { useState, useMemo, useEffect } from 'react';
import QuizCard from './components/QuizCard';
import Dashboard from './components/Dashboard';
import ImportModal from './components/ImportModal';
import { Question, UserAnswers, ImportMode } from './types';
import { DEFAULT_QUESTIONS } from './constants';

type ViewState = 'dashboard' | 'quiz';
type QuizModeType = 'sequential' | 'random' | 'mistake';

const STORAGE_KEYS = {
  QUESTIONS: 'exam_crusher_questions_v2',
  ANSWERS: 'exam_crusher_answers_v2'
};

const App: React.FC = () => {
  // --- Global Data State ---
  const [allQuestions, setAllQuestions] = useState<Question[]>(DEFAULT_QUESTIONS);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [isLoaded, setIsLoaded] = useState(false);
  
  // --- View State ---
  const [view, setView] = useState<ViewState>('dashboard');
  const [showImport, setShowImport] = useState(false);
  const [activeMode, setActiveMode] = useState<QuizModeType>('sequential');
  
  // --- Quiz Session State ---
  const [quizQueue, setQuizQueue] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  // --- Persistence Logic ---
  // Load on mount
  useEffect(() => {
    try {
      const savedQuestions = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
      const savedAnswers = localStorage.getItem(STORAGE_KEYS.ANSWERS);

      if (savedQuestions) {
        setAllQuestions(JSON.parse(savedQuestions));
      }
      if (savedAnswers) {
        setUserAnswers(JSON.parse(savedAnswers));
      }
    } catch (e) {
      console.error("Failed to load progress", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(allQuestions));
      localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(userAnswers));
    }
  }, [allQuestions, userAnswers, isLoaded]);

  // --- Derived State ---
  const wrongQuestionIds = useMemo(() => {
    return Object.keys(userAnswers).filter(id => !userAnswers[id].isCorrect);
  }, [userAnswers]);

  const currentQuestion = quizQueue[currentIdx];

  // --- Handlers ---

  const handleStartMode = (mode: QuizModeType) => {
    let queue: Question[] = [];

    if (mode === 'sequential') {
      queue = [...allQuestions];
    } else if (mode === 'mistake') {
      queue = allQuestions.filter(q => wrongQuestionIds.includes(q.id.toString()));
    } else if (mode === 'random') {
      // Shuffle and pick 50
      queue = [...allQuestions]
        .sort(() => 0.5 - Math.random())
        .slice(0, 50);
    }

    if (queue.length === 0) {
      alert("当前模式下没有可练习的题目");
      return;
    }

    setQuizQueue(queue);
    setActiveMode(mode);
    setCurrentIdx(0);
    setView('quiz');
  };

  const handleSearch = (term: string) => {
    if (!term.trim()) return;
    const filtered = allQuestions.filter(q => 
      q.question.toLowerCase().includes(term.toLowerCase()) || 
      q.options.some(o => o.toLowerCase().includes(term.toLowerCase()))
    );
    
    if (filtered.length > 0) {
      setQuizQueue(filtered);
      setActiveMode('sequential'); // Treat search results as a linear sequence
      setCurrentIdx(0);
      setView('quiz');
    }
  };

  const handleAnswer = (questionId: string | number, selectedOption: number) => {
    const question = allQuestions.find(q => q.id === questionId);
    if (!question) return;

    const isCorrect = selectedOption === question.answer;

    // Update global answers
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: {
        selectedOption,
        isCorrect
      }
    }));
  };

  const handleNext = () => {
    if (currentIdx < quizQueue.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      // End of quiz
      const confirmExit = window.confirm("本轮练习已结束，返回主页？");
      if (confirmExit) {
        setView('dashboard');
      }
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  /**
   * CORE LOGIC UPDATE: Smart Import
   * Handles merging new questions with existing ones, resolving ID conflicts.
   */
  const handleImport = (newQuestions: Question[], mode: ImportMode) => {
    if (mode === 'overwrite') {
      // Simple overwrite
      setAllQuestions(newQuestions);
      setUserAnswers({});
      alert(`已覆盖导入 ${newQuestions.length} 道新题目`);
    } else {
      // Append / Merge Mode
      setAllQuestions(prevQuestions => {
        const existingIds = new Set(prevQuestions.map(q => q.id.toString()));
        const existingContentMap = new Map(
          prevQuestions.map(q => [`${q.question.trim()}|${q.options.join(',')}`, q.id])
        );

        const merged = [...prevQuestions];
        let addedCount = 0;
        let skippedCount = 0;
        let renamedCount = 0;

        newQuestions.forEach(newQ => {
          const contentKey = `${newQ.question.trim()}|${newQ.options.join(',')}`;
          
          // 1. Check if exact content already exists (Avoid absolute duplicates)
          if (existingContentMap.has(contentKey)) {
            skippedCount++;
            return;
          }

          // 2. Check for ID collision
          let finalId = newQ.id;
          if (existingIds.has(finalId.toString())) {
            // ID conflict! But content is different (since we passed check #1).
            // We must rename this new question to keep both.
            finalId = `${newQ.id}_imported_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            renamedCount++;
          }

          merged.push({ ...newQ, id: finalId });
          existingIds.add(finalId.toString());
          addedCount++;
        });

        const msg = `导入完成！\n新增: ${addedCount} 题\n跳过重复: ${skippedCount} 题\n自动重编号: ${renamedCount} 题 (ID冲突但内容不同)`;
        alert(msg);
        return merged;
      });
      // Do NOT clear userAnswers in append mode
    }
    setView('dashboard');
  };

  const handleReset = () => {
    if (window.confirm("确定要重置所有学习进度吗？错题记录将被清空。")) {
      setUserAnswers({});
    }
  };

  const getModeDisplayName = () => {
    switch(activeMode) {
      case 'mistake': return '错题死磕模式';
      case 'random': return '随机抽查';
      case 'sequential': return '顺序刷题';
      default: return '练习模式';
    }
  };

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center text-gray-500">正在加载题库...</div>;

  return (
    <div className="min-h-screen pb-safe">
      
      {/* View: Dashboard */}
      {view === 'dashboard' && (
        <Dashboard 
          totalQuestions={allQuestions.length}
          wrongCount={wrongQuestionIds.length}
          onStartMode={handleStartMode}
          onImport={() => setShowImport(true)}
          onReset={handleReset}
          onSearch={handleSearch}
        />
      )}

      {/* View: Quiz */}
      {view === 'quiz' && currentQuestion && (
        <div className="max-w-4xl mx-auto px-4 py-6 h-screen flex flex-col">
          {/* Main Card Area */}
          <div className="flex-1 min-h-0">
             <QuizCard 
                question={currentQuestion}
                currentIndex={currentIdx}
                totalQuestions={quizQueue.length}
                currentAnswer={userAnswers[currentQuestion.id]}
                onAnswer={handleAnswer}
                onExit={() => setView('dashboard')}
                modeName={getModeDisplayName()}
              />
          </div>

          {/* Fixed Bottom Navigation for Quiz */}
          <div className="pt-6 pb-2">
            <div className="flex gap-4">
              <button 
                 onClick={handlePrev}
                 disabled={currentIdx === 0}
                 className={`flex-1 py-3.5 rounded-xl font-bold text-center transition-colors ${currentIdx === 0 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-white text-gray-700 shadow-sm border border-gray-100 hover:bg-gray-50'}`}
               >
                 上一题
               </button>
               
               <button 
                 onClick={handleNext}
                 className="flex-1 py-3.5 rounded-xl font-bold text-center text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors"
               >
                 {currentIdx === quizQueue.length - 1 ? '完成练习' : '下一题'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      <ImportModal 
        isOpen={showImport} 
        onClose={() => setShowImport(false)} 
        onImport={handleImport}
        currentTotal={allQuestions.length}
      />
    </div>
  );
};

export default App;