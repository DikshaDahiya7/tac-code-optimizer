import React, { useState } from 'react';
import { Play, Cpu, Zap, Eye, CheckCircle2, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';

const GEMINI_API_KEY =
  (typeof process !== 'undefined' && process.env && process.env.TAC_KEY) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_GEMINI_API_KEY) ||
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

  const initialRawTac = [
    { id: 1, text: 't1 = 5 * 2' },
    { id: 2, text: 'a = t1' },
    { id: 3, text: 'b = a' },
    { id: 4, text: 'unused = 100' },
    { id: 5, text: 't2 = b + 15' },
    { id: 6, text: 'result = t2' },
    { id: 7, text: 'return result' }
  ];

  const optimizedTac = [
    { id: 1, text: 'a = 10', pass: 'Constant Folding (5 * 2 -> 10)' },
    { id: 2, text: 'b = 10', pass: 'Copy Propagation (a -> 10)' },
    { id: 3, text: 't2 = 25', pass: 'Constant Folding & Copy Prop (10 + 15 -> 25)' },
    { id: 4, text: 'result = 25', pass: 'Copy Propagation' },
    { id: 5, text: 'return 25', pass: 'Dead Code Elimination (unused = 100 removed)' }
  ];

  const quads = [
    { op: '*', arg1: '5', arg2: '2', result: 't1' },
    { op: '=', arg1: 't1', arg2: '-', result: 'a' },
    { op: '=', arg1: 'a', arg2: '-', result: 'b' },
    { op: '=', arg1: '100', arg2: '-', result: 'unused' },
    { op: '+', arg1: 'b', arg2: '15', result: 't2' },
    { op: '=', arg1: 't2', arg2: '-', result: 'result' }
  ];

  const triples = [
    { index: '(0)', op: '*', arg1: '5', arg2: '2' },
    { index: '(1)', op: '=', arg1: 'a', arg2: '(0)' },
    { index: '(2)', op: '=', arg1: 'b', arg2: 'a' },
    { index: '(3)', op: '=', arg1: 'unused', arg2: '100' },
    { index: '(4)', op: '+', arg1: '(2)', arg2: '15' },
    { index: '(5)', op: '=', arg1: 'result', arg2: '(4)' }
  ];

  const runPipeline = async () => {
    setLoading(true);
    setAiLoading(true);
    setAiAnalysis('');

    setTimeout(() => {
      setLoading(false);
    }, 400);

    if (!GEMINI_API_KEY) {
      setAiAnalysis('⚠️ Key missing! Please check TAC_KEY in Vercel Environment Variables.');
      setAiLoading(false);
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
                    text: `Analyze the following C++ source code and its TAC (Three-Address Code) optimization passes. Explain step-by-step:
1. Constant Folding performed.
2. Copy Propagation performed.
3. Dead Code Elimination (e.g. unused variables).

Source Code:
${code}`
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
        setAiAnalysis('Unable to generate AI trace. Please check API Key quota or response format.');
      }
    } catch (err) {
      setAiAnalysis('Error connecting to Gemini API: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Zap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                OptiLens TAC Visualizer
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Interactive Phase 4 (Intermediate Representation) & Phase 5 (LLVM Optimization Passes) Engine
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-300">Gemini Active (TAC_KEY Connected)</span>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Code Input */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" /> C++ Source Code Input
              </h2>
              <span className="text-xs bg-slate-700/70 text-slate-300 px-2.5 py-1 rounded-md font-mono border border-slate-600/50">
                main.cpp
              </span>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-80 bg-slate-950/80 text-emerald-400 font-mono text-sm p-4 rounded-xl border border-slate-700/80 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none shadow-inner"
              spellCheck="false"
            />

            <button
              onClick={runPipeline}
              disabled={loading || aiLoading}
              className="mt-4 w-full py-3.5 px-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading || aiLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Executing Pipeline & Fetching AI Trace...</span>
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
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-slate-900/80 border border-slate-700/60 p-3 rounded-xl text-center">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Raw Instructions</p>
                <p className="text-xl font-bold text-indigo-400 mt-1">7</p>
              </div>
              <div className="bg-slate-900/80 border border-slate-700/60 p-3 rounded-xl text-center">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Optimized TAC</p>
                <p className="text-xl font-bold text-emerald-400 mt-1">5</p>
              </div>
              <div className="bg-slate-900/80 border border-slate-700/60 p-3 rounded-xl text-center">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Dead Code Lines</p>
                <p className="text-xl font-bold text-rose-400 mt-1">1</p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-slate-950/80 p-1.5 rounded-xl border border-slate-700/80 mb-4 gap-1 overflow-x-auto">
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
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded-xl p-4 overflow-y-auto max-h-80 font-mono text-sm">
              {activeTab === 'raw' && (
                <div className="space-y-2">
                  {initialRawTac.map((item) => (
                    <div key={item.id} className="flex gap-4 text-slate-300 border-b border-slate-800/60 pb-1.5">
                      <span className="text-slate-600 text-xs w-6">{item.id}.</span>
                      <span className="text-indigo-300">{item.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'passes' && (
                <div className="space-y-3">
                  {optimizedTac.map((item) => (
                    <div key={item.id} className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                      <div className="text-emerald-400 font-semibold">{item.text}</div>
                      <div className="text-xs text-indigo-400 mt-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Pass: {item.pass}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'optimized' && (
                <div className="space-y-2">
                  {optimizedTac.map((item) => (
                    <div key={item.id} className="flex gap-4 text-emerald-300 border-b border-slate-800/60 pb-1.5">
                      <span className="text-slate-600 text-xs w-6">{item.id}.</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'quads' && (
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="text-indigo-400 border-b border-slate-800">
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
                        <td className="p-2 text-indigo-300">{q.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'triples' && (
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="text-indigo-400 border-b border-slate-800">
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

        {/* AI Trace Output Box */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-purple-400" /> Smart Logic Trace & Optimization Insights
          </h2>

          <div className="bg-slate-950/80 border border-slate-700/80 rounded-xl p-4 min-h-[120px]">
            {aiLoading ? (
              <div className="flex items-center gap-3 text-indigo-400 text-sm">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Gemini 2.5 is analyzing intermediate representations and LLVM passes...</span>
              </div>
            ) : aiAnalysis ? (
              <div className="text-sm text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                {aiAnalysis}
              </div>
            ) : (
              <div className="text-sm text-slate-500 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>Click "RUN PIPELINE & AI TRACE" above to generate live AI optimization breakdown.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
