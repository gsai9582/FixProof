import React, { useState } from 'react';
import { PriorityBreakdown } from '../api/client';
import { Info, AlertCircle, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

interface Props {
  score: number;
  breakdown?: PriorityBreakdown;
  showDetailsDefault?: boolean;
}

export const PriorityGauge: React.FC<Props> = ({ score, breakdown, showDetailsDefault = false }) => {
  const [showDetails, setShowDetails] = useState(showDetailsDefault);

  const getColor = (val: number) => {
    if (val >= 75) return { text: 'text-rose-500', bg: 'bg-rose-500', barBg: 'bg-rose-500/20' };
    if (val >= 50) return { text: 'text-amber-500', bg: 'bg-amber-500', barBg: 'bg-amber-500/20' };
    return { text: 'text-civic-500', bg: 'bg-civic-500', barBg: 'bg-civic-500/20' };
  };

  const c = getColor(score);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Explainable Priority
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
            P-Score
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-bold font-mono ${c.text}`}>{score.toFixed(1)}</span>
          <span className="text-xs text-slate-400">/ 100</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${c.bg}`}
          style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
        />
      </div>

      {/* Accordion Toggle for Why this rank */}
      {breakdown && (
        <>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-civic-600 dark:hover:text-civic-400 transition pt-1"
          >
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-civic-500" />
              Why this rank? (Formula breakdown)
            </span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDetails && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/60">
                  <div className="text-slate-400">Severity (35%)</div>
                  <div className="font-semibold text-slate-700 dark:text-slate-200 font-mono">
                    {breakdown.severity_score} / 100
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/60">
                  <div className="text-slate-400">Exposure (25%)</div>
                  <div className="font-semibold text-slate-700 dark:text-slate-200 font-mono">
                    {breakdown.exposure_score} / 100
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/60">
                  <div className="text-slate-400">Corroboration (20%)</div>
                  <div className="font-semibold text-slate-700 dark:text-slate-200 font-mono">
                    {breakdown.corroboration_score} / 100
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/60">
                  <div className="text-slate-400">Ageing vs SLA (20%)</div>
                  <div className="font-semibold text-slate-700 dark:text-slate-200 font-mono">
                    {breakdown.ageing_score} / 100
                  </div>
                </div>
              </div>

              {breakdown.explanation && breakdown.explanation.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Ranking Factors:</div>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-600 dark:text-slate-300 text-[11px]">
                    {breakdown.explanation.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
