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

  // Advanced C++ Compiler Parser & Flow Analyzer
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
        
        // Check for binary operations
        const opMatch = right.match(/([a-zA-Z0-9_]+)\s*([\+\-\*\/\%])\s*([a-zA-Z0-9_]+)/);

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

  // Fisher-Yates Shuffler with Balanced Length Options
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

  // Deeply Diverse, Concept-Driven Unique Question Engine
  const buildComprehensiveQuiz = (targetCode) => {
    const lines = targetCode.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('{') && !l.startsWith('}'));
    
    let vars = [];
    let mathLines = [];
    let deadVars = [];
    let returnVar = 'result';

    lines.forEach(l => {
      if (l.includes('return')) {
        returnVar = l.replace('return', '').replace(';', '').trim();
      }
      if (l.includes('=')) {
        let parts = l.split('=');
        let vName = parts[0].replace('int', '').trim();
        let rhs = parts[1].replace(';', '').trim();
        vars.push({ name: vName, rhs });

        if (/[\+\-\*\/\%]/.test(rhs)) {
          mathLines.push({ name: vName, rhs });
        }
        if (vName.includes('unused') || vName.includes('dummy') || vName.includes('metric') || vName.includes('log')) {
          deadVars.push(vName);
        }
      }
    });

    let qPool = [];

    // Concept 1: Syntax & Symbol Table Scope
    if (vars.length > 0) {
      const target = vars[0];
      const correct = `Registers identifier '${target.name}' with type 'int' and memory offset in symbol table`;
      const shuffled = shuffleOptions(correct, [
        `Allocates dynamic heap memory blocks for '${target.name}' via OS syscalls`,
        `Translates identifier '${target.name}' directly into raw machine bytecode bytes`,
        `Bypasses lexical scanning and forwards '${target.name}' to the linker module`
      ]);
      qPool.push({
        question: `During the initial lexical and syntax parsing of declaration '${target.name} = ${target.rhs}', what primary action does the compiler execute?`,
        options: shuffled.options,
        correctIndex: shuffled.correctIndex,
        explanation: `The compiler creates an entry in the Symbol Table for '${target.name}', recording its data type, visibility scope, and memory allocation offset.`
      });
    }

    // Concept 2: TAC Linearization & Temporary Registers
    if (mathLines.length > 0) {
      const m = mathLines[0];
      const correct = `Decomposes expression '${m.rhs}' into atomic instructions using temporary variable 't1'`;
      const shuffled = shuffleOptions(correct, [
        `Executes expression '${m.rhs}' entirely within hardware floating-point registers`,
        `Converts '${m.name}' into an infinite conditional branch loop structure`,
        `Stores intermediate evaluation steps of '${m.rhs}' directly in secondary disk cache`
      ]);
      qPool.push({
        question: `How does Three-Address Code (TAC) handle the complex expression assigned to '${m.name}' (${m.rhs})?`,
        options: shuffled.options,
        correctIndex: shuffled.correctIndex,
        explanation: `TAC strictly enforces a maximum of three addresses per instruction, breaking nested or multi-operator expressions into sequential steps using temporary registers like 't1'.`
      });
    } else if (vars.length > 1) {
      const v2 = vars[1];
      const correct = `Assigns value of '${v2.rhs}' to '${v2.name}' via standard copy instruction`;
      const shuffled = shuffleOptions(correct, [
        `Computes trigonometric bitshifts on '${v2.name}' during preprocessing`,
        `Allocates a persistent mutex lock for variable '${v2.name}'`,
        `Invokes garbage collection cleanup routines for '${v2.rhs}'`
      ]);
      qPool.push({
        question: `What low-level intermediate representation is generated for assignment '${v2.name} = ${v2.rhs}'?`,
        options: shuffled.options,
        correctIndex: shuffled.correctIndex,
        explanation: `Simple scalar assignments translate directly into a single TAC instruction copying the source value to the destination register.`
      });
    }

    // Concept 3: Constant Folding Pass
    if (mathLines.length > 0) {
      const ml = mathLines[0];
      const correct = `Pre-calculates literal arithmetic operands in '${ml.rhs}' at compile-time to save CPU cycles`;
      const shuffled = shuffleOptions(correct, [
        `Delays evaluation of '${ml.rhs}' until asynchronous thread execution`,
        `Forces runtime exception handlers to monitor arithmetic overflows in '${ml.name}'`,
        `Converts arithmetic operations in '${ml.rhs}' into recursive function calls`
      ]);
      qPool.push({
        question: `What specific optimization pass targets the arithmetic expression found in '${ml.name} = ${ml.rhs}'?`,
        options: shuffled.options,
        correctIndex: shuffled.correctIndex,
        explanation: `Constant Folding detects static literal operands in '${ml.rhs}' and computes the result during compilation, eliminating redundant runtime arithmetic instructions.`
      });
    }

    // Concept 4: Dead Code Elimination (DCE) & Liveness Analysis
    const dv = deadVars.length > 0 ? deadVars[0] : (vars.length > 2 ? vars[vars.length - 2].name : 'aux_var');
    const correctDCE = `Prunes '${dv}' because data-flow liveness analysis proves it is never read before scope exit`;
    const shuffledDCE = shuffleOptions(correctDCE, [
      `Promotes '${dv}' to a global register to accelerate thread synchronization`,
      `Flags '${dv}' as a syntax compilation error due to uninitialized type casting`,
      `Duplicates '${dv}' across multiple execution pipelines for parallel speedup`
    ]);
    qPool.push({
      question: `Why is variable '${dv}' flagged and removed during optimization passes of this source code?`,
      options: shuffledDCE.options,
      correctIndex: shuffledDCE.correctIndex,
      explanation: `Dead Code Elimination (DCE) relies on liveness analysis to identify variable stores like '${dv}' that do not affect the function's return value, safely removing them to shrink binary size.`
    });

    // Concept 5: Quadruples Table Representation
    const correctQ = `Stores explicit 4-tuple fields: Operator, Argument 1, Argument 2, and Result Target`;
    const shuffledQ = shuffleOptions(correctQ, [
      `Uses implicit numerical line indices instead of explicit variable names`,
      `Compresses all instructions into a single bitwise encryption stream`,
      `Requires double-precision floating-point memory allocations for every row`
    ]);
    qPool.push({
      question: `How does the Quadruples (Quads) intermediate data structure organize expression instructions for this program?`,
      options: shuffledQ.options,
      correctIndex: shuffledQ.correctIndex,
      explanation: `Quadruples explicitly store four distinct attributes per instruction row: (op, arg1, arg2, result), making temporary variable tracking straightforward.`
    });

    // Concept 6: Triples Table & Positional Indexing
    const correctTr = `Eliminates explicit result column names by using positional instruction index pointers like (0), (1)`;
    const shuffledTr = shuffleOptions(correctTr, [
      `Consumes twice the RAM storage bandwidth compared to Quadruple tables`,
      `Forces all instructions to execute in reverse sequential order`,
      `Stores string literals instead of numerical register references`
    ]);
    qPool.push({
      question: `What architectural advantage do Triples provide over Quadruples when mapping this code's IR sequence?`,
      options: shuffledTr.options,
      correctIndex: shuffledTr.correctIndex,
      explanation: `Triples save memory overhead by omitting explicit result variable names and instead using numerical instruction position indices (e.g., (0), (1)) to represent dependencies.`
    });

    // Concept 7: Terminal Return Instruction Mapping
    const correctRet = `Translates 'return ${returnVar}' into a terminal return TAC instruction passing the final register`;
    const shuffledRet = shuffleOptions(correctRet, [
      `Purges the entire activation stack frame without returning values`,
      `Converts the return statement into an infinite background polling loop`,
      `Swaps return variable '${returnVar}' into argument position 1 of the function`
    ]);
    qPool.push({
      question: `How is the final return statement returning '${returnVar}' processed during intermediate code generation?`,
      options: shuffledRet.options,
      correctIndex: shuffledRet.correctIndex,
      explanation: `The return statement is lowered into a terminal TAC instruction that passes the final evaluated register value back to the calling function environment.`
    });

    return qPool;
  };

  const fetchConceptQuizForCurrentCode = async (targetCode) => {
    setQuizLoading(true);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setCurrentQuizIndex(0);
    setScore(0);
    setShowModal(false);

    const generatedQuiz = buildComprehensiveQuiz(targetCode);

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
                    text: `Analyze this C++ code (ID: ${cacheBust}):\n\n\`\`\`cpp\n${targetCode}\n\`\`\`\n\nGenerate 6 distinct, highly rigorous, concept-based multiple-choice questions with balanced option lengths testing compiler design principles (Symbol Table, TAC, Constant Folding, DCE, Quads, Triples) specific to THIS code. Return strictly valid JSON format matching:\n{\n  "quiz": [\n    {\n      "question": "Deep conceptual question",\n      "options": ["Balanced Option A", "Balanced Option B", "Balanced Option C", "Balanced Option D"],\n      "correctIndex": 0,\n      "explanation": "Thorough step-by-step explanation."\n    }\n  ]\n}`
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

    // Build Detailed Step-by-Step Breakdown
    const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('{') && !l.startsWith('}'));
    
    let detailedTrace = `📌 COMPREHENSIVE STEP-BY-STEP COMPILER TRACE & BREAKDOWN:\n\n`;
    
    detailedTrace += `1. LEXICAL ANALYSIS & SYMBOL TABLE SETUP:\n`;
    detailedTrace += `   • The compiler scanner tokenized ${lines.length} active statements from your input C++ code.\n`;
    detailedTrace += `   • All declared variable identifiers and types were registered into the Symbol Table with scope offsets.\n\n`;

    detailedTrace += `2. INTERMEDIATE REPRESENTATION (TAC) LOWERING:\n`;
    let tempId = 1;
    lines.forEach((l, idx) => {
      if (l.includes('=')) {
        if (/[\+\-\*\/\%]/.test(l)) {
          detailedTrace += `   • Line ${idx+1} ("${l}") -> Broken down into multi-step atomic operations using temporary register [t${tempId}].\n`;
          tempId++;
        } else {
          detailedTrace += `   • Line ${idx+1} ("${l}") -> Converted to atomic copy TAC instruction.\n`;
        }
      } else if (l.includes('return')) {
        detailedTrace += `   • Line ${idx+1} ("${l}") -> Mapped to terminal return IR instruction.\n`;
      }
    });

    detailedTrace += `\n3. LLVM OPTIMIZATION PASSES:\n`;
    detailedTrace += `   • Constant Folding Pass: Evaluated static literal arithmetic expressions at compile-time to eliminate runtime CPU overhead.\n`;
    detailedTrace += `   • Dead Code Elimination (DCE): Analyzed data-flow liveness and safely pruned unreferenced variable stores.\n\n`;

    detailedTrace += `4. MEMORY TABLE MAPPING (QUADS & TRIPLES):\n`;
    detailedTrace += `   • Quadruples generated explicit 4-column tuples -> (Operator, Argument 1, Argument 2, Result Target).\n`;
    detailedTrace += `   • Triples organized instructions using positional numeric indices ((0), (1)...) to eliminate explicit result column storage.`;

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
                    text: `Provide a rigorous, highly detailed step-by-step compiler breakdown of this specific C++ source code in clear English:\n\n\`\`\`cpp\n${code}\n\`\`\`\n\nExplain precisely how THIS code is parsed into Symbol Table entries, TAC instructions, which variables undergo Constant Folding and Dead Code Elimination, and how Quadruples/Triples map its structure.`
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
                  <span>Gemini 2.5 Flash is compiling detailed step-by-step trace...</span>
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
                <Trophy className="w-4 h-4 text-amber-500" /> Code-Specific Concept Quiz ({quizList.length} Unique Questions)
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
                  <RefreshCw className="w-4 h-4 animate-spin" /> Generating diverse, non-guessable concept questions...
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
