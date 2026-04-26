"use client";

import { CodeEditor } from "@/components/playground/CodeEditor";
import { useState } from "react";

export default function PlaygroundPage() {
  const [output, setOutput] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [isMobileEditorMode, setIsMobileEditorMode] = useState(false);

  const handleCompile = () => {
    setIsCompiling(true);
    setTimeout(() => {
      setOutput(
        "Compilation successful!\nWASM size: 4.2KB\nContract ready for simulation.",
      );
      setIsCompiling(false);
    }, 1500);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] overflow-x-hidden bg-black p-4 font-mono text-white sm:p-6 md:p-12">
      <div className="mx-auto flex h-full max-w-7xl flex-col">
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-white/10 pb-6 md:mb-12 md:flex-row md:items-end">
          <div className="min-w-0">
            <h1 className="mb-2 text-3xl font-black uppercase tracking-tighter sm:text-4xl">
              Soroban <span className="text-red-500">Playground</span>
            </h1>
            <p className="text-xs uppercase tracking-widest text-gray-500">
              Experimental Smart Contract Runtime v1.0.4
            </p>
          </div>
          <div className="hidden text-right md:block">
            <span className="animate-pulse text-[10px] font-bold uppercase tracking-widest text-green-500">
              Network Active: Stellar Testnet
            </span>
          </div>
        </div>

        <div className="grid flex-grow grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)] xl:gap-12">
          <div className="relative flex min-h-[32rem] min-w-0 flex-col rounded-xl border border-white/10 bg-zinc-950 p-4 shadow-2xl sm:p-6 xl:min-h-[600px] xl:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
              <div className="flex min-w-0 items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <div className="h-3 w-3 rounded-full bg-zinc-700"></div>
                <div className="h-3 w-3 rounded-full bg-zinc-700"></div>
                <span className="ml-2 truncate text-[10px] font-bold uppercase tracking-widest text-gray-500 sm:ml-4">
                  contract.rs
                </span>
              </div>
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-red-600/20 bg-red-600/10 px-3 text-[9px] font-black uppercase tracking-widest text-red-500">
                <input
                  type="checkbox"
                  checked={isMobileEditorMode}
                  onChange={(event) =>
                    setIsMobileEditorMode(event.target.checked)
                  }
                  className="h-4 w-4 accent-red-600"
                />
                Mobile-Friendly
              </label>
            </div>

            <div className="flex min-h-0 flex-grow flex-col overflow-hidden rounded-xl border border-white/5">
              <CodeEditor
                roomName="main-lab-session"
                mobileMode={isMobileEditorMode}
              />
            </div>

            <button
              onClick={handleCompile}
              disabled={isCompiling}
              className={`mt-4 min-h-12 rounded-xl py-4 text-xs font-black uppercase tracking-[0.2em] transition-all ${
                isCompiling
                  ? "cursor-not-allowed bg-zinc-800 text-gray-500"
                  : "bg-red-600 text-white hover:bg-red-500 active:scale-[0.98]"
              }`}
            >
              {isCompiling ? "Compiling Context..." : "Execute Logic"}
            </button>
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <div className="group relative min-h-64 flex-grow overflow-hidden rounded-xl border border-white/10 bg-black p-5 shadow-inner sm:p-8">
              <div className="absolute left-0 top-0 h-1 w-full bg-red-600/30"></div>
              <h3 className="mb-6 text-[10px] font-black uppercase tracking-widest text-gray-600">
                Execution_Output
              </h3>
              <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-loose text-red-500/80">
                {output ||
                  "> Initializing environment...\n> Awaiting input signal..."}
              </pre>
              {isCompiling && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-all">
                  <div className="flex flex-col items-center">
                    <div className="mb-4 h-1 w-12 overflow-hidden rounded-full bg-zinc-800">
                      <div className="h-full w-1/2 animate-[loading_1s_infinite] bg-red-600"></div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                      Processing WASM Bytecode
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/5 bg-zinc-950 p-5 sm:p-8">
              <h4 className="mb-4 text-[10px] font-black uppercase tracking-widest text-white">
                Laboratory Notes
              </h4>
              <p className="text-[11px] font-light leading-relaxed text-gray-500">
                This playground provides a{" "}
                <span className="text-white">real-time transpilation</span>{" "}
                environment for Soroban logic. Validated code can be deployed to
                the Stellar testnet via the integrated CLI tools in the{" "}
                <span className="text-red-500">Builder Tier</span> modules.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
