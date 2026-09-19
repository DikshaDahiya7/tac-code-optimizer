import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  Code2, 
  Zap, 
  Play, 
  Copy, 
  Check, 
  Sparkles, 
  Terminal, 
  CheckCircle2, 
  AlertCircle,
  Cpu
} from 'lucide-react';

const DEFAULT_CPP_CODE = `// C++ Input for Intermediate Code Generator
#include <iostream>
using namespace std;

int main() {
    int a = 10;
    int b = 20;
    int c = a + b * 5;
    
    if (c > 50) {
        c = c - 10;
    } else {
        c = c + 10;
    }
    
    return c;
}`;

export default function OptilensCore() {
  const [code, setCode] = useState(DEFAULT_CPP_CODE);
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('optimized');

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your Gemini API Key in the header.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      const prompt = `
You are an expert Compiler Design Optimization Engine.
Analyze the following C++ source code and perform Phase 4 (Intermediate Code Generation) and Phase 5 (Code Optimization).

Generate a strict JSON response with NO markdown formatting, NO extra text, and NO backticks. The JSON structure MUST be:
{
  "unoptimizedTac": ["string array of unoptimized TAC lines"],
  "optimizationPasses": [
    { "name": "Constant Folding & Propagation", "details": "Explanation..." },
    { "name": "Dead Code Elimination", "details": "Explanation..." },
    { "name": "Copy Propagation & Temp Variable Removal", "details": "Explanation..." }
  ],
  "optimizedTac": ["string array of optimized TAC lines"],
  "quadruples": [
    { "id": "0", "op": "string", "arg1": "string", "arg2": "string", "result": "string" }
  ],
  "triples": [
    { "id": "(0)", "op": "string", "arg1": "string", "arg2": "string" }
  ]
}

C++ Source Code:
${code}
`;

      const response = await model.generateContent(prompt);
      const parsedData = JSON.parse(response.response.text());
      setOutput(parsedData);
    } catch (err) {
      console.error(err);
      setError('Failed to generate intermediate code. Check your API key or C++ syntax.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(JSON.stringify(output, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row items-center justify-between border-b border-slate-800 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600/20 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Zap className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              OptiLens TAC Visualizer
            </h1>
            <p className="text-xs text-slate-400">Compiler Design Phase 4 & 5: Three Address Code, Quadruples & Optimization Passes</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl w-full md:w-auto">
          <input
            type="password"
            placeholder="Enter Gemini API Key..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="bg-transparent text-xs px-3 py-1.5 focus:outline-none text-slate-200 w-full md:w-64"
          />
        </div>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto mb-6 p-4 bg-rose-950/40 border border-rose-800/50 rounded-xl flex items-center gap-3 text-rose-300 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 flex flex-col bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span>C++ Source Code</span>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
            >
              {loading ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              {loading ? 'Analyzing...' : 'Run Pipeline'}
            </button>
          </div>
          <div className="p-4 flex-1">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste C++ source code..."
              className="w-full h-[480px] bg-slate-950 text-slate-200 font-mono text-xs p-4 rounded-xl border border-slate-800/80 focus:outline-none focus:border-emerald-500/50 resize-none transition"
              spellCheck="false"
            />
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 overflow-x-auto">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('unoptimized')}
                className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                  activeTab === 'unoptimized'
                    ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Raw TAC
              </button>
              <button
                onClick={() => setActiveTab('passes')}
                className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                  activeTab === 'passes'
                    ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Optimization Passes
              </button>
              <button
                onClick={() => setActiveTab('optimized')}
                className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                  activeTab === 'optimized'
                    ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Optimized TAC
              </button>
              <button
                onClick={() => setActiveTab('quad')}
                className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                  activeTab === 'quad'
                    ? 'bg-cyan-600/30 border-cyan-500 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Quadruples
              </button>
              <button
                onClick={() => setActiveTab('triple')}
                className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                  activeTab === 'triple'
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Triples
              </button>
            </div>

            <button
              onClick={handleCopy}
              disabled={!output}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800 border border-slate-700 disabled:opacity-40"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto max-h-[480px]">
            {!output && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 py-20">
                <Terminal className="w-10 h-10 stroke-1" />
                <p className="text-xs">Click "Run Pipeline" to generate Intermediate Code & Optimization Passes</p>
              </div>
            )}

            {output && activeTab === 'unoptimized' && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs space-y-1.5 text-amber-300">
                {output.unoptimizedTac.map((line, idx) => (
                  <div key={idx} className="flex gap-3">
                    <span className="text-slate-600 select-none w-6 text-right">{idx + 1}.</span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            )}

            {output && activeTab === 'passes' && (
              <div className="space-y-3 text-xs">
                {output.optimizationPasses.map((pass, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-purple-400 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{pass.name}</span>
                    </div>
                    <p className="text-slate-400 pl-6 leading-relaxed">{pass.details}</p>
                  </div>
                ))}
              </div>
            )}

            {output && activeTab === 'optimized' && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs space-y-1.5 text-emerald-300">
                {output.optimizedTac.map((line, idx) => (
                  <div key={idx} className="flex gap-3">
                    <span className="text-slate-600 select-none w-6 text-right">{idx + 1}.</span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            )}

            {output && activeTab === 'quad' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Op</th>
                      <th className="py-2.5 px-3">Arg1</th>
                      <th className="py-2.5 px-3">Arg2</th>
                      <th className="py-2.5 px-3">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {output.quadruples.map((q, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition">
                        <td className="py-2 px-3 text-slate-500">{q.id}</td>
                        <td className="py-2 px-3 text-cyan-400 font-bold">{q.op}</td>
                        <td className="py-2 px-3 text-slate-300">{q.arg1}</td>
                        <td className="py-2 px-3 text-slate-300">{q.arg2}</td>
                        <td className="py-2 px-3 text-emerald-300 font-bold">{q.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {output && activeTab === 'triple' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Pointer</th>
                      <th className="py-2.5 px-3">Op</th>
                      <th className="py-2.5 px-3">Arg1</th>
                      <th className="py-2.5 px-3">Arg2</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {output.triples.map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition">
                        <td className="py-2 px-3 text-indigo-400 font-bold">{t.id}</td>
                        <td className="py-2 px-3 text-cyan-400 font-bold">{t.op}</td>
                        <td className="py-2 px-3 text-slate-300">{t.arg1}</td>
                        <td className="py-2 px-3 text-slate-300">{t.arg2}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto mt-8 bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span><strong>Compiler Design Architecture:</strong> Phase 4 & 5 Pipeline</span>
        </div>
      </footer>
    </div>
  );
}