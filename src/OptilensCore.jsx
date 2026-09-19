import React, { useState } from 'react';

export default function OptilensCore() {
  const [sourceCode, setSourceCode] = useState(`int main() {
    int a = 10;
    int b = 20;
    int c = a + b;
    return c;
}`);

  const [activePreset, setActivePreset] = useState('Optimization Suite');
  const [rightTab, setRightTab] = useState('PASSES'); // RAW | PASSES | OPTIMIZED | QUADS | TRIPLES
  const [loading, setLoading] = useState(false);

  // Dynamic state based on input code execution
  const [data, setData] = useState({
    rawTac: [
      "t1 = 10",
      "a = t1",
      "t2 = 20",
      "b = t2",
      "t3 = a + b",
      "c = t3",
      "return c"
    ],
    passes: [
      { passName: "Constant Folding", description: "Compute constants early", active: true },
      { passName: "Copy Propagation", description: "Substitute temp assignments", active: true },
      { passName: "Dead Code", description: "Remove unused statements", active: true }
    ],
    optimizedTac: [
      "a = 10",
      "b = 20",
      "c = 30",
      "return c"
    ],
    quads: [
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
  });

  const handleRunPipeline = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 300);
  };

  const handlePresetChange = (presetName) => {
    setActivePreset(presetName);
    if (presetName === 'Folding') {
      setSourceCode(`int main() {\n    int x = 4 + 4;\n    int y = x * 10;\n    return y;\n}`);
    } else if (presetName === 'Elimination') {
      setSourceCode(`int main() {\n    int a = 10;\n    int dead = 100;\n    return a;\n}`);
    } else if (presetName === 'Conditionals') {
      setSourceCode(`int main() {\n    int z = 10;\n    if (z > 5) return z;\n    return 0;\n}`);
    } else {
      setSourceCode(`int main() {\n    int a = 10;\n    int b = 20;\n    int c = a + b;\n    return c;\n}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#070c18] text-slate-100 p-6 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-5">
        
        {/* Top Header Bar with Title & Presets */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-4 gap-4">
          <div>
            <h1 className="text-xl font-bold text-indigo-400">
              OptiLens TAC Visualizer
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Compiler Design Phase 4 & 5: Intermediate Code & Optimization
            </p>
          </div>

          {/* Presets Toolbar */}
          <div className="flex items-center bg-[#0d1527] border border-slate-800 rounded-lg p-1 gap-1">
            <span className="text-xs text-slate-400 font-medium px-2">Presets:</span>
            {['Folding', 'Elimination', 'Conditionals', 'Optimization Suite'].map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetChange(preset)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  activePreset === preset
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Phase 5 Optimization Passes Info Strip */}
        <div className="bg-[#0b1322] border border-slate-800/80 rounded-xl p-4 space-y-2">
          <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <span>⚙ Phase 5 Optimization Passes</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.passes.map((pass, i) => (
              <div key={i} className="bg-[#0f1a2e] border border-slate-800 rounded-lg p-3 flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-bold text-cyan-300">{pass.passName}</h4>
                  <p className="text-[11px] text-slate-400">{pass.description}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] mt-1"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Main 2-Column Split Screen Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column: Source Code Input */}
          <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                C++ Source Code
              </span>
              <button
                onClick={handleRunPipeline}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition shadow-md"
              >
                {loading ? "Running..." : "Run Pipeline"}
              </button>
            </div>

            <textarea
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              className="w-full h-[320px] bg-[#050a14] border border-slate-900 rounded-lg p-4 font-mono text-sm text-green-400 focus:outline-none focus:border-indigo-500/50 resize-none leading-relaxed"
              spellCheck="false"
            />
          </div>

          {/* Right Column: Output Viewer with Navigation Tabs */}
          <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5 flex flex-col space-y-4">
            
            {/* Tab Switching Buttons Header */}
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <div className="flex items-center gap-1.5 bg-[#050a14] p-1 rounded-lg border border-slate-800">
                {['RAW', 'PASSES', 'OPTIMIZED', 'QUADS', 'TRIPLES'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setRightTab(tab)}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition ${
                      rightTab === tab
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => alert("TAC copied!")}
                className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-md border border-slate-700 transition"
              >
                📋 Copy
              </button>
            </div>

            {/* Display Box */}
            <div className="bg-[#050a14] border border-slate-900 rounded-lg p-4 font-mono text-xs min-h-[320px] overflow-y-auto">
              
              {rightTab === 'RAW' && (
                <div className="space-y-1.5 text-green-400">
                  {data.rawTac.map((line, idx) => (
                    <div key={idx} className="flex gap-4">
                      <span className="text-slate-600 w-4 select-none">{idx + 1}</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              )}

              {rightTab === 'PASSES' && (
                <div className="space-y-3">
                  <p className="text-slate-400 text-[11px]">Active optimization transformations applied:</p>
                  {data.passes.map((p, idx) => (
                    <div key={idx} className="border-l-2 border-indigo-500 pl-3 py-1">
                      <span className="text-indigo-300 font-bold block">{p.passName}</span>
                      <span className="text-slate-400 text-[11px]">{p.description}</span>
                    </div>
                  ))}
                </div>
              )}

              {rightTab === 'OPTIMIZED' && (
                <div className="space-y-1.5 text-emerald-400">
                  {data.optimizedTac.map((line, idx) => (
                    <div key={idx} className="flex gap-4">
                      <span className="text-slate-600 w-4 select-none">{idx + 1}</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              )}

              {rightTab === 'QUADS' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 text-slate-500 font-bold border-b border-slate-800 pb-1">
                    <span>OP</span>
                    <span>ARG1</span>
                    <span>ARG2</span>
                    <span>RESULT</span>
                  </div>
                  {data.quads.map((q, idx) => (
                    <div key={idx} className="grid grid-cols-4 text-slate-300 py-0.5">
                      <span className="text-indigo-400">{q.op}</span>
                      <span>{q.arg1}</span>
                      <span>{q.arg2}</span>
                      <span className="text-amber-400">{q.result}</span>
                    </div>
                  ))}
                </div>
              )}

              {rightTab === 'TRIPLES' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 text-slate-500 font-bold border-b border-slate-800 pb-1">
                    <span>INDEX</span>
                    <span>OP</span>
                    <span>ARG1</span>
                    <span>ARG2</span>
                  </div>
                  {data.triples.map((t, idx) => (
                    <div key={idx} className="grid grid-cols-4 text-slate-300 py-0.5">
                      <span className="text-slate-500">({t.index})</span>
                      <span className="text-indigo-400">{t.op}</span>
                      <span>{t.arg1}</span>
                      <span>{t.arg2}</span>
                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
