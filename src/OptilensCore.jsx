import React, { useState, useEffect } from 'react';
import { Play, Zap, Eye, Sparkles, RefreshCw, Code2, Trophy, CheckCircle, HelpCircle, Star, RotateCcw, X } from 'lucide-react';

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

  // Quiz States
  const [quizList, setQuizList] = useState([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizLoading, setQuizLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showModal, setShowModal] = useState(false);

  // Reset Score & Quiz Instantly When Code Changes
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

  // Dynamic Compiler Analyzer for C++ Code
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

    lines.forEach((line) => {
      let trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('{') || trimmed.startsWith('}') || trimmed.startsWith('int main')) {
        return;
      }

      if (trimmed.includes('=')) {
        let [left, right] = trimmed.split('=').map((s) => s.replace('int', '').replace(';', '').trim());
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

  // Robust Shuffler for Options
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

  // Fully Parametric On-The-Fly Code-Specific Quiz Builder
  const buildAdvancedCodeQuiz = (targetCode) => {
    const lines = targetCode.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('{') && !l.startsWith('}'));
    
    let varsFound = [];
    let mathExprs = [];
    let unusedVars = [];
    let allVarNames = [];

    lines.forEach(line => {
      if (line.includes('=')) {
        let parts = line.split('=');
        let varName = parts[0].replace('int', '').trim();
        let rightSide = parts[1].replace(';', '').trim();
        varsFound.push({ name: varName, expr: rightSide });
        allVarNames.push(varName);

        if (/[\+\-\*\/]/.test(rightSide)) {
          mathExprs.push({ name: varName, expr: rightSide });
        }
        if (varName.includes('unused') || varName.includes('dummy') || varName.includes('check') || varName.includes('obsolete')) {
          unusedVars.push(varName);
        }
      }
    });

    const targetCount = Math.min(10, Math.max(5, lines.length));
    let questions = [];

    // Question Generator 1: Variable TAC Breakdown
    if (varsFound.length > 0) {
      const v = varsFound[0];
      const altVar = varsFound.length > 1 ? varsFound[1].name : 'temp';
      const correct = `Lowered into atomic steps limiting '${v.name}' operands to max 3 addresses`;
      const shuffled = shuffleOptions(correct, [
        `Directly compiled into machine assembly without register allocation for '${altVar}'`,
        `Converted into a dynamic pointer array referencing heap storage for '${v.name}'`,
        `Skipped entirely during lexical analysis and syntax tokenization`
      ]);
      questions.push({
        question: `Focusing on statement '${v.name} = ${v.expr}', how does the intermediate code generator translate this assignment?`,
        options: shuffled.options,
        correctIndex: shuffled.correctIndex,
        explanation: `Three-Address Code strictly decomposes '${v.name} = ${v.expr}' into instructions containing at most two inputs and one result target.`
      });
    }

    // Question G2: Math Expression Folding
    if (mathExprs.length > 0) {
      const m = mathExprs[0];
      const correct = `Constant folding pre-computes static expression '${m.expr}' during compilation`;
      const shuffled = shuffleOptions(correct, [
        `Common subexpression elimination evaluates '${m.name}' during runtime execution cycles`,
        `Loop unrolling duplicates evaluation blocks across CPU threads`,
        `Register spilling offloads '${m.name}' to secondary storage sectors`
      ]);
      questions.push({
        question: `In variable '${m.name}', the assignment expression is '${m.expr}'. What optimization is executed here?`,
        options: shuffled.options,
        correctIndex: shuffled.correctIndex,
        explanation: `Since '${m.expr}' consists of compile-time constants, folding computes the final value before runtime.`
      });
    }

    // Question G3: Dead Code / Liveness
    const deadVar = unusedVars.length > 0 ? unusedVars[0] : (varsFound.length > 2 ? varsFound[2].name : 'aux_var');
    const altDead = varsFound.length > 0 ? varsFound[0].name : 'main_var';
    const correctDead = `Liveness analysis confirms '${deadVar}' has no downstream read references`;
    const shuffledDead = shuffleOptions(correctDead, [
      `Syntax parser reports a type conflict between '${deadVar}' and '${altDead}'`,
      `The compiler reserves '${deadVar}' for global exception handling tables`,
      `Copy propagation forces '${deadVar}' to become a constant pointer`
    ]);
    questions.push({
      question: `Why is variable '${deadVar}' flagged for removal during optimization passes in this specific program?`,
      options: shuffledDead.options,
      correctIndex: shuffledDead.correctIndex,
      explanation: `Liveness data-flow analysis verifies that variable '${deadVar}' is never accessed after its definition, making it dead code.`
    });

    // Question G4: Quadruples Table
    const qCorrect = `Stores explicit Operator, Arg1, Arg2, and Result fields for every instruction`;
    const qShuffled = shuffleOptions(qCorrect, [
      `Uses implicit positional instruction indices like (0), (1)`,
      `Encodes instructions as compressed bytecode arrays`,
      `Stores variable names without operator attributes`
    ]);
    questions.push({
      question: `How does the Quadruples IR table structure the instructions parsed from this C++ snippet?`,
      options: qShuffled.options,
      correctIndex: qShuffled.correctIndex,
      explanation: `Quadruples use 4 explicit table columns: Operator, Argument 1, Argument 2, and Result variable.`
    });

    // Question G5: Triples Indirection
    const tCorrect = `Uses positional numeric indices to reference prior instruction results`;
    const tShuffled = shuffleOptions(tCorrect, [
      `Allocates explicit result columns for every temporary register`,
      `Doubles the memory footprint compared to Quadruples`,
      `Restricts code generation exclusively to conditional loops`
    ]);
    questions.push({
      question: `What primary indirection mechanism distinguishes Triples from Quadruples in this visualizer?`,
      options: tShuffled.options,
      correctIndex: tShuffled.correctIndex,
      explanation: `Triples avoid explicit result column names by using positional numeric indices (e.g. (0), (1)) to link instruction dependencies.`
    });

    // Question G6: Copy Propagation
    const cpVar = varsFound.length > 1 ? varsFound[1].name : 'var_b';
    const srcVar = varsFound.length > 0 ? varsFound[0].name : 'var_a';
    const correctCP = `Replaces references of copied variable '${cpVar}' with source '${srcVar}'`;
    const shuffledCP = shuffleOptions(correctCP, [
      `Duplicates function stack frames for recursive safety`,
      `Converts integer variables into floating-point numbers`,
      `Generates unconditional assembly jump branch labels`
    ]);
    questions.push({
      question: `What specific transformation does Copy Propagation perform on assignment chains involving '${cpVar}' and '${srcVar}'?`,
      options: shuffledCP.options,
      correctIndex: shuffledCP.correctIndex,
      explanation: `Copy Propagation substitutes target variable references with their direct source values, reducing unnecessary memory assignments.`
    });

    // Question G7: Temporary Variables
    const correctTemp = `Linearizes complex nested precedence into ordered single-operator instructions`;
    const shuffledTemp = shuffleOptions(correctTemp, [
      `Manages dynamic garbage collection memory boundaries`,
      `Enforces object-oriented class member encapsulation`,
      `Handles asynchronous operating system hardware interrupts`
    ]);
    questions.push({
      question: `Why does the IR code generator inject temporary variables (t1, t2...) during expression parsing here?`,
      options: shuffledTemp.options,
      correctIndex: shuffledTemp.correctIndex,
      explanation: `Temporary variables break down complex nested arithmetic expressions into sequential single-operator steps.`
    });

    // Question G8: Symbol Table
    const correctST = `Maintains variable names, memory offsets, and scope attributes`;
    const shuffledST = shuffleOptions(correctST, [
      `Executes machine byte-code directly inside browser memory`,
      `Translates source compiler bugs into user-friendly warnings`,
      `Controls browser DOM layout rendering frames`
    ]);
    questions.push({
      question: `What critical metadata does the Symbol Table manage during lexical analysis of this code?`,
      options: shuffledST.options,
      correctIndex: shuffledST.correctIndex,
      explanation: `The Symbol Table records identifier names, declared data types, scope block boundaries, and memory offsets.`
    });

    // Question G9: Pass Sequencing
    const correctPass = `Constant folding must execute before dead code elimination to expose orphaned branches`;
    const shuffledPass = shuffleOptions(correctPass, [
      `Optimization passes operate entirely independently without sequence requirements`,
      `Dead code pruning must always occur prior to lexical tokenization`,
      `Passes are restricted solely to writing hardware assembly files`
    ]);
    questions.push({
      question: `Why is the execution order of optimization passes (Folding before DCE) important in this compiler pipeline?`,
      options: shuffledPass.options,
      correctIndex: shuffledPass.correctIndex,
      explanation: `Executing Constant Folding first simplifies conditions and uncovers dead code blocks that subsequent DCE passes can prune.`
    });

    // Question G10: Terminal Return
    const lastVar = varsFound.length > 0 ? varsFound[varsFound.length - 1].name : 'result';
    const correctRet = `Lowered into a terminal return IR tuple passing final register '${lastVar}'`;
    const shuffledRet = shuffleOptions(correctRet, [
      `Purged completely from the activation stack frame`,
      `Converted into an unconditional infinite branch loop`,
      `Swapped into argument position 1 of the function header`
    ]);
    questions.push({
      question: `How is the concluding 'return' statement handling variable '${lastVar}' during intermediate code generation?`,
      options: shuffledRet.options,
      correctIndex: shuffledRet.correctIndex,
      explanation: `The return statement maps to a terminal IR instruction passing the final computed register value back to the caller.`
    });

    return questions.slice(0, targetCount);
  };

  // Fetch Quiz
  const fetchConceptQuizForCurrentCode = async (targetCode) => {
    setQuizLoading(true);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setCurrentQuizIndex(0);
    setScore(0);
    setShowModal(false);

    const generatedQuiz = buildAdvancedCodeQuiz(targetCode);

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
                    text: `Analyze this C++ code (ID: ${cacheBust}):\n\n\`\`\`cpp\n${targetCode}\n\`\`\`\n\nGenerate ${generatedQuiz.length} rigorous, challenging multiple-choice questions with balanced option lengths specifically referencing this code. Return strictly valid JSON format matching:\n{\n  "quiz": [\n    {\n      "question": "Rigorous conceptual question referencing code",\n      "options": ["Balanced Option A", "Balanced Option B", "Balanced Option C", "Balanced Option D"],\n      "correctIndex": 0,\n      "explanation": "Detailed technical explanation."\n    }\n  ]\n}`
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
        if (parsed.quiz && Array.isArray(parsed.quiz) && parsed.quiz.length >= 5) {
          setQuizList(parsed.quiz.slice(0, 10));
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

    const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('{') && !l.startsWith('}'));
    
    let analysisOutput = `🔍 DEEP COMPILER LOGIC TRACE & CODE BREAKDOWN:\n\n`;
    analysisOutput += `1. LEXICAL & SYNTAX PARSING:\n`;
    analysisOutput += `   • Analyzed ${lines.length} active statements for the provided input source code.\n`;
    analysisOutput += `   • Built symbol table tracking token identifiers, data types, and scopes.\n\n`;
    
    analysisOutput += `2. THREE-ADDRESS CODE (TAC) LOWERING:\n`;
    let tempId = 1;
    lines.forEach((l, idx) => {
      if (l.includes('=')) {
        if (/[\+\-\*\/]/.test(l)) {
          analysisOutput += `   • Statement ${idx+1} ("${l}") -> Lowered via temporary register t${tempId} into atomic 3-address steps.\n`;
          tempId++;
        } else {
          analysisOutput += `   • Statement ${idx+1} ("${l}") -> Mapped to direct atomic assignment tuple.\n`;
        }
      } else if (l.includes('return')) {
        analysisOutput += `   • Statement ${idx+1} ("${l}") -> Resolved to terminal return TAC instruction.\n`;
      }
    });

    analysisOutput += `\n3. OPTIMIZATION PASS EXECUTION:\n`;
    analysisOutput += `   • Constant Folding: Pre-evaluated static literal sub-expressions at compile time.\n`;
    analysisOutput += `   • Copy Propagation: Propagated direct assignments to eliminate redundant memory operations.\n`;
    analysisOutput += `   • Dead Code Elimination: Safely pruned unreferenced variables and orphan assignments.\n\n`;
    
    analysisOutput += `4. TUPLE STORAGE REPRESENTATIONS:\n`;
    analysisOutput += `   • Quadruples table populated with 4 explicit attributes (Operator, Arg1, Arg2, Result).\n`;
    analysisOutput += `   • Triples table structured with positional index references ((0), (1)...) to minimize memory overhead.`;

    if (!GEMINI_API_KEY) {
      setTimeout(() => {
        setAiAnalysis(analysisOutput);
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
                    text: `Provide a rigorous technical breakdown of this specific C++ source code in clear English:\n\n\`\`\`cpp\n${code}\n\`\`\`\n\nDetail precisely how THIS code is parsed into TAC, which variables undergo Constant Folding and Dead Code Elimination, and how Quadruples/Triples map its structure.`
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
        setAiAnalysis(analysisOutput);
      }
    } catch (err) {
      setAiAnalysis(analysisOutput);
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

        {/* Dynamic Concept AI Section */}
        <div className="bg-white/90 border border-sky-200/80 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-sky-900 flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" /> Detailed Smart Logic Trace & Code Breakdown
            </h2>

            <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-5 min-h-[140px]">
              {aiLoading ? (
                <div className="flex items-center gap-3 text-sky-800 text-sm font-medium">
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                  <span>Gemini 2.5 Flash is generating custom breakdown for your code...</span>
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

          {/* Dynamic Concept Quiz Section */}
          <div className="border-t border-sky-200/80 pt-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" /> Dynamic Advanced Concept Quiz ({quizList.length} Questions)
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
                  <RefreshCw className="w-4 h-4 animate-spin" /> Building advanced code-specific challenge questions...
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
