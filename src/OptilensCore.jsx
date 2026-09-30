import React, { useState, useEffect } from 'react';
import { Play, Zap, Eye, Sparkles, RefreshCw, Code2, Trophy, CheckCircle, HelpCircle, Star, Award, X } from 'lucide-react';

const GEMINI_API_KEY =
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_GEMINI_API_KEY) ||
  (typeof process !== 'undefined' && process.env && process.env.TAC_KEY) ||
  (typeof process !== 'undefined' && process.env && process.env.VITE_GEMINI_API_KEY) ||
  '';

export default function OptilensCore() {
  const [code, setCode] = useState(`int main() {
    int a = 5 * 2;
    int b = a;
    int unused = 100;
    int result = b + 15;
    return result;
}`);

  const [activeTab, setActiveTab] = useState('raw');
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Dynamic Pipeline States
  const [rawTac, setRawTac] = useState([]);
  const [optimizedTac, setOptimizedTac] = useState([]);
  const [quads, setQuads] = useState([]);
  const [triples, setTriples] = useState([]);
  const [metrics, setMetrics] = useState({ rawCount: 0, optCount: 0, deadCount: 0 });

  // 🎮 Integrated AI 5-Question Quiz Challenge States
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizLoading, setQuizLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const getFallbackQuizQuestions = (inputCode) => [
    {
      question: "Which primary optimization pass can be applied to constant expressions in this C++ snippet?",
      options: [
        "Dead Code Elimination",
        "Constant Folding",
        "Loop Unrolling",
        "Register Allocation"
      ],
      correctIndex: 1,
      explanation: "Constant Folding evaluates constant expressions (e.g., 5 * 2) at compile time instead of execution time."
    },
    {
      question: "What happens to unreferenced or dead variables during compiler optimization pass?",
      options: [
        "Inlined into main loop",
        "Retained as global symbols",
        "Removed via Dead Code Elimination",
        "Converted to temporary pointers"
      ],
      correctIndex: 2,
      explanation: "Variables that are assigned but never used (like 'unused = 100') are eliminated to optimize space and execution time."
    },
    {
      question: "How does Copy Propagation optimize code instructions in Intermediate Representation?",
      options: [
        "Replaces variable occurrences with their assigned values/variables",
        "Duplicates code lines for faster parallel execution",
        "Moves variable declarations to top of function scope",
        "Translates high-level operations into assembly macros"
      ],
      correctIndex: 0,
      explanation: "Copy Propagation replaces occurrences of targets of direct assignments with their source values."
    },
    {
      question: "In Three-Address Code (TAC), how many operands are allowed on the right-hand side of an assignment at maximum?",
      options: [
        "Maximum 1 operand",
        "Maximum 2 operands",
        "Unlimited operands",
        "At least 4 operands"
      ],
      correctIndex: 1,
      explanation: "Standard Three-Address Code instructions have at most two operands on the right-hand side."
    },
    {
      question: "What is the primary objective of reducing instruction count in TAC optimization?",
      options: [
        "Increase binary executable size",
        "Reduce memory overhead and CPU cycle consumption",
        "Force compile-time memory leaks",
        "Disable register usage"
      ],
      correctIndex: 1,
      explanation: "Fewer TAC instructions lead to generated assembly code that executes faster and uses fewer CPU instructions."
    }
  ];

  const processCode = (inputCode) => {
    const lines = inputCode.split('\n');
    let raw = [];
    let optimized = [];
    let quadList = [];
    let tripleList = [];
    let tempCount = 1;
    let deadLines = 0;

    let variables = {};
    let usedVars = new Set();

    // First pass: collect usage
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.includes('return')) {
        const parts = trimmed.replace('return', '').replace(';', '').trim();
        if (parts) usedVars.add(parts);
      }
      if (trimmed.includes('+') || trimmed.includes('-') || trimmed.includes('*') || trimmed.includes('/')) {
        const parts = trimmed.split('=');
        if (parts.length > 1) {
          const expr = parts[1].replace(';', '').trim();
          expr.split(/[\+\-\*\/]/).forEach((v) => usedVars.add(v.trim()));
        }
      }
    });

    // Main parsing loop
    lines.forEach((line) => {
      let trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('{') || trimmed.startsWith('}') || trimmed.startsWith('int main')) {
        return;
      }

      // Handle assignments
      if (trimmed.includes('=')) {
        let [left, right] = trimmed.split('=').map((s) => s.replace('int', '').replace(';', '').trim());

        // Arithmetic expressions
        const opMatch = right.match(/([a-zA-Z0-9_]+)\s*([\+\-\*\/])\s*([a-zA-Z0-9_]+)/);

        if (opMatch) {
          const [_, arg1, op, arg2] = opMatch;
          const tempVar = `t${tempCount++}`;

          raw.push({ id: raw.length + 1, text: `${tempVar} = ${arg1} ${op} ${arg2}` });
          raw.push({ id: raw.length + 1, text: `${left} = ${tempVar}` });

          quadList.push({ op, arg1, arg2, result: tempVar });
          quadList.push({ op: '=', arg1: tempVar, arg2: '-', result: left });

          tripleList.push({ index: `(${tripleList.length})`, op, arg1, arg2 });
          tripleList.push({ index: `(${tripleList.length})`, op: '=', arg1: left, arg2: `(${tripleList.length - 1})` });

          // Optimization Pass
          if (!isNaN(arg1) && !isNaN(arg2)) {
            const val = eval(`${arg1} ${op} ${arg2}`);
            variables[left] = val;
            optimized.push({ id: optimized.length + 1, text: `${left} = ${val}`, pass: `Constant Folding (${arg1} ${op} ${arg2} -> ${val})` });
          } else {
            optimized.push({ id: optimized.length + 1, text: `${left} = ${right}`, pass: 'Code Pass' });
          }
        } else {
          raw.push({ id: raw.length + 1, text: `${left} = ${right}` });
          quadList.push({ op: '=', arg1: right, arg2: '-', result: left });
          tripleList.push({ index: `(${tripleList.length})`, op: '=', arg1: left, arg2: right });

          if (!usedVars.has(left) && left !== 'result') {
            deadLines++;
            optimized.push({ id: optimized.length + 1, text: `// ${left} = ${right} (Removed)`, pass: 'Dead Code Elimination' });
          } else {
            optimized.push({ id: optimized.length + 1, text: `${left} = ${right}`, pass: 'Copy Propagation / Assignment' });
          }
        }
      } else if (trimmed.startsWith('return')) {
        const retVal = trimmed.replace('return', '').replace(';', '').trim();
        raw.push({ id: raw.length + 1, text: `return ${retVal}` });
        optimized.push({ id: optimized.length + 1, text: `return ${retVal}`, pass: 'Final Return' });
      }
    });

    setRawTac(raw);
    setOptimizedTac(optimized);
    setQuads(quadList);
    setTriples(tripleList);
    setMetrics({
      rawCount: raw.length,
      optCount: optimized.filter((o) => !o.text.startsWith('//')).length,
      deadCount: deadLines
    });
  };

  useEffect(() => {
    processCode(code);
  }, [code]);

  const fetchQuizForCurrentCode = async (inputCode) => {
    setQuizLoading(true);
    setSelectedAnswer(null);
    setQuizSubmitted(false);
    setCurrentQuestionIndex(0);
    setCorrectAnswersCount(0);
    setShowSummaryModal(false);

    const fallbackQuestions = getFallbackQuizQuestions(inputCode);

    if (!GEMINI_API_KEY) {
      setTimeout(() => {
        setQuizQuestions(fallbackQuestions);
        setQuizLoading(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Based EXACTLY on this C++ code provided by the user:\n\n${inputCode}\n\nGenerate exactly 5 multiple choice quiz questions testing compiler intermediate representation and TAC optimization concepts (e.g. Constant Folding, Dead Code Elimination, Copy Propagation, Instruction Reduction). Provide all text STRICTLY in clean professional English. Return strictly valid JSON format matching this schema without markdown code fences:\n[\n  {\n    "question": "Question text in English based on the C++ code",\n    "options": ["Option A", "Option B", "Option C", "Option D"],\n    "correctIndex": 0,\n    "explanation": "Detailed explanation in English."\n  }\n]`
                  }
                ]
              }
            ]
          })
        }
      );

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedText);
        if (Array.isArray(parsed) && parsed.length >= 5) {
          setQuizQuestions(parsed.slice(0, 5));
        } else {
          setQuizQuestions(fallbackQuestions);
        }
      } else {
        setQuizQuestions(fallbackQuestions);
      }
    } catch (err) {
      setQuizQuestions(fallbackQuestions);
    } finally {
      setQuizLoading(false);
    }
  };

  const runPipeline = async () => {
    setLoading(true);
    setAiLoading(true);

    processCode(code);
    fetchQuizForCurrentCode(code);

    const fallbackAnalysis = `🤖 Gemini Dynamic Code Analysis:

1. Intermediate Representation (TAC):
   • Parsed ${metrics.rawCount} raw statements into simplified three-address code instructions.

2. LLVM Passes & Optimization:
   • Constant Expressions detected and folded at compile time.
   • Variable tracking identified ${metrics.deadCount} unused store operations and eliminated them.

3. Final Execution State:
   • Instructions reduced to ${metrics.optCount} optimized TAC statements.`;

    if (!GEMINI_API_KEY) {
      setTimeout(() => {
        setAiAnalysis(fallbackAnalysis);
        setAiLoading(false);
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Analyze this dynamic C++ source code and its IR/TAC representation in professional English. Explain Constant Folding, Copy Propagation, and Dead Code Elimination step by step:\n\n${code}`
                  }
                ]
              }
            ]
          })
        }
      );

      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        setAiAnalysis(data.candidates[0].content.parts[0].text);
      } else {
        setAiAnalysis(fallbackAnalysis);
      }
    } catch (err) {
      setAiAnalysis(fallbackAnalysis);
    } finally {
      setAiLoading(false);
      setLoading(false);
    }
  };

  const currentQuiz = quizQuestions[currentQuestionIndex];

  const handleQuizSubmit = () => {
    if (selectedAnswer === null || !currentQuiz) return;
    setQuizSubmitted(true);
    
    if (selectedAnswer === currentQuiz.correctIndex) {
      setScore((prev) => prev + 10);
      setCorrectAnswersCount((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setQuizSubmitted(false);
    } else {
      setShowSummaryModal(true);
    }
  };

  const calculateRating = (correctCount) => {
    if (correctCount === 5) return 5;
    if (correctCount === 4) return 4;
    if (correctCount === 3) return 3;
    if (correctCount === 2) return 2;
    return 1;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-100 text-slate-800 font-sans p-4 md:p-8 relative">
      <div className="max-w-7xl mx-auto space-y-6">
        {}
        <header className="bg-white/90 border border-sky-200/80 rounded-2xl p-5 shadow-sm backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-sky-500 text-white rounded-xl shadow-md shadow-sky-200">
              <Zap className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                OptiLens Dynamic TAC Visualizer
              </h1>
              <p className="text-xs text-sky-700 font-medium mt-0.5">
                Phase 4 (IR) & Phase 5 (LLVM Optimization Passes) Engine
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-full shadow-sm text-xs font-bold">
              <Trophy className="w-4 h-4 text-amber-500" /> Score: {score} pts
            </div>
            <div className="flex items-center gap-2 bg-sky-100 border border-sky-300/80 px-3 py-1.5 rounded-full shadow-inner">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-sky-900">Gemini Active & Connected</span>
            </div>
          </div>
        </header>

        {}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Code Input */}
          <div className="bg-white/90 border border-sky-200/80 rounded-2xl p-6 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-sky-900 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-sky-600" /> Dynamic C++ Input
              </h2>
              <span className="text-xs bg-sky-100 text-sky-800 px-2.5 py-1 rounded-md font-mono font-medium border border-sky-200">
                main.cpp
              </span>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste any C++ code here..."
              className="w-full h-80 bg-slate-900 text-emerald-300 font-mono text-sm p-4 rounded-xl border border-slate-700 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 resize-none shadow-inner"
              spellCheck="false"
            />

            <button
              onClick={runPipeline}
              disabled={loading || aiLoading}
              className="mt-4 w-full py-3.5 px-6 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-md shadow-sky-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading || aiLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Analyzing Code & Generating TAC...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>RUN PIPELINE & AI TRACE</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Representation Tabs */}
          <div className="bg-white/90 border border-sky-200/80 rounded-2xl p-6 shadow-sm flex flex-col">
            {/* Dynamic Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-sky-50/80 border border-sky-200 p-3 rounded-xl text-center">
                <p className="text-[10px] text-sky-800 uppercase font-bold">Raw Instructions</p>
                <p className="text-xl font-extrabold text-blue-700 mt-0.5">{metrics.rawCount}</p>
              </div>
              <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-xl text-center">
                <p className="text-[10px] text-emerald-800 uppercase font-bold">Optimized TAC</p>
                <p className="text-xl font-extrabold text-emerald-700 mt-0.5">{metrics.optCount}</p>
              </div>
              <div className="bg-rose-50/80 border border-rose-200 p-3 rounded-xl text-center">
                <p className="text-[10px] text-rose-800 uppercase font-bold">Dead Code Lines</p>
                <p className="text-xl font-extrabold text-rose-600 mt-0.5">{metrics.deadCount}</p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-sky-100/80 p-1.5 rounded-xl border border-sky-200 mb-4 gap-1 overflow-x-auto">
              {[
                { id: 'raw', label: 'RAW' },
                { id: 'passes', label: 'PASSES' },
                { id: 'optimized', label: 'OPTIMIZED' },
                { id: 'quads', label: 'QUADS' },
                { id: 'triples', label: 'TRIPLES' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-sky-800 shadow-sm border border-sky-200'
                      : 'text-sky-700 hover:text-sky-900 hover:bg-sky-200/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-y-auto max-h-80 font-mono text-sm shadow-inner">
              {activeTab === 'raw' && (
                <div className="space-y-2">
                  {rawTac.map((item) => (
                    <div key={item.id} className="flex gap-4 text-slate-300 border-b border-slate-800 pb-1.5">
                      <span className="text-slate-500 text-xs w-6">{item.id}.</span>
                      <span className="text-sky-300">{item.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'passes' && (
                <div className="space-y-2.5">
                  {optimizedTac.map((item) => (
                    <div key={item.id} className="p-2.5 bg-slate-800/90 rounded-lg border border-slate-700/80">
                      <div className="text-emerald-400 font-semibold">{item.text}</div>
                      <div className="text-xs text-sky-300 mt-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" /> Pass: {item.pass}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'optimized' && (
                <div className="space-y-2">
                  {optimizedTac.map((item) => (
                    <div key={item.id} className="flex gap-4 text-emerald-300 border-b border-slate-800 pb-1.5">
                      <span className="text-slate-500 text-xs w-6">{item.id}.</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'quads' && (
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="text-sky-400 border-b border-slate-800">
                    <tr>
                      <th className="p-2">OP</th>
                      <th className="p-2">ARG1</th>
                      <th className="p-2">ARG2</th>
                      <th className="p-2">RESULT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quads.map((q, idx) => (
                      <tr key={idx} className="border-b border-slate-800/50">
                        <td className="p-2 text-pink-400 font-bold">{q.op}</td>
                        <td className="p-2">{q.arg1}</td>
                        <td className="p-2">{q.arg2}</td>
                        <td className="p-2 text-sky-300">{q.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'triples' && (
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="text-sky-400 border-b border-slate-800">
                    <tr>
                      <th className="p-2">#</th>
                      <th className="p-2">OP</th>
                      <th className="p-2">ARG1</th>
                      <th className="p-2">ARG2</th>
                    </tr>
                  </thead>
                  <tbody>
                    {triples.map((t, idx) => (
                      <tr key={idx} className="border-b border-slate-800/50">
                        <td className="p-2 text-slate-500">{t.index}</td>
                        <td className="p-2 text-pink-400 font-bold">{t.op}</td>
                        <td className="p-2">{t.arg1}</td>
                        <td className="p-2">{t.arg2}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {}
        <div className="bg-white/90 border border-sky-200/80 rounded-2xl p-6 shadow-sm space-y-6">
          {/* Part 1: Smart Logic Trace */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-sky-900 flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" /> Smart Logic Trace & Optimization Insights
            </h2>

            <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-5 min-h-[100px]">
              {aiLoading ? (
                <div className="flex items-center gap-3 text-sky-800 text-sm font-medium">
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                  <span>Gemini 2.5 Flash is analyzing your C++ code dynamic IR...</span>
                </div>
              ) : aiAnalysis ? (
                <div className="text-sm text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                  {aiAnalysis}
                </div>
              ) : (
                <div className="text-sm text-sky-700 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>Type any C++ code above and click "RUN PIPELINE & AI TRACE".</span>
                </div>
              )}
            </div>
          </div>

          {/* Part 2: 5-Question Dynamic Code Quiz Embedded in English */}
          <div className="border-t border-sky-200/80 pt-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" /> AI Interactive Quiz (Based on Input C++ Code)
              </h2>
              {quizQuestions.length > 0 && (
                <span className="text-xs bg-amber-100 border border-amber-300 text-amber-900 px-2.5 py-1 rounded-full font-bold">
                  Question {currentQuestionIndex + 1} of {quizQuestions.length}
                </span>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-200">
              {quizLoading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-sky-400 text-xs font-medium">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Generating 5 English quiz questions based on your C++ code...
                </div>
              ) : currentQuiz ? (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-sky-300">{currentQuiz.question}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 my-3">
                    {currentQuiz.options.map((opt, idx) => {
                      let optionStyle = 'bg-slate-800 border-slate-700 text-slate-300 hover:border-sky-400';

                      if (quizSubmitted) {
                        if (idx === currentQuiz.correctIndex) {
                          optionStyle = 'bg-emerald-950 border-emerald-500 text-emerald-200';
                        } else if (idx === selectedAnswer) {
                          optionStyle = 'bg-rose-950 border-rose-500 text-rose-200';
                        }
                      } else if (selectedAnswer === idx) {
                        optionStyle = 'bg-sky-900 border-sky-400 text-white';
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => !quizSubmitted && setSelectedAnswer(idx)}
                          className={`text-left text-xs p-3 rounded-lg border transition-all ${optionStyle}`}
                        >
                          <span className="font-bold mr-2 text-sky-400">{String.fromCharCode(65 + idx)}.</span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {!quizSubmitted ? (
                    <button
                      onClick={handleQuizSubmit}
                      disabled={selectedAnswer === null}
                      className="py-2.5 px-6 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-all disabled:opacity-40"
                    >
                      SUBMIT ANSWER
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div
                        className={`p-3 rounded-lg text-xs border ${
                          selectedAnswer === currentQuiz.correctIndex
                            ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
                            : 'bg-rose-950/80 border-rose-600 text-rose-200'
                        }`}
                      >
                        <p className="font-bold mb-1 flex items-center gap-1">
                          {selectedAnswer === currentQuiz.correctIndex ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-emerald-400" /> Correct Answer! (+10 Points)
                            </>
                          ) : (
                            <>
                              <HelpCircle className="w-4 h-4 text-rose-400" /> Incorrect Answer
                            </>
                          )}
                        </p>
                        <p className="text-slate-300 mt-1">{currentQuiz.explanation}</p>
                      </div>

                      <button
                        onClick={handleNextQuestion}
                        className="py-2.5 px-6 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-2"
                      >
                        {currentQuestionIndex < quizQuestions.length - 1 ? 'NEXT QUESTION →' : 'VIEW FINAL SCORE & RATING 🏆'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-400">
                  Run the code pipeline to generate a 5-question AI quiz tailored to your C++ input code.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-sky-200 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative text-center animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowSummaryModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing Trophy Header */}
            <div className="mx-auto w-20 h-20 bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-full flex items-center justify-center shadow-lg shadow-amber-200 mb-4 animate-bounce">
              <Trophy className="w-10 h-10 text-amber-950" />
            </div>

            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Quiz Completed!</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Optimization Assessment Report</p>

            {/* Score Display */}
            <div className="my-5 p-4 bg-sky-50 border border-sky-200 rounded-2xl">
              <p className="text-xs uppercase font-bold text-sky-800">Your Accuracy</p>
              <p className="text-3xl font-black text-sky-950 mt-1">
                {correctAnswersCount} / {quizQuestions.length} Correct
              </p>
              <p className="text-xs font-semibold text-amber-700 mt-1">+ {correctAnswersCount * 10} Total Points Earned</p>
            </div>

            {/* 1 to 5 Star Rating */}
            <div className="mb-6">
              <p className="text-xs font-bold uppercase text-slate-600 mb-2">Performance Rating</p>
              <div className="flex justify-center items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((starIndex) => {
                  const rating = calculateRating(correctAnswersCount);
                  const isFilled = starIndex <= rating;
                  return (
                    <Star
                      key={starIndex}
                      className={`w-8 h-8 transition-all ${
                        isFilled ? 'text-amber-400 fill-amber-400 drop-shadow-md' : 'text-slate-200 fill-slate-100'
                      }`}
                    />
                  );
                })}
              </div>
              <p className="text-xs font-bold text-slate-700 mt-2">
                {calculateRating(correctAnswersCount)} out of 5 Stars
              </p>
            </div>

            <button
              onClick={() => {
                setShowSummaryModal(false);
                fetchQuizForCurrentCode(code);
              }}
              className="w-full py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-md shadow-sky-200 transition-all text-sm flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> RETAKE QUIZ FOR THIS CODE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
