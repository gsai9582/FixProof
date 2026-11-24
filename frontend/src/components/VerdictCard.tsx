import React from 'react';
import { Verification } from '../api/client';
import { CheckCircle2, XCircle, AlertTriangle, MapPin, Clock, Eye, Sparkles, Cpu, ShieldAlert, Check } from 'lucide-react';

interface Props {
  verification: Verification;
}

export const VerdictCard: React.FC<Props> = ({ verification }) => {
  const isVerified = verification.verdict === 'verified_fix';
  const isRejected = verification.verdict === 'rejected';
  const isReview = verification.verdict === 'needs_review';

  return (
    <div className={`rounded-xl border p-5 shadow-sm transition-all ${
      isVerified
        ? 'bg-emerald-500/5 border-emerald-500/30'
        : isRejected
        ? 'bg-rose-500/5 border-rose-500/30'
        : 'bg-amber-500/5 border-amber-500/30'
    }`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {isVerified && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
          {isRejected && <XCircle className="w-6 h-6 text-rose-500" />}
          {isReview && <AlertTriangle className="w-6 h-6 text-amber-500" />}
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Closure Integrity Verdict:
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono uppercase tracking-wider ${
                isVerified
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : isRejected
                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                  : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
              }`}>
                {verification.verdict.replace('_', ' ')}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluated by FixProof Multi-Signal Verification Pipeline
            </p>
          </div>
        </div>

        {/* Mode & Confidence Badge */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
            verification.mode === 'ai'
              ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400'
              : 'bg-slate-500/10 border-slate-500/30 text-slate-600 dark:text-slate-400'
          }`}>
            {verification.mode === 'ai' ? <Sparkles className="w-3 h-3" /> : <Cpu className="w-3 h-3" />}
            {verification.mode === 'ai' ? 'AI Vision Mode' : 'Basic Heuristic Mode'}
          </span>

          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-slate-700 dark:text-slate-300 font-semibold">
            {(verification.confidence * 100).toFixed(0)}% Confidence
          </span>
        </div>
      </div>

      {/* 3 Core Check Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Check 1: Geolocation */}
        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              Geo Proximity
            </span>
            <span className={`font-bold uppercase text-[11px] ${verification.geo_pass ? 'text-emerald-500' : 'text-rose-500'}`}>
              {verification.geo_pass ? 'PASS' : 'FAIL'}
            </span>
          </div>
          <div className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200">
            {verification.geo_distance_meters.toFixed(1)}m from site
          </div>
          <div className="text-[10px] text-slate-400">Allowed limit: 30m</div>
        </div>

        {/* Check 2: Timestamp */}
        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Timestamp Freshness
            </span>
            <span className={`font-bold uppercase text-[11px] ${verification.time_pass ? 'text-emerald-500' : 'text-rose-500'}`}>
              {verification.time_pass ? 'PASS' : 'FAIL'}
            </span>
          </div>
          <div className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200">
            Chronological & In-App
          </div>
          <div className="text-[10px] text-slate-400">Validated against server clock</div>
        </div>

        {/* Check 3: Scene / Defect */}
        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              Visual Match & Defect
            </span>
            <span className={`font-bold uppercase text-[11px] ${verification.scene_pass ? 'text-emerald-500' : 'text-rose-500'}`}>
              {verification.scene_pass ? 'PASS' : 'FAIL'}
            </span>
          </div>
          <div className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200">
            {(verification.scene_similarity_score * 100).toFixed(0)}% Visual Match
          </div>
          <div className="text-[10px] text-slate-400">
            {verification.defect_fixed ? 'Defect Removal Confirmed' : 'Defect Still Present / Inconclusive'}
          </div>
        </div>
      </div>

      {/* Signal Reasons Breakdown */}
      {verification.reasons && verification.reasons.length > 0 && (
        <div className="bg-white/80 dark:bg-slate-900/80 rounded-lg p-3 border border-slate-200/60 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-civic-500" />
            Verification Evidence Details:
          </div>
          <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pl-4 list-disc">
            {verification.reasons.map((reason, idx) => (
              <li key={idx} className={reason.includes('FAIL') ? 'text-rose-500 dark:text-rose-400 font-medium' : ''}>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Admin Override Alert if applicable */}
      {verification.admin_override && (
        <div className="mt-3 p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300">
          <span className="font-bold">Supervisor Override:</span> {verification.admin_notes || 'Manual review passed.'}
        </div>
      )}
    </div>
  );
};
