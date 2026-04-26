"use client";

import { ResourceGauge } from "@/components/simulator/ResourceGauge";
import {
  buildStrategyComparisons,
  estimateSorobanResources,
} from "@/lib/simulator/sorobanEstimator";
import { useEffect, useMemo, useState } from "react";

const SAMPLE_CONTRACT = `#![no_std]
use soroban_sdk::{contract, contractimpl, Env, Symbol, Vec, Map};

#[contract]
pub struct StudentProgress;

#[contractimpl]
impl StudentProgress {
    pub fn update_score(env: Env, student_id: Symbol, lessons: Vec<i32>) {
        let mut total = 0;
        for score in lessons.iter() {
            if score > 50 {
                total += score;
            }
        }

        let mut stats: Map<Symbol, i32> = env.storage().instance().get(&student_id).unwrap_or(Map::new(&env));
        stats.set(Symbol::new(&env, "score"), total);
        env.storage().instance().set(&student_id, &stats);
        env.events().publish((Symbol::new(&env, "score_updated"), student_id), total);
    }
}`;

const THRESHOLDS = {
  cpu: { warning: 75, critical: 90 },
  ram: { warning: 72, critical: 88 },
  storage: { warning: 68, critical: 85 },
};

export default function SimulatorPage() {
  const [code, setCode] = useState(SAMPLE_CONTRACT);
  const [estimate, setEstimate] = useState(() =>
    estimateSorobanResources(SAMPLE_CONTRACT)
  );
  const [isEstimating, setIsEstimating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Debounced background estimator that runs as the user edits the contract.
  useEffect(() => {
    setIsEstimating(true);

    const timeoutId = window.setTimeout(() => {
      setEstimate(estimateSorobanResources(code));
      setLastUpdated(new Date());
      setIsEstimating(false);
    }, 170);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [code]);

  const comparisonRows = useMemo(
    () => buildStrategyComparisons(estimate),
    [estimate]
  );

  return (
    <div className="min-h-[calc(100vh-80px)] bg-black text-white px-5 py-8 md:px-12 md:py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(239,68,68,0.12),transparent_45%),radial-gradient(circle_at_85%_70%,rgba(16,185,129,0.08),transparent_40%),linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[auto,auto,34px_34px,34px_34px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div className="border-l-4 border-red-600 pl-5">
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
              Soroban Resource <span className="text-red-500">Limit Simulator</span>
            </h1>
            <p className="text-xs text-gray-400 uppercase tracking-[0.22em] mt-2">
              CPU / RAM / Storage gauges calibrated with classroom benchmark profiles
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
            <span className="px-3 py-2 rounded bg-zinc-900 border border-white/15 text-gray-300">
              Profile: {estimate.benchmarkVersion}
            </span>
            <span
              className={`px-3 py-2 rounded border ${
                isEstimating
                  ? "border-amber-400/60 text-amber-300 bg-amber-400/10"
                  : "border-emerald-400/50 text-emerald-300 bg-emerald-400/10"
              }`}
            >
              {isEstimating ? "Gas Estimator Running" : "Estimator Synced"}
            </span>
          </div>
        </header>

        <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-7 bg-zinc-950/90 border border-white/10 rounded-2xl p-5 md:p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 gap-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-white/90">
                Contract Input
              </h2>
              <span className="text-[10px] text-gray-400 uppercase tracking-[0.16em]">
                Last update {lastUpdated.toLocaleTimeString()}
              </span>
            </div>

            <textarea
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="w-full min-h-[360px] md:min-h-[430px] resize-y bg-black/80 border border-white/15 rounded-xl p-4 text-[13px] leading-relaxed font-mono text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/60"
              spellCheck={false}
              aria-label="Soroban contract editor"
            />

            <p className="mt-3 text-xs text-gray-500">
              The estimator runs in the background after each keystroke burst and weights loops,
              storage calls, serialization, and cross-contract invokes.
            </p>
          </div>

          <div className="xl:col-span-5 space-y-6">
            <div className="bg-zinc-950/90 border border-white/10 rounded-2xl p-5 md:p-6 shadow-2xl">
              <h2 className="text-sm font-black uppercase tracking-widest text-white/90 mb-4">
                Real-Time Gauges
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-4 justify-items-center">
                <ResourceGauge
                  label="CPU"
                  value={estimate.cpu}
                  max={100}
                  warningAt={THRESHOLDS.cpu.warning}
                  criticalAt={THRESHOLDS.cpu.critical}
                />
                <ResourceGauge
                  label="RAM"
                  value={estimate.ram}
                  max={100}
                  warningAt={THRESHOLDS.ram.warning}
                  criticalAt={THRESHOLDS.ram.critical}
                />
                <ResourceGauge
                  label="Storage"
                  value={estimate.storage}
                  max={100}
                  warningAt={THRESHOLDS.storage.warning}
                  criticalAt={THRESHOLDS.storage.critical}
                />
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/50 p-4 flex items-end justify-between gap-5">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500">
                    Estimated Gas / Invocation
                  </p>
                  <p className="text-3xl font-black text-red-500 tracking-tight">
                    {estimate.gas.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500">
                    Confidence
                  </p>
                  <p className="text-xl font-bold text-white">{estimate.confidence}%</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-950/90 border border-white/10 rounded-2xl p-5 md:p-6 shadow-2xl">
              <h2 className="text-sm font-black uppercase tracking-widest text-white/90 mb-4">
                Threshold Warnings
              </h2>

              {estimate.warnings.length === 0 ? (
                <p className="text-sm text-emerald-300 border border-emerald-400/30 bg-emerald-400/10 rounded-lg p-3">
                  All metrics are currently within safe lab thresholds.
                </p>
              ) : (
                <div className="space-y-3">
                  {estimate.warnings.map((warning) => (
                    <div
                      key={`${warning.metric}-${warning.level}`}
                      className={`rounded-lg p-3 border ${
                        warning.level === "critical"
                          ? "border-red-500/60 bg-red-500/10 text-red-200"
                          : "border-amber-400/50 bg-amber-400/10 text-amber-100"
                      }`}
                    >
                      <p className="text-[10px] uppercase tracking-widest font-bold mb-1">
                        {warning.metric} {warning.level}
                      </p>
                      <p className="text-sm leading-snug">{warning.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-zinc-950/90 border border-white/10 rounded-2xl p-5 md:p-6 shadow-2xl overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-white/90">
              Optimization Comparison View
            </h2>
            <p className="text-[11px] text-gray-500">
              Lower gas is better. Values are projected against the current contract body.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase tracking-[0.15em] text-gray-500">
                  <th className="py-3 pr-4">Strategy</th>
                  <th className="py-3 pr-4">CPU</th>
                  <th className="py-3 pr-4">RAM</th>
                  <th className="py-3 pr-4">Storage</th>
                  <th className="py-3 pr-4">Gas</th>
                  <th className="py-3 pr-0">Savings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {comparisonRows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={index === 0 ? "bg-red-500/6" : "hover:bg-white/3"}
                  >
                    <td className="py-3.5 pr-4">
                      <p className="font-bold text-white text-sm">{row.label}</p>
                      <p className="text-xs text-gray-500">{row.description}</p>
                    </td>
                    <td className="py-3.5 pr-4 text-sm text-gray-200">{row.cpu}%</td>
                    <td className="py-3.5 pr-4 text-sm text-gray-200">{row.ram}%</td>
                    <td className="py-3.5 pr-4 text-sm text-gray-200">{row.storage}%</td>
                    <td className="py-3.5 pr-4 text-sm font-bold text-red-400">
                      {row.gas.toLocaleString()}
                    </td>
                    <td className="py-3.5 pr-0 text-sm font-semibold text-emerald-300">
                      {row.savings > 0 ? `${row.savings.toLocaleString()} gas` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
