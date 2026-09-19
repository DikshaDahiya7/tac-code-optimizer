import React, { useState } from 'react';

// GOOGLE AI STUDIO SE COPIED AIzaSy... KEY YAHAN PASTE KARO
const HARDCODED_GEMINI_KEY = "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";

export default function OptilensCore() {
  const [inputCode, setInputCode] = useState(`int main() {
    int a = 10;
    int b = 20;
    int c = a + b;
    return c;
}`);
  const [activeTab, setActiveTab] = useState('raw');
  const [loading, setLoading] = useState(false);
  const [outputData, setOutputData] = useState(null);

  const runPipeline = async () => {
    if (!HARDCODED_GEMINI_KEY || HARDCODED_GEMINI_KEY === "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") {
      alert("Kripya valid AIzaSy... Gemini API Key paste karein!");
      return;
    }

    setLoading(true);
    try {
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

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${HARDCODED_GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error.message);
      }

      const responseText = result.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
      const parsedData = JSON.parse(responseText);
      setOutputData(parsedData);
    } catch (err) {
      console.error(err);
      alert("Error processing pipeline: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-5">
          <h1 className="text-2xl font-bold text-indigo-400">
            OptiLens TAC Visualizer
          </h1>
          <p className="text-xs text-slate-400">Compiler Design Phase 4 & 5: Intermediate Code & Optimization</p>
        </div>

        {/* Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Input Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-300">C++ Source Code</span>
              <button
                onClick={runPipeline}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {loading ? "Processing..." : "Run Pipeline"}
              </button>
            </div>

            <textarea
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="w-full h-80 bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-sm text-cyan-300 focus:outline-none resize-none"
            />
          </div>

          {/* Output Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex gap-2 border-b border-slate-800 pb-3">
              {['raw', 'passes', 'optimized', 'quads', 'triples'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="h-80 overflow-y-auto bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-sm">
              {!outputData ? (
                <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                  Click "Run Pipeline" to generate Intermediate Code.
                </div>
              ) : (
                <>
                  {activeTab === 'raw' && <pre className="text-emerald-400">{outputData.rawTac?.join('\n')}</pre>}
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
                  {activeTab === 'optimized' && <pre className="text-cyan-400">{outputData.optimizedTac?.join('\n')}</pre>}
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
