import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { accountabilityApi, AnalyticsSummary } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, ArrowRight, CheckCircle2, AlertTriangle, XCircle,
  FileCheck2, Users, MapPin, Sparkles, TrendingUp, Cpu
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const { quickLogin } = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    accountabilityApi.getSummary()
      .then(setSummary)
      .catch(() => {
        // Fallback default stats for display
        setSummary({
          total_reports: 40,
          active_reports: 24,
          claimed_closures: 18,
          verified_closures: 14,
          rejected_closures: 3,
          reopened_reports: 2,
          overall_integrity_score: 77.8,
          median_time_hours: 22.4,
          category_distribution: {},
          status_distribution: {},
          wards: [],
          departments: []
        });
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200 dark:border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-b from-civic-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            {/* Tagline Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-civic-500/10 border border-civic-500/20 text-civic-700 dark:text-civic-300 text-xs font-semibold mb-6">
              <ShieldCheck className="w-4 h-4 text-civic-500" />
              <span>{t('hero.badge', 'VERIFIED CIVIC RESOLUTION PLATFORM')}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] mb-6">
              Don't just report it. <br />
              <span className="bg-gradient-to-r from-civic-500 via-teal-500 to-indigo-500 bg-clip-text text-transparent">
                Prove it's fixed.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
              Civic complaint apps digitised intake, but complaints are still closed on the authority's own claim.
              FixProof rebuilds civic trust with <strong>geotagged after-photos</strong>, <strong>multi-signal verification</strong>, and <strong>public ward integrity metrics</strong>.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/report"
                className="px-6 py-3 rounded-xl bg-civic-600 hover:bg-civic-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition flex items-center gap-2"
              >
                {t('hero.cta_report', 'Report an Issue')}
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/map"
                className="px-6 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm transition flex items-center gap-2"
              >
                <MapPin className="w-4 h-4 text-civic-500" />
                {t('hero.cta_explore', 'Explore Civic Map')}
              </Link>
            </div>

            {/* One click demo bar */}
            <div className="mt-8 p-3 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 inline-flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">⚡ Quick Demo Login:</span>
              <button
                onClick={() => quickLogin('citizen')}
                className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:text-civic-500 shadow-xs border border-slate-200 dark:border-slate-700"
              >
                Citizen Ananya
              </button>
              <button
                onClick={() => quickLogin('officer')}
                className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:text-civic-500 shadow-xs border border-slate-200 dark:border-slate-700"
              >
                Officer Suresh
              </button>
              <button
                onClick={() => quickLogin('admin')}
                className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:text-civic-500 shadow-xs border border-slate-200 dark:border-slate-700"
              >
                Admin Ramanathan
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Live Impact Counters */}
      <section className="py-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-civic-600 dark:text-civic-400">
                {summary?.overall_integrity_score ?? 78}%
              </div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mt-1">
                Closure Integrity Score
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Verified vs Claimed Closures</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                {summary?.verified_closures ?? 14}
              </div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mt-1">
                Verified Closures
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Proven with Geotagged Proof</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-600 dark:text-rose-400">
                {summary?.rejected_closures ?? 3}
              </div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mt-1">
                Fake Fixes Caught
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Blocked by Geo & Scene AI</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                {summary?.median_time_hours ?? 22}h
              </div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mt-1">
                Median Verified SLA
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Hours to proven closure</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Step Engine Explainer */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
              How FixProof Eliminates False Closures
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Traditional apps treat "Resolved" as an authority's status label. FixProof treats "Resolved" as a claim to be verified.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs relative">
              <div className="w-12 h-12 rounded-xl bg-civic-500/10 text-civic-600 dark:text-civic-400 flex items-center justify-center font-bold text-lg mb-4">
                01
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Capture & Understand
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Citizens report via photo, voice, or text in English, தமிழ், or हिंदी. AI analyses defect risk, merges duplicate complaints within 50m, and assigns an explainable Priority Score (0-100).
              </p>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-[11px] text-slate-500 font-mono">
                Formula = 0.35·Severity + 0.25·Exposure + 0.20·Corroboration + 0.20·Ageing
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs relative">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg mb-4">
                02
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Resolve with Proof
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Officers access a transparent queue ranked by urgent safety priorities. To mark a complaint resolved, the officer must capture an in-app geotagged after-photo as physical evidence.
              </p>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-[11px] text-slate-500 font-mono">
                Mandatory: In-app camera, live GPS stamp &lt;30m, contractor repair notes
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs relative">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg mb-4">
                03
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Multi-Signal Verification
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                The engine evaluates Geo-proximity, Timestamp validity, and Scene defect removal. Nearby citizens get 72h to confirm. If false, the report automatically reopens.
              </p>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-[11px] text-slate-500 font-mono">
                Outputs: Verified Fix, Needs Review, or Rejected with human reasons
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Walkthrough Feature Box */}
      <section className="py-12 bg-slate-100 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-10 shadow-xl border border-indigo-500/20">
            <div className="max-w-2xl">
              <span className="text-xs font-mono uppercase tracking-widest text-civic-400 font-bold">
                Live Hackathon Demo Highlight
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold mt-1 mb-3">
                Watch the "Fake Fix" get caught live
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm mb-6 leading-relaxed">
                In our seeded demo data, an officer submitted a closure photo taken at Marina Beach (4.2 km away) for a pothole report on Usman Road. FixProof's multi-signal engine caught the 4,240m discrepancy and rejected the closure with detailed reasons.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/reports/2"
                  className="px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  Inspect Caught Fake Fix &rarr;
                </Link>
                <Link
                  to="/reports/1"
                  className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Inspect Verified Fix &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
