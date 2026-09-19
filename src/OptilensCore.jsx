import React, { useState } from 'react';

export default function OptilensCore() {
  const [activePreset, setActivePreset] = useState('Optimization Suite');
  const [activeTab, setActiveTab] = useState('side-by-side');
  const [loading, setLoading] = useState(false);

  // Presets Data Mapping
  const presetData = {
    'Folding': {
      rawTac: ["t1 = 4 + 4", "x = t1", "t2 = x * 10", "return t2"],
      optimizedTac: ["x = 8", "t2 = 8 * 10", "return t2"],
      passes: [
        { passName: "Constant Folding", description: "Compute constants early", active: true },
        { passName: "Copy Propagation", description: "Substitute temp assignments", active: false },
        { passName: "Dead Code", description: "Remove unused statements", active: false }
      ]
    },
    'Elimination': {
      rawTac: ["t1 = a + b", "x = t1", "dead = 100", "return x"],
      optimizedTac: ["x = a + b", "return x"],
      passes: [
        { passName: "Constant Folding", description: "Compute constants early", active: false },
        { passName: "Copy Propagation", description: "Substitute temp assignments", active: true },
        { passName: "Dead Code", description: "Remove unused statements", active: true }
      ]
    },
    'Conditionals': {
      rawTac: ["ifFalse z > 5 goto L1", "t4 = z + 0", "z = t4", "L1: return z"],
      optimizedTac: ["ifFalse z > 5 goto L1", "L1: return z"],
      passes: [
        { passName: "Algebraic Simplification", description: "Remove identity ops (+0, *1)", active: true },
        { passName: "Dead Code", description: "Remove unused statements", active: true }
      ]
    },
    'Optimization Suite': {
      rawTac: [
        "t1 = 4 + 4",
        "x = t1",
        "y = x",
        "t2 = y * 10",
        "dead = t2",
        "t3 = y + 2",
        "z = t3",
        "ifFalse z > 5 goto L1",
        "t4 = z + 0",
        "z = t4",
        "return z"
      ],
      optimizedTac: [
        "x = 8",
        "y = 8",
        "t2 = 8 * 10",
        "dead = t2",
        "t3 = 8 + 2",
        "z = t3",
        "ifFalse z > 5 goto L1",
        "t4 = t3 + 0",
        "z = t4",
        "return z"
      ],
      passes: [
        { passName: "Constant Folding", description: "Compute constants early", active: true },
        { passName: "Copy Propagation", description: "Substitute temp assignments", active: true },
        { passName: "Dead Code", description: "Remove unused statements", active: true }
      ]
    }
  };

  const currentData = presetData[activePreset];

  const quadruples = [
    { op: "+", arg1: "4", arg2: "4", result: "t1" },
    { op: "=", arg1: "t1", arg2: "-", result: "x" },
    { op: "*", arg1: "y", arg2: "10", result: "t2" },
    { op: "ifFalse", arg1: "z > 5", arg2: "-", result: "goto L1" }
  ];

  const triples = [
    { index: "0", op: "+", arg1: "4", arg2: "4" },
    { index: "1", op: "=", arg1: "(0)", arg2: "-" },
    { index: "2", op: "*", arg1: "(1)", arg2: "10" },
    { index: "3", op: "ifFalse", arg1: "(2) > 5", arg2: "L1" }
  ];

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Bar with Presets Menu */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
              ⚙
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-200">
                Phase 4 Code Gen & Phase 5 Optimization Visualizer
              </h1>
            </div>
          </div>

          {/* Presets Button Group */}
          <div className="flex items-center bg-[#0b121e] border border-slate-800 rounded-lg p-1.5 gap-1">
            <span className="text-xs text-slate-500 font-medium px-2">Presets:</span>
            {['Folding', 'Elimination', 'Conditionals', 'Optimization Suite'].map((preset) => (
              <button
                key={preset}
                onClick={() => setActivePreset(preset)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  activePreset === preset
                    ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Phase 5 Optimization Passes Section */}
        <div className="bg-[#090f19] border border-slate-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
            <span className="text-base">⚙</span>
            <span>Phase 5 Optimization Passes</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentData.passes.map((pass, idx) => (
              <div 
                key={idx} 
                className={`border rounded-xl p-4 transition relative overflow-hidden bg-[#0c1424] ${
                  pass.active ? 'border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.1)]' : 'border-slate-800 opacity-60'
                }`}
              >
                <div className={`w-2 h-2 rounded-full absolute top-4 right-4 ${pass.active ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-slate-600'}`}></div>
                <h3 className="text-sm font-bold text-cyan-200">{pass.passName}</h3>
                <p className="text-xs text-slate-400 mt-1">{pass.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* View Selection Tabs & Copy TAC */}
        <div className="flex items-center justify-between bg-[#090f19] border border-slate-800/80 rounded-xl p-2">
          <div className="flex gap-2">
            {[
              { id: 'side-by-side', label: '⚡ TAC Side-by-Side' },
              { id: 'quads', label: '📊 Quadruples' },
              { id: 'triples', label: '🔢 Triples' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:bg-slate-800/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button 
            onClick={() => alert("TAC Copied to clipboard!")}
            className="text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-3.5 py-1.5 rounded-lg border border-slate-700/80 transition flex items-center gap-1.5 font-medium"
          >
            📋 Copy TAC
          </button>
        </div>

        {/* Dynamic Display */}
        {activeTab === 'side-by-side' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Raw TAC */}
            <div className="bg-[#090f19] border border-slate-800/80 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                  <span className="text-xs font-bold text-rose-300 tracking-wide uppercase">
                    Phase 4: Raw TAC (Unoptimized)
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  {currentData.rawTac.length} Instructions
                </span>
              </div>

              <div className="bg-[#04070d] border border-slate-900 rounded-lg p-4 font-mono text-xs space-y-2 min-h-[280px]">
                {currentData.rawTac.map((line, idx) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <span className="text-slate-600 w-4 text-right select-none">{idx + 1}</span>
                    <span className="text-rose-300/90 font-medium">{line}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Optimized TAC */}
            <div className="bg-[#090f19] border border-slate-800/80 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></div>
                  <span className="text-xs font-bold text-emerald-300 tracking-wide uppercase">
                    Phase 5: Optimized TAC
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  {currentData.optimizedTac.length} Instructions
                </span>
              </div>

              <div className="bg-[#04070d] border border-slate-900 rounded-lg p-4 font-mono text-xs space-y-2 min-h-[280px]">
                {currentData.optimizedTac.map((line, idx) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <span className="text-slate-600 w-4 text-right select-none">{idx + 1}</span>
                    <span className="text-emerald-400 font-medium">{line}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'quads' && (
          <div className="bg-[#090f19] border border-slate-800/80 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Quadruples Representation</h3>
            <div className="bg-[#04070d] border border-slate-900 rounded-lg p-4 font-mono text-xs space-y-2">
              <div className="grid grid-cols-4 gap-2 text-slate-500 border-b border-slate-800 pb-2 font-bold">
                <span>OPERATOR</span>
                <span>ARGUMENT 1</span>
                <span>ARGUMENT 2</span>
                <span>RESULT</span>
              </div>
              {quadruples.map((q, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 py-1.5 border-b border-slate-900/50">
                  <span className="text-cyan-400">{q.op}</span>
                  <span>{q.arg1}</span>
                  <span>{q.arg2}</span>
                  <span className="text-amber-400">{q.result}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'triples' && (
          <div className="bg-[#090f19] border border-slate-800/80 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Triples Representation</h3>
            <div className="bg-[#04070d] border border-slate-900 rounded-lg p-4 font-mono text-xs space-y-2">
              <div className="grid grid-cols-4 gap-2 text-slate-500 border-b border-slate-800 pb-2 font-bold">
                <span>INDEX</span>
                <span>OPERATOR</span>
                <span>ARGUMENT 1</span>
                <span>ARGUMENT 2</span>
              </div>
              {triples.map((t, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 py-1.5 border-b border-slate-900/50">
                  <span className="text-slate-500">({t.index})</span>
                  <span className="text-cyan-400">{t.op}</span>
                  <span>{t.arg1}</span>
                  <span>{t.arg2}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
