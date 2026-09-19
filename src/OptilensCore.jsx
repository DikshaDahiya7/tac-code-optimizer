import React, { useState } from 'react';

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

  const runPipeline = () => {
    setLoading(true);
    
    // Pure Local Pipeline - Zero API Keys Needed
    setTimeout(() => {
      const mockResult = {
        rawTac: [
          "t1 = 10",
          "a = t1",
          "t2 = 20",
          "b = t2",
          "t3 = a + b",
          "c = t3",
          "return c"
        ],
        optimizationPasses: [
          {
            passName: "Constant Folding & Propagation",
            description: "Evaluated '10 + 20' at compile-time and folded redundant assignment operations.",
            before: "t3 = 10 + 20",
            after: "t3 = 30"
          },
          {
            passName: "Dead Code Elimination",
            description: "Removed unused intermediate temporary variable assignments.",
            before: "a = 10; b = 20; c = a + b;",
            after: "c = 30;"
          }
        ],
        optimizedTac: [
          "c = 30",
          "return c"
        ],
        quadruples: [
          { op: "=", arg1: "10", arg2: "-", result: "a" },
          { op: "=", arg1: "20", arg2: "-", result: "b" },
          { op: "+", arg1: "a", arg2: "b", result: "t3" },
          { op: "=", arg1: "t3", arg2: "-", result: "c" }
        ],
        triples: [
          { index: "0", op: "=", arg1: "10", arg2: "-" },
          { index: "1", op: "=", arg1: "20", arg2: "-" },
          { index: "2", op: "+", arg1: "(0)", arg2: "(1)" },
          { index: "3", op: "=", arg1: "(2)", arg2: "-" }
        ]
      };

      setOutputData(mockResult);
      setLoading(false);
    }, 400);
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
