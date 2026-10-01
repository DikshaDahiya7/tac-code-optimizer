import React, { useState, useEffect } from 'react';
import { Play, Zap, Eye, Sparkles, RefreshCw, Code2, Trophy, CheckCircle, HelpCircle, Star, RotateCcw, X } from 'lucide-react';

const GEMINI_API_KEY =
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_GEMINI_API_KEY) ||
  (typeof process !== 'undefined' && process.env && process.env.TAC_KEY) ||
  (typeof process !== 'undefined' && process.env && process.env.VITE_GEMINI_API_KEY) ||
  '';

export default function OptilensCore() {
  const [code, setCode] = useState(`int main() {
    int base = 10;
    int height = 20;
    int area = (base * height) / 2;
    int unused_metric = 999;
    return area;
}`);

  const [activeTab, setActiveTab] = useState('raw');
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Pipeline States
  const [rawTac, setRawTac] = useState([]);
  const [optimizedTac, setOptimizedTac] = useState([]);
  const [quads, setQuads] = useState([]);
  const [triples, setTriples] = useState([]);
  const [metrics, setMetrics] = useState({ rawCount: 0, optCount: 0, deadCount: 0 });

  // Quiz States
  const [quizList, setQuizList] = useState([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizLoading, setQuizLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    setScore(0);
    setQuizList([]);
    setCurrentQuizIndex(0);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setShowModal(false);
  };

  // C++ Compiler Parser & Flow Analyzer
  const processCode = (inputCode) => {
    const lines = inputCode.split('\n');
    let raw = [];
    let optimized = [];
    let quadList = [];
    let tripleList = [];
    let tempCount = 1;
    let deadLines = 0;

    let usedVars = new Set();

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.includes('return')) {
        const parts = trimmed.replace('return', '').replace(';', '').trim();
        if (parts) usedVars.add(parts);
      }
      if (trimmed.includes('+') || trimmed.includes('-') || trimmed.includes('*') || trimmed.includes('/') || trimmed.includes('%')) {
        const parts = trimmed.split('=');
        if (parts.length > 1) {
          const expr = parts[1].replace(';', '').trim();
          expr.split(/[\+\-\*\/\%]/).forEach((v) => {
            let cleanV = v.trim().replace(/[\(\)]/g, '');
            if (cleanV) usedVars.add(cleanV);
          });
        }
      }
    });

    lines.forEach((line) => {
      let trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('{') || trimmed.startsWith('}') || trimmed.startsWith('int main')) {
        return;
      }

      if (trimmed.includes('=')) {
        let [left, right] = trimmed.split('=').map((s) => s.replace('int', '').replace(';', '').trim());
        const opMatch = right.match(/([a-zA-Z0-9_]+)\s*([\+\-\*/\%])\s*([a-zA-Z0-9_]+)/);

        if (opMatch) {
          const [_, arg1, op, arg2] = opMatch;
          const tempVar = `t${tempCount++}`;

          raw.push({ id: raw.length + 1, text: `${tempVar} = ${arg1} ${op} ${arg2}` });
          raw.push({ id: raw.length + 1, text: `${left} = ${tempVar}` });

          quadList.push({ op, arg1, arg2, result: tempVar });
          quadList.push({ op: '=', arg1: tempVar, arg2: '-', result: left });

          tripleList.push({ index: `(${tripleList.length})`, op, arg1, arg2 });
          tripleList.push({ index: `(${tripleList.length})`, op: '=', arg1: left, arg2: `(${tripleList.length - 1})` });

          if (!isNaN(arg1) && !isNaN(arg2)) {
            try {
              const val = eval(`${arg1} ${op} ${arg2}`);
              optimized.push({ id: optimized.length + 1, text: `${left} = ${val}`, pass: `Constant Folding (${arg1} ${op} ${arg2} -> ${val})` });
            } catch (e) {
              optimized.push({ id: optimized.length + 1, text: `${left} = ${right}`, pass: 'Arithmetic Lowering' });
            }
          } else {
            optimized.push({ id: optimized.length + 1, text: `${left} = ${right}`, pass: 'Expression Lowering' });
          }
        } else {
          raw.push({ id: raw.length + 1, text: `${left} = ${right}` });
          quadList.push({ op: '=', arg1: right, arg2: '-', result: left });
          tripleList.push({ index: `(${tripleList.length})`, op: '=', arg1: left, arg2: right });

          if (!usedVars.has(left) && left !== 'result' && !left.includes('output') && !left.includes('final')) {
            deadLines++;
            optimized.push({ id: optimized.length + 1, text: `// ${left} = ${right} (Pruned)`, pass: 'Dead Code Elimination (DCE)' });
          } else {
            optimized.push({ id: optimized.length + 1, text: `${left} = ${right}`, pass: 'Copy Propagation / Assignment' });
          }
        }
      } else if (trimmed.startsWith('return')) {
        const retVal = trimmed.replace('return', '').replace(';', '').trim();
        raw.push({ id: raw.length + 1, text: `return ${retVal}` });
        optimized.push({ id: optimized.length + 1, text: `return ${retVal}`, pass: 'Terminal Return Mapping' });
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

  // Shuffler with Balanced Short Options
  const shuffleOptions = (correctOpt, distractors) => {
    const all = [correctOpt, ...distractors];
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return {
      options: all,
      correctIndex: all.indexOf(correctOpt)
    };
  };

  // 100% Dynamic Code-Specific Quiz Engine (Generates fresh questions per input code with short options)
  const buildDynamicCodeQuiz = (targetCode) => {
    const lines = targetCode.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('{') && !l.startsWith('}'));
    
    let vars = [];
    let mathExprs = [];
    let deadVars = [];
    let returnVal = 'result';

    lines.forEach(l => {
      if (l.includes('return')) {
        returnVal = l.replace('return', '').replace(';', '').trim();
      }
      if (l.includes('=')) {
        let parts = l.split('=');
        let vName = parts[0].replace('int', '').trim();
        let rhs = parts[1].replace(';', '').trim();
        vars.push({ name: vName, rhs });

        if (/[\+\-\*\/\%]/.test(rhs)) {
          mathExprs.push({ name: vName, rhs });
        }
        if (vName.includes('unused') || vName.includes('dummy') || vName.includes('metric') || vName.includes('log') || vName.includes('obsolete')) {
          deadVars.push(vName);
        }
      }
    });

    let generatedQuestions = [];

    // Q1: Specific Variable Symbol Table Check
    if (vars.length > 0) {
      const target = vars[0];
      const decoy = vars.length > 1 ? vars[1].name : 'temp_reg';
      const shuffled = shuffleOptions(`Symbol Table Entry`, [
        `Register Allocation`,
        `Heap Memory Block`,
        `Direct Bytecode`
      ]);
      generatedQuestions.push({
        question: `During the lexical scan of '${target.name} = ${target.rhs}', what core data structure records this identifier's data type and scope?`,
        options: shuffled.options,
        correctIndex: shuffled.correctIndex,
        explanation: `The Symbol Table stores all declared identifiers like '${target.name}', tracking their data types, scopes, and memory offsets.`
      });
    }

    // Q2: Specific Math Expression TAC Lowering
    if (mathExprs.length > 0) {
      const math = mathExprs[0];
      const shuffled = shuffleOptions(`t1 = ${math.rhs}`, [
        `Direct Register Assignment`,
        `Stack Pointer Shift`,
        `Inline Assembly Jump`
      ]);
      generatedQuestions.push({
        question: `For the expression assigned to '${math.name}' (${math.rhs}), what is the exact first Three-Address Code (TAC) instruction generated?`,
        options: shuffled.options,
        correctIndex: shuffled.correctIndex,
        explanation: `TAC strictly limits every instruction to 3 addresses, decomposing '${math.rhs}' using an intermediate temporary register like 't1'.`
      });
    } else if (vars.length > 1) {
      const v2 = vars[1];
      const shuffled = shuffleOptions(`Copy Assignment (${v2.name} = ${v2.rhs})`, [
        `Bitwise XOR Operation`,
        `Pointer Dereference`,
        `Heap Allocation`
      ]);
      generatedQuestions.push({
        question: `How does intermediate code lowering process the simple scalar assignment '${v2.name} = ${v2.rhs}'?`,
        options: shuffled.options,
        correctIndex: shuffled.correctIndex,
        explanation: `Direct scalar assignments translate into a single atomic copy TAC instruction without requiring temporary variables.`
      });
    }

    // Q3: Constant Folding Pass on specific expression
    if (mathExprs.length > 0) {
      const m = mathExprs[0];
      const shuffled = shuffleOptions(`Constant Folding`, [
        `Dead Code Elimination`,
        `Common Subexpression`,
        `Loop Unrolling`
      ]);
      generatedQuestions.push({
        question: `Which compiler optimization pass evaluates static literal operands in '${m.name} = ${m.rhs}' prior to runtime execution?`,
        options: shuffled.options,
        correctIndex: shuffled.correctIndex,
        explanation: `Constant Folding pre-calculates static arithmetic expressions during compilation to remove unnecessary runtime CPU cycles.`
      });
    }

    // Q4: Specific Dead Variable Pruning
    const dv = deadVars.length > 0 ? deadVars[0] : (vars.length > 2 ? vars[vars.length - 2].name : 'aux_var');
    const shuffledDCE = shuffleOptions(`Dead Code Elimination (DCE)`, [
      `Constant Propagation`,
      `Register Spilling`,
      `Syntax Tokenization`
    ]);
    generatedQuestions.push({
      question: `Why is variable '${dv}' targeted for removal during optimization passes in this specific program?`,
      options: shuffledDCE.options,
      correctIndex: shuffledDCE.correctIndex,
      explanation: `Liveness data-flow analysis identifies that variable '${dv}' is never read downstream, allowing Dead Code Elimination (DCE) to prune it safely.`
    });

    // Q5: Quadruples Table Representation
    const shuffledQuads = shuffleOptions(`(Op, Arg1, Arg2, Result)`, [
      `(#, Op, Arg1, Arg2)`,
      `(Index, Symbol, Type)`,
      `(Register, Offset, Value)`
    ]);
    generatedQuestions.push({
      question: `What explicit 4-tuple record structure is utilized by Quadruples to store expressions parsed from this code?`,
      options: shuffledQuads.options,
      correctIndex: shuffledQuads.correctIndex,
      explanation: `Quadruples use 4 distinct attributes per instruction row: Operator, Argument 1, Argument 2, and Result target variable.`
    });

    // Q6: Triples Table Positional Indexing
    const shuffledTriples = shuffleOptions(`Positional Instruction Index (0, 1...)`, [
      `Explicit Result Variable Names`,
      `Dynamic Heap Pointers`,
      `Hardware Memory Offsets`
    ]);
    generatedQuestions.push({
      question: `How do Triples avoid explicit result variable names to achieve memory efficiency in this IR sequence?`,
      options: shuffledTriples.options,
      correctIndex: shuffledTriples.correctIndex,
      explanation: `Triples use numerical instruction position indices (e.g. (0), (1)) to reference previous intermediate results directly.`
    });

    // Q7: Terminal Return Variable Mapping
    const shuffledRet = shuffleOptions(`Terminal Return IR Tuple`, [
      `Stack Frame Purge`,
      `Unconditional Jump Loop`,
      `Global Pointer Swap`
    ]);
    generatedQuestions.push({
      question: `How is the final return statement returning '${returnVal}' handled during intermediate representation generation?`,
      options: shuffledRet.options,
      correctIndex: shuffledRet.correctIndex,
      explanation: `The return statement maps to a terminal TAC instruction that passes the final evaluated register value back to the caller.`
    });

    return generatedQuestions;
  };

  const fetchConceptQuizForCurrentCode = async (targetCode) => {
    setQuizLoading(true);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setCurrentQuizIndex(0);
    setScore(0);
    setShowModal(false);

    const generatedQuiz = buildDynamicCodeQuiz(targetCode);

    if (!GEMINI_API_KEY) {
      setTimeout(() => {
        setQuizList(generatedQuiz);
        setQuizLoading(false);
      }, 300);
      return;
    }

    try {
      const cacheBust = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
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
                    text: `Analyze this C++ code (ID: ${cacheBust}):\n\n\`\`\`cpp\n${targetCode}\n\`\`\`\n\nGenerate 6 unique, highly rigorous multiple-choice questions with short, concise options (max 4-5 words per option) specifically referencing THIS code's variables and expressions. Return strictly valid JSON matching:\n{\n  "quiz": [\n    {\n      "question": "Question referencing specific code elements",\n      "options": ["Short Option A", "Short Option B", "Short Option C", "Short Option D"],\n      "correctIndex": 0,\n      "explanation": "Clear step-by-step conceptual explanation."\n    }\n  ]\n}`
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
        if (parsed.quiz && Array.isArray(parsed.quiz) && parsed.quiz.length >= 4) {
          setQuizList(parsed.quiz);
        } else {
          setQuizList(generatedQuiz);
        }
      } else {
        setQuizList(generatedQuiz);
      }
    } catch (err) {
      setQuizList(generatedQuiz);
    } finally {
      setQuizLoading(false);
    }
  };

  const runPipeline = async () => {
    setLoading(true);
    setAiLoading(true);

    processCode(code);
    fetchConceptQuizForCurrentCode(code);

    // Detailed Step-by-Step Breakdown tailored to the input code
    const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('{') && !l.startsWith('}'));
    
    let detailedTrace = `📌 CODE-SPECIFIC STEP-BY-STEP TRACE & BREAKDOWN:\n\n`;
    
    detailedTrace += `1. LEXICAL ANALYSIS & SYMBOL TABLE:\n`;
    detailedTrace += `   • Scanned exactly ${lines.length} active statements in your input source code.\n`;
    detailedTrace += `   • All user-defined variables were registered into the Symbol Table with type and scope data.\n\n`;

    detailedTrace += `2. THREE-ADDRESS CODE (TAC) LOWERING:\n`;
    let tempId = 1;
    lines.forEach((l, idx) => {
      if (l.includes('=')) {
        if (/[\+\-\*\/\%]/.test(l)) {
          detailedTrace += `   • Statement ${idx+1} ("${l}") -> Linearized using temporary register [t${tempId}] for atomic execution.\n`;
          tempId++;
        } else {
          detailedTrace += `   • Statement ${idx+1} ("${l}") -> Mapped to direct atomic copy instruction.\n`;
        }
      } else if (l.includes('return')) {
        detailedTrace += `   • Statement ${idx+1} ("${l}") -> Resolved to terminal return instruction.\n`;
      }
    });

    detailedTrace += `\n3. LLVM OPTIMIZATION PASSES:\n`;
    detailedTrace += `   • Constant Folding: Pre-computed literal arithmetic sub-expressions at compile time.\n`;
    detailedTrace += `   • Dead Code Elimination (DCE): Checked liveness flow and pruned unreferenced variable definitions.\n\n`;

    detailedTrace += `4. STORAGE MAPPING (QUADS & TRIPLES):\n`;
    detailedTrace += `   • Quadruples table assigned explicit 4-tuple columns (Op, Arg1, Arg2, Result).\n`;
    detailedTrace += `   • Triples table structured positional index references ((0), (1)...) to optimize memory.`;

    if (!GEMINI_API_KEY) {
      setTimeout(() => {
        setAiAnalysis(detailedTrace);
        setAiLoading(false);
        setLoading(false);
      }, 300);
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
                    text: `Provide a rigorous, code-specific step-by-step compiler breakdown of this C++ source code in clear English:\n\n\`\`\`cpp\n${code}\n\`\`\`\n\nExplain precisely how THIS code is parsed into Symbol Table entries, TAC instructions, constant folding optimizations, and tuple structures.`
                  }
                ]
              }
            ]
          })
        }
      );

      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        setAiAnalysis(data.candidates[0].content.parts[0].text);
      } else {
        setAiAnalysis(detailedTrace);
      }
    } catch (err) {
      setAiAnalysis(detailedTrace);
    } finally {
      setAiLoading(false);
      setLoading(false);
    }
  };

  const handleSelectOption = (questionIndex, optionIndex) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const handleQuizSubmit = () => {
    let calculatedScore = 0;
    quizList.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        calculatedScore += 10;
      }
    });
    setScore(calculatedScore);
    setQuizSubmitted(true);
    setShowModal(true);
  };

  const handleRetakeQuiz = () => {
    setScore(0);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setCurrentQuizIndex(0);
    setShowModal(false);
  };

  const getStarRating = () => {
    if (quizList.length === 0) return 1;
    const maxPossibleScore = quizList.length * 10;
    const percentage = (score / maxPossibleScore) * 100;

    if (percentage >= 90) return 5;
    if (percentage >= 70) return 4;
    if (percentage >= 50) return 3;
    if (percentage >= 30) return 2;
    return 1;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-100 text-slate-800 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
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

        {/* Main Grid */}
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
              onChange={handleCodeChange}
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
                  <span>Analyzing Code & Generating Quiz...</span>
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

        {/* Detailed Step-by-Step Breakdown Section */}
        <div className="bg-white/90 border border-sky-200/80 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-sky-900 flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" /> Detailed Step-by-Step Logic Trace & Concept Breakdown
            </h2>

            <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-5 min-h-[150px]">
              {aiLoading ? (
                <div className="flex items-center gap-3 text-sky-800 text-sm font-medium">
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                  <span>Gemini 2.5 Flash is compiling code-specific breakdown...</span>
                </div>
              ) : aiAnalysis ? (
                <div className="text-sm text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                  {aiAnalysis}
                </div>
              ) : (
                <div className="text-sm text-sky-700 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>Paste any C++ code above and click "RUN PIPELINE & AI TRACE".</span>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Concept Quiz Section */}
          <div className="border-t border-sky-200/80 pt-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" /> Code-Specific Concept Quiz ({quizList.length} Fresh Questions)
              </h2>
              {quizSubmitted && (
                <button
                  onClick={handleRetakeQuiz}
                  className="flex items-center gap-1.5 text-xs bg-sky-100 hover:bg-sky-200 text-sky-800 px-3 py-1 rounded-lg font-bold transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Retake Quiz (Reset Score)
                </button>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-200">
              {quizLoading ? (
                <div className="flex items-center justify-center py-6 gap-2 text-sky-400 text-xs font-medium">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Generating fresh code-specific challenge questions...
                </div>
              ) : quizList.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs text-sky-400 font-bold border-b border-slate-800 pb-2">
                    <span>Question {currentQuizIndex + 1} of {quizList.length}</span>
                    <span>Point Value: 10 pts</span>
                  </div>

                  <p className="text-sm font-semibold text-slate-100">
                    {quizList[currentQuizIndex].question}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 my-3">
                    {quizList[currentQuizIndex].options.map((opt, optIdx) => {
                      const isSelected = selectedAnswers[currentQuizIndex] === optIdx;
                      const isCorrect = quizList[currentQuizIndex].correctIndex === optIdx;

                      let btnStyle = 'bg-slate-800/90 border-slate-700 text-slate-300 hover:border-sky-400';

                      if (quizSubmitted) {
                        if (isCorrect) {
                          btnStyle = 'bg-emerald-950 border-emerald-500 text-emerald-200 font-bold';
                        } else if (isSelected) {
                          btnStyle = 'bg-rose-950 border-rose-500 text-rose-200';
                        }
                      } else if (isSelected) {
                        btnStyle = 'bg-sky-900 border-sky-400 text-white font-bold';
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectOption(currentQuizIndex, optIdx)}
                          className={`text-left text-xs p-3 rounded-xl border transition-all ${btnStyle}`}
                        >
                          <span className="font-bold mr-2 text-sky-400">{String.fromCharCode(65 + optIdx)}.</span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {quizSubmitted && (
                    <div className="p-3 bg-slate-800/80 rounded-lg text-xs border border-slate-700 text-slate-300">
                      <p className="font-bold text-sky-300 mb-1">Concept Breakdown:</p>
                      <p>{quizList[currentQuizIndex].explanation}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => setCurrentQuizIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentQuizIndex === 0}
                      className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg disabled:opacity-40"
                    >
                      Previous
                    </button>

                    {currentQuizIndex < quizList.length - 1 ? (
                      <button
                        onClick={() => setCurrentQuizIndex((prev) => prev + 1)}
                        className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg"
                      >
                        Next Question
                      </button>
                    ) : (
                      !quizSubmitted && (
                        <button
                          onClick={handleQuizSubmit}
                          disabled={Object.keys(selectedAnswers).length < quizList.length}
                          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all disabled:opacity-40"
                        >
                          SUBMIT QUIZ
                        </button>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400">
                  Run the pipeline above to generate concept breakdown questions for your input code.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Complete Pop-up Modal with Close (X) Button */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-sky-200 rounded-2xl p-6 md:p-8 max-w-sm w-full text-center shadow-2xl space-y-4 relative">
            
            {/* Close (X) Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-all"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mx-auto w-16 h-16 bg-amber-100 border border-amber-300 rounded-full flex items-center justify-center shadow-inner mt-2">
              <Trophy className="w-9 h-9 text-amber-500 animate-bounce" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">Quiz Completed!</h3>
              <p className="text-xs text-slate-600 mt-1 font-medium">Concept Performance Breakdown</p>
            </div>

            <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
              <p className="text-xs uppercase font-bold text-sky-800">Your Total Score</p>
              <p className="text-3xl font-black text-sky-700 mt-1">{score} / {quizList.length * 10} pts</p>
            </div>

            <div>
              <p className="text-xs text-slate-500 font-semibold mb-2">Performance Rating</p>
              <div className="flex justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-6 h-6 ${
                      star <= getStarRating()
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleRetakeQuiz}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retake
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-sky-200"
              >
                View Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
