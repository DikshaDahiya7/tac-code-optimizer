import React, { useState, useEffect } from 'react';
import { Play, Zap, Eye, Sparkles, RefreshCw, Code2, Trophy, CheckCircle, HelpCircle, Star, RotateCcw } from 'lucide-react';

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

  // 🎮 Quiz States
  const [quizList, setQuizList] = useState([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizLoading, setQuizLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showModal, setShowModal] = useState(false);

  // Handle Input Code Change: Reset Score & Quiz
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

  // Concept & TAC Breakdown Based Quiz Generation
  const fetchConceptQuizForCurrentCode = async (inputCode) => {
    setQuizLoading(true);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setCurrentQuizIndex(0);
    setScore(0);
    setShowModal(false);

    const fallbackQuizList = [
      {
        question: "What specific optimization pass resolves arithmetic expressions with literal values (e.g., 5 * 2) in this code?",
        options: ["Dead Code Elimination", "Constant Folding", "Loop Invariant Code Motion", "Register Allocation"],
        correctIndex: 1,
        explanation: "Constant Folding evaluates constant expressions at compile time rather than execution time."
      },
      {
        question: "Why is the variable 'unused' eliminated during the optimization pass of this code?",
        options: ["Syntax Error", "Dead Code Elimination (Variable is never read/referenced)", "Type Mismatch", "Out of Scope"],
        correctIndex: 1,
        explanation: "Dead Code Elimination removes statements and variables that do not affect the output program state."
      },
      {
        question: "How does the raw Three-Address Code (TAC) handle complex binary operations?",
        options: ["Combines all operations into a single instruction", "Introduces temporary variables (e.g., t1, t2) to limit operands to at most 3", "Converts everything to assembly directly", "Deletes variables"],
        correctIndex: 1,
        explanation: "TAC breaks down complex assignments into operations with at most 3 memory addresses using temporary variables."
      },
      {
        question: "What is the primary role of Copy Propagation in Intermediate Representation?",
        options: ["Replaces occurrences of targets with their assigned values to eliminate unnecessary assignments", "Duplicates instructions for speed", "Converts floats to integers", "Removes return statements"],
        correctIndex: 0,
        explanation: "Copy Propagation replaces variables with their direct assigned values (e.g., b = a) to simplify instructions."
      },
      {
        question: "What distinguishes a Quadruple IR representation from a Triple IR representation?",
        options: ["Quadruples explicitly store the result field, whereas Triples implicitly reference instruction positions", "Triples take more memory", "Quadruples are only used for loops", "There is no difference"],
        correctIndex: 0,
        explanation: "Quadruples store (op, arg1, arg2, result). Triples avoid storing the result explicitly by using instruction indices."
      }
    ];

    if (!GEMINI_API_KEY) {
      setTimeout(() => {
        setQuizList(fallbackQuizList);
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
                    text: `Analyze this C++ source code and its TAC / IR breakdown:\n\n${inputCode}\n\nGenerate conceptual multiple-choice quiz questions specifically tailored to test and clarify how this exact code is processed into Three-Address Code (TAC), Quadruples/Triples, and optimized (Constant Folding, Dead Code, Copy Propagation).\n\nCRITICAL INSTRUCTIONS:\n1. Generate ONLY meaningful questions that directly test concept clarity and TAC breakdown steps for this code.\n2. Do NOT count string lengths or code lines to decide questions. Instead, create 1 question for each distinct concept/operation present in the code TAC breakdown (Minimum 5 questions, Maximum 10 questions).\n3. All questions and explanations MUST BE IN ENGLISH ONLY.\n4. Return ONLY valid JSON matching this format:\n{\n  "quiz": [\n    {\n      "question": "English question testing TAC breakdown/concept",\n      "options": ["Option A", "Option B", "Option C", "Option D"],\n      "correctIndex": 0,\n      "explanation": "Clear explanation of the concept."\n    }\n  ]\n}`
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
        const cleanedText = rawText.replace(/```json/g, '').replace(/
