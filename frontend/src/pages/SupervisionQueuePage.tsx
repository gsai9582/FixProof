import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { verificationApi, Report } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { VerdictCard } from '../components/VerdictCard';
import {
  AlertOctagon, CheckCircle2, XCircle, ArrowRight, ShieldCheck, MapPin
} from 'lucide-react';

export const SupervisionQueuePage: React.FC = () => {
  const { user, quickLogin } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [overrideNotes, setOverrideNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPending = async () => {
    setIsLoading(true);
    try {
      const data = await verificationApi.getPending();
      setReports(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [user]);

  const handleOverride = async (verdict: 'verified_fix' | 'rejected') => {
    if (!selectedReport?.latest_resolution?.verification) return;
    setIsSubmitting(true);
    try {
      await verificationApi.override(
        selectedReport.latest_resolution.verification.id,
        verdict,
        overrideNotes || 'Administrative review completed.'
      );
      setSelectedReport(null);
      setOverrideNotes('');
      fetchPending();
    } catch (err: any) {
      alert(err.message || 'Override failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <AlertOctagon className="w-6 h-6 text-amber-500" />
            Supervisor Verification Review Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cases flagged as "Needs Review" by the Closure Verification Engine requiring human inspection.
          </p>
        </div>

        {user?.role !== 'admin' && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs flex items-center gap-2">
            <span className="text-amber-600 dark:text-amber-400">Sign in as Zonal Admin to review:</span>
            <button
              onClick={() => quickLogin('admin')}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-semibold"
            >
              Switch to Admin
            </button>
          </div>
        )}
      </div>

      {reports.length === 0 && !isLoading && (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Supervisor Queue is Clear</h3>
          <p className="text-xs text-slate-400 mt-1">All closure claims have either been auto-verified or rejected.</p>
        </div>
      )}

      <div className="space-y-4">
        {reports.map((rep) => (
          <div
            key={rep.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {rep.category.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400 ml-2">Ticket #{rep.id}</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {rep.title}
                </h3>
              </div>
              <Link
                to={`/reports/${rep.id}`}
                className="text-xs font-semibold text-civic-600 dark:text-civic-400 hover:underline flex items-center gap-1"
              >
                Inspect Full Detail &rarr;
              </Link>
            </div>

            {/* Verdict Card */}
            {rep.latest_resolution?.verification && (
              <VerdictCard verification={rep.latest_resolution.verification} />
            )}

            {/* Action Bar */}
            {user?.role === 'admin' && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Supervisor review reasoning notes..."
                  value={selectedReport?.id === rep.id ? overrideNotes : ''}
                  onChange={(e) => {
                    setSelectedReport(rep);
                    setOverrideNotes(e.target.value);
                  }}
                  className="flex-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                />
                <button
                  onClick={() => {
                    setSelectedReport(rep);
                    handleOverride('verified_fix');
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition"
                >
                  Approve as Verified Fix
                </button>
                <button
                  onClick={() => {
                    setSelectedReport(rep);
                    handleOverride('rejected');
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition"
                >
                  Reject Resolution Claim
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
