import React, { useState, useEffect } from 'react';
import { accountabilityApi, AnalyticsSummary } from '../api/client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import {
  ShieldCheck, AlertTriangle, TrendingUp, Award, Clock,
  Layers, CheckCircle2, XCircle, RotateCcw, Info, HelpCircle
} from 'lucide-react';

export const AccountabilityDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    accountabilityApi.getSummary()
      .then(setSummary)
      .catch(() => {
        // Fallback
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !summary) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-4 border-civic-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <div className="text-xs text-slate-500">Computing real-time integrity metrics...</div>
      </div>
    );
  }

  const wardChartData = summary.wards.map((w) => ({
    name: w.ward_name.replace('Ward ', 'W-'),
    integrity: w.integrity_score,
    verified: w.verified_closures,
    claimed: w.claimed_closures,
  }));

  const categoryChartData = Object.entries(summary.category_distribution || {}).map(([k, v]) => ({
    name: k.replace('_', ' '),
    value: v,
  }));

  const COLORS = ['#14b8a6', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-civic-600 dark:text-civic-400 font-mono text-xs font-bold uppercase tracking-widest mb-1">
          <ShieldCheck className="w-4 h-4" />
          Public Civic Performance Scorecard
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Closure Integrity Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
          A public index measuring whether municipal complaints marked "resolved" were genuinely verified by geotagged evidence, AI vision, and community confirmation.
        </p>
      </div>

      {/* Top Level Metric KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Overall Integrity Score */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Closure Integrity</span>
            <span className="text-[10px] font-mono text-slate-400">n = {summary.claimed_closures}</span>
          </div>
          <div className="text-3xl font-black font-mono text-civic-600 dark:text-civic-400">
            {summary.overall_integrity_score}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {summary.verified_closures} verified of {summary.claimed_closures} claimed
          </div>
        </div>

        {/* Reopen Rate */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Reopen Rate</span>
            <span className="text-[10px] font-mono text-slate-400">n = {summary.total_reports}</span>
          </div>
          <div className="text-3xl font-black font-mono text-purple-600 dark:text-purple-400">
            {summary.reopened_reports}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Reopened by community re-vote
          </div>
        </div>

        {/* Fake Fixes Blocked */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Fake Fixes Blocked</span>
            <span className="text-[10px] font-mono text-slate-400">Pipeline</span>
          </div>
          <div className="text-3xl font-black font-mono text-rose-600 dark:text-rose-400">
            {summary.rejected_closures}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Caught by distance or scene mismatch
          </div>
        </div>

        {/* Median Resolution Time */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Median SLA Time</span>
            <span className="text-[10px] font-mono text-slate-400">Verified</span>
          </div>
          <div className="text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400">
            {summary.median_time_hours}h
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Median hours to verified fix
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ward Leaderboard Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Ward Closure Integrity Leaderboard
              </h3>
              <p className="text-xs text-slate-400">
                Percentage of claimed closures verified with geotagged after-photo proof
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-civic-500">% Verified</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wardChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Integrity Score']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="integrity" radius={[6, 6, 0, 0]}>
                  {wardChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.integrity >= 80 ? '#10b981' : entry.integrity >= 60 ? '#f59e0b' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Defect Distribution
          </h3>
          <p className="text-xs text-slate-400 mb-4">Breakdown across categories</p>

          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] text-slate-500">
            {categoryChartData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="capitalize truncate">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ward Scorecards Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
          Ward Integrity Metric Table
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-mono">
                <th className="pb-3 font-semibold">Ward</th>
                <th className="pb-3 font-semibold">Claimed</th>
                <th className="pb-3 font-semibold">Verified</th>
                <th className="pb-3 font-semibold">Closure Integrity Score</th>
                <th className="pb-3 font-semibold">Reopen Rate</th>
                <th className="pb-3 font-semibold">Sample Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {summary.wards.map((w, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 font-bold text-slate-900 dark:text-white">
                    {w.ward_name}
                  </td>
                  <td className="py-3 font-mono text-slate-600 dark:text-slate-300">
                    {w.claimed_closures}
                  </td>
                  <td className="py-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {w.verified_closures}
                  </td>
                  <td className="py-3">
                    <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                      w.integrity_score >= 80
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : w.integrity_score >= 60
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}>
                      {w.integrity_score.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 font-mono text-slate-600 dark:text-slate-300">
                    {w.reopen_rate.toFixed(1)}%
                  </td>
                  <td className="py-3">
                    {w.sample_size_warning ? (
                      <span className="text-[10px] text-amber-500 flex items-center gap-1 font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        Small sample (n &lt; 5)
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-500 font-medium font-mono">
                        Valid (n = {w.claimed_closures})
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Department Breakdown Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
          Departmental Verification Track Record
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summary.departments.map((dept, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">{dept.department_name}</span>
                <span className="text-[10px] text-slate-400 font-mono">{dept.ward.split('-')[1]?.trim()}</span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Integrity Score</span>
                <span className="font-bold font-mono text-civic-600 dark:text-civic-400">
                  {dept.integrity_score.toFixed(1)}%
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-500">
                <span>Verified / Claimed</span>
                <span className="font-mono">{dept.verified_closures} / {dept.claimed_closures}</span>
              </div>

              <div className="flex items-center justify-between text-slate-500">
                <span>SLA Breaches</span>
                <span className="font-mono text-rose-500">{dept.sla_breaches}</span>
              </div>

              <div className="flex items-center justify-between text-slate-500">
                <span>Duplicates Merged</span>
                <span className="font-mono text-indigo-500">{dept.duplicates_merged}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Metric Definitions Box */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
        <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-civic-500" />
          Integrity Score Methodology & Definitions:
        </div>
        <p>• <strong>Closure Integrity Score:</strong> Ratio of verified resolutions (geotagged &lt;30m + scene match + defect absence) over total claimed resolutions.</p>
        <p>• <strong>Reopen Rate:</strong> Complaints automatically reopened when community consensus records the defect still present.</p>
        <p>• <strong>Sample Size Warning:</strong> Explicitly surfaced when a department or ward has fewer than 5 closure claims to prevent statistical distortion.</p>
      </div>
    </div>
  );
};
