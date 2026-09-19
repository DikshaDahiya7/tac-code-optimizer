import React, { useState } from 'react';
import { Play, Code, Layers, FileCode, Cpu, CheckCircle2, Copy, Sparkles } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// APNI GEMINI API KEY YAHAN PASTE KARO
const HARDCODED_GEMINI_KEY = import.meta.env.AQ.Ab8RN6IvyJpgXGLIK0P7atdVmIDTTq4McTYpGMOExb9hU_P2vA;

export default function OptilensCore() {
  const [inputCode, setInputCode] = useState(`int main() {
    int a = 10;
    int b = 20;
    int c = a + b;
    int d = c * 0;
    return d;
}`);
  const [activeTab, setActiveTab] = useState('raw');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [outputData, setOutputData] = useState(null);

  const runPipeline = async () => {
    if (!HARDCODED_GEMINI_KEY || HARDCODED_GEMINI_KEY === "YOUR_GEMINI_API_KEY_HERE") {
      alert("Kripya code mein apni Gemini API Key paste karein!");
      return;
    }

    setLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(HARDCODED_GEMINI_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Analyze this C++ code for Intermediate Code Generation (Phase 4 & 5 of Compiler Design):
\`\`\`cpp
${inputCode}
\`\`\`

Provide JSON output with exact keys:
1. "rawTac": Array of string lines for unoptimized 3-Address Code.
2. "optimizationPasses": Array of objects { "passName": string, "description": string, "before": string, "after": string }.
3. "optimizedTac": Array of string lines for optimized 3-Address Code.
4. "quadruples": Array of objects { "op": string, "arg1": string, "arg2": string, "result": string }.
5. "triples": Array of objects { "index": string, "op": string, "arg1": string, "arg2": string }.

Return raw JSON only, no markdown formatting.`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().replace(/```json|```/g, '').trim();
      const parsedData = JSON.parse(responseText);
      setOutputData(parsedData);
    } catch (err) {
      console.error(err);
      alert("Error processing pipeline: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Cpu className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                OptiLens TAC Visualizer
              </h1>
              <p className="text-xs text-slate-400">Compiler Design Phase 4 & 5: Intermediate Code & Optimization</p>
            </div>
          </div>
        </div>

        {/* Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Input Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                <Code className="w-4 h-4 text-indigo-400" /> C++ Source Code
              </span>
              <button
                onClick={runPipeline}
                disabled={loading}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200 disabled:opacity-50"
              >
                {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                {loading ? "Processing..." : "Run Pipeline"}
              </button>
            </div>

            <textarea
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="w-full h-80 bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-sm text-cyan-300 focus:outline-none focus:border-indigo-500 resize-none shadow-inner"
              placeholder="// Enter C++ Code here..."
            />
          </div>

          {/* Output Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 overflow-x-auto">
              <div className="flex gap-2">
                {['raw', 'passes', 'optimized', 'quads', 'triples'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      activeTab === tab
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-80 overflow-y-auto bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-sm text-slate-300">
              {!outputData ? (
                <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                  Click "Run Pipeline" to generate Intermediate Code.
                </div>
              ) : (
                <>
                  {activeTab === 'raw' && (
                    <pre className="text-emerald-400">{outputData.rawTac?.join('\n')}</pre>
                  )}
                  {activeTab === 'passes' && (
                    <div className="space-y-3">
                      {outputData.optimizationPasses?.map((p, idx) => (
                        <div key={idx} className="bg-slate-900 p-3 rounded border border-slate-800 text-xs">
                          <div className="font-bold text-indigo-400">{p.passName}</div>
                          <div className="text-slate-400 mb-1">{p.description}</div>
                          <div className="text-red-400">Before: {p.before}</div>
                          <div className="text-green-400">After: {p.after}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeTab === 'optimized' && (
                    <pre className="text-cyan-400">{outputData.optimizedTac?.join('\n')}</pre>
                  )}
                  {activeTab === 'quads' && (
                    <div className="space-y-1 text-xs">
                      {outputData.quadruples?.map((q, i) => (
                        <div key={i} className="grid grid-cols-4 gap-2 border-b border-slate-800/50 py-1">
                          <span className="text-indigo-400">{q.op}</span>
                          <span>{q.arg1}</span>
                          <span>{q.arg2}</span>
                          <span className="text-amber-400">{q.result}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeTab === 'triples' && (
                    <div className="space-y-1 text-xs">
                      {outputData.triples?.map((t, i) => (
                        <div key={i} className="grid grid-cols-4 gap-2 border-b border-slate-800/50 py-1">
                          <span className="text-slate-500">({t.index})</span>
                          <span className="text-indigo-400">{t.op}</span>
                          <span>{t.arg1}</span>
                          <span>{t.arg2}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
