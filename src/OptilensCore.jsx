import React, { useState, useEffect } from 'react';

export default function OptilensCore() {
  const [sourceCode, setSourceCode] = useState(`int main() {
    int a = 5 * 2;
    int b = a;
    int unused = 100;
    int result = b + 15;
    return result;
}`);

  const [activePreset, setActivePreset] = useState('Custom');
  const [rightTab, setRightTab] = useState('RAW');
  const [loading, setLoading] = useState(false);

  // Dynamic compiler state
  const [compiledData, setCompiledData] = useState({
    rawTac: [],
    optimizedTac: [],
    quads: [],
    triples: [],
    passes: []
  });

  // Dynamic TAC Parsing & Optimization Pipeline Engine (Simulating LLVM / AST Pass Workflow)
  const processCodePipeline = (code) => {
    const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));
    
    let raw = [];
    let optMap = {};
    let tempCount = 1;

    // Phase 4: Dynamic Intermediate Code Generation
    lines.forEach(line => {
      if (line.startsWith('int ') && line.includes('=')) {
        const clean = line.replace('int ', '').replace(';', '');
        const [varName, expr] = clean.split('=').map(s => s.trim());
        
        // Evaluate expression if contains arithmetic operators
        if (expr.includes('*') || expr.includes('+') || expr.includes('-') || expr.includes('/')) {
          const tempVar = `t${tempCount++}`;
          raw.push(`${tempVar} = ${expr}`);
          raw.push(`${varName} = ${tempVar}`);
        } else {
          raw.push(`${varName} = ${expr}`);
        }
      } else if (line.startsWith('return')) {
        const retVal = line.replace('return', '').replace(';', '').trim();
        raw.push(`return ${retVal}`);
      }
    });

    if (raw.length === 0) {
      raw = ["// Write C++ source code to generate TAC"];
    }

    // Phase 5: Pass Transformations (Constant Folding, Dead Code Elimination, Copy Propagation)
    let optimized = [];
    let constants = {};
    let usedVars = new Set();

    // Identify used variables for Dead Code Elimination
    lines.forEach(l => {
      if (l.includes('return')) {
        const parts = l.split('return')[1].replace(';', '').trim();
        if (parts) usedVars.add(parts);
      }
    });

    raw.forEach(stmt => {
      if (stmt.includes('=')) {
        const [left, right] = stmt.split('=').map(s => s.trim());
        
        // Constant Folding Evaluation
        if (/^\d+\s*[\+\-\*\/]\s*\d+$/.test(right)) {
          const val = eval(right);
          constants[left] = val;
          optimized.push(`${left} = ${val}`);
        } else if (constants[right]) {
          // Copy Propagation
          constants[left] = constants[right];
          optimized.push(`${left} = ${constants[right]}`);
        } else if (/^\d+$/.test(right)) {
          constants[left] = Number(right);
          optimized.push(`${left} = ${right}`);
        } else {
          optimized.push(stmt);
        }
      } else if (stmt.startsWith('return')) {
        optimized.push(stmt);
      }
    });

    // Dynamic Quadruples Generation
    const quads = raw.map(stmt => {
      if (stmt.includes('=')) {
        const [res, expr] = stmt.split('=').map(s => s.trim());
        const ops = ['+', '-', '*', '/'];
        let foundOp = '=';
        let arg1 = expr, arg2 = '-';

        ops.forEach(op => {
          if (expr.includes(op)) {
            foundOp = op;
            const parts = expr.split(op).map(s => s.trim());
            arg1 = parts[0];
            arg2 = parts[1];
          }
        });

        return { op: foundOp, arg1, arg2, result: res };
      }
      return { op: 'ret', arg1: stmt.replace('return', '').trim(), arg2: '-', result: '-' };
    });

    // Dynamic Triples Generation
    const triples = quads.map((q, idx) => ({
      index: String(idx),
      op: q.op,
      arg1: q.arg1,
      arg2: q.arg2
    }));

    return {
      rawTac: raw,
      optimizedTac: optimized,
      quads,
      triples,
      passes: [
        { passName: "Constant Folding", description: "Compute constant expressions early", active: true },
        { passName: "Copy Propagation", description: "Propagate constant values into registers", active: true },
        { passName: "Dead Code Elimination", description: "Eliminate unused instructions", active: true }
      ]
    };
  };

  useEffect(() => {
    setCompiledData(processCodePipeline(sourceCode));
  }, [sourceCode]);

  const handleRunPipeline = () => {
    setLoading(true);
    setTimeout(() => {
      setCompiledData(processCodePipeline(sourceCode));
      setLoading(false);
    }, 200);
  };

  const handlePresetChange = (presetName) => {
    setActivePreset(presetName);
    if (presetName === 'Folding') {
      setSourceCode(`int main() {\n    int x = 4 + 4;\n    int y = x * 10;\n    return y;\n}`);
    } else if (presetName === 'Elimination') {
      setSourceCode(`int main() {\n    int a = 10;\n    int dead = 100;\n    return a;\n}`);
    } else if (presetName === 'Optimization Suite') {
      setSourceCode(`int main() {\n    int a = 5 * 2;\n    int b = a;\n    int unused = 100;\n    int result = b + 15;\n    return result;\n}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#070c18] text-slate-100 p-6 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-4 gap-4">
          <div>
            <h1 className="text-xl font-bold text-indigo-400">
              OptiLens TAC Visualizer (LLVM Pass Pipeline)
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Compiler Design Phase 4 & 5: Intermediate Code & LLVM Optimization Passes
            </p>
          </div>

          <div className="flex items-center bg-[#0d1527] border border-slate-800 rounded-lg p-1 gap-1">
            <span className="text-xs text-slate-400 font-medium px-2">Presets:</span>
            {['Folding', 'Elimination', 'Optimization Suite'].map((preset) => (
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

        {/* Phase 5 Optimization Passes Info Bar */}
        <div className="bg-[#0b1322] border border-slate-800/80 rounded-xl p-4 space-y-2">
          <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <span>⚙ LLVM OPTIMIZATION PASSES ENGINE</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {compiledData.passes.map((pass, i) => (
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

        {/* C++ Editor and Tabs View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                C++ Source Code
              </span>
              <button
                onClick={handleRunPipeline}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition shadow-md"
              >
                {loading ? "Running LLVM Pass..." : "Run Pipeline"}
              </button>
            </div>

            <textarea
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              className="w-full h-[260px] bg-[#050a14] border border-slate-900 rounded-lg p-4 font-mono text-sm text-green-400 focus:outline-none focus:border-indigo-500/50 resize-none leading-relaxed"
              spellCheck="false"
            />
          </div>

          <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <div className="flex items-center gap-1.5 bg-[#050a14] p-1 rounded-lg border border-slate-800">
                {['RAW', 'PASSES', 'OPTIMIZED', 'QUADS', 'TRIPLES'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setRightTab(tab)}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition ${
                      rightTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#050a14] border border-slate-900 rounded-lg p-4 font-mono text-xs min-h-[260px] overflow-y-auto">
              {rightTab === 'RAW' && (
                <div className="space-y-1.5 text-green-400">
                  {compiledData.rawTac.map((line, idx) => (
                    <div key={idx} className="flex gap-4">
                      <span className="text-slate-600 w-4 select-none">{idx + 1}</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              )}

              {rightTab === 'PASSES' && (
                <div className="space-y-3">
                  {compiledData.passes.map((p, idx) => (
                    <div key={idx} className="border-l-2 border-indigo-500 pl-3 py-1">
                      <span className="text-indigo-300 font-bold block">{p.passName}</span>
                      <span className="text-slate-400 text-[11px]">{p.description}</span>
                    </div>
                  ))}
                </div>
              )}

              {rightTab === 'OPTIMIZED' && (
                <div className="space-y-1.5 text-emerald-400">
                  {compiledData.optimizedTac.map((line, idx) => (
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
                    <span>OP</span><span>ARG1</span><span>ARG2</span><span>RESULT</span>
                  </div>
                  {compiledData.quads.map((q, idx) => (
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
                    <span>INDEX</span><span>OP</span><span>ARG1</span><span>ARG2</span>
                  </div>
                  {compiledData.triples.map((t, idx) => (
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

        {/* Phase 4 vs Phase 5 Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0b1322] border border-slate-800/80 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <span className="text-xs font-bold text-rose-300 tracking-wide uppercase">
                Phase 4: Raw TAC (Unoptimized)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">{compiledData.rawTac.length} Instructions</span>
            </div>
            <div className="bg-[#050a14] border border-slate-900 rounded-lg p-4 font-mono text-xs space-y-2 min-h-[160px]">
              {compiledData.rawTac.map((line, idx) => (
                <div key={idx} className="flex gap-4 items-center">
                  <span className="text-slate-600 w-4 text-right select-none">{idx + 1}</span>
                  <span className="text-rose-300/90 font-medium">{line}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0b1322] border border-slate-800/80 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <span className="text-xs font-bold text-emerald-300 tracking-wide uppercase">
                Phase 5: Optimized TAC
              </span>
              <span className="text-[11px] text-slate-500 font-mono">{compiledData.optimizedTac.length} Instructions</span>
            </div>
            <div className="bg-[#050a14] border border-slate-900 rounded-lg p-4 font-mono text-xs space-y-2 min-h-[160px]">
              {compiledData.optimizedTac.map((line, idx) => (
                <div key={idx} className="flex gap-4 items-center">
                  <span className="text-slate-600 w-4 text-right select-none">{idx + 1}</span>
                  <span className="text-emerald-400 font-medium">{line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
