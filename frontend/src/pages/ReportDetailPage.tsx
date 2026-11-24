import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { reportApi, verificationApi, Report } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityGauge } from '../components/PriorityGauge';
import { VerdictCard } from '../components/VerdictCard';
import { EvidenceCompareSlider } from '../components/EvidenceCompareSlider';
import { MapComponent } from '../components/MapComponent';
import {
  MapPin, Calendar, Heart, MessageSquare, CheckCircle, XCircle,
  AlertTriangle, RotateCcw, Clock, ShieldCheck, UserCheck, ArrowLeft, Send
} from 'lucide-react';

export const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Community confirmation voting state
  const [voteNote, setVoteNote] = useState('');
  const [isVoting, setIsVoting] = useState(false);

  // Admin override state
  const [overrideNotes, setOverrideNotes] = useState('');
  const [isOverriding, setIsOverriding] = useState(false);

  const fetchReport = async () => {
    if (!id) return;
    try {
      const data = await reportApi.getReport(Number(id));
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Report not found');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  const handleSupport = async () => {
    if (!report) return;
    try {
      const updated = await reportApi.support(report.id);
      setReport(updated);
    } catch (err: any) {
      alert(err.message || 'Support action failed. Please sign in.');
    }
  };

  const handleCommunityVote = async (answer: 'fixed' | 'not_fixed') => {
    if (!report) return;
    setIsVoting(true);
    try {
      const updated = await reportApi.confirm(report.id, answer, voteNote);
      setReport(updated);
      setVoteNote('');
    } catch (err: any) {
      alert(err.message || 'Vote failed. Please sign in.');
    } finally {
      setIsVoting(false);
    }
  };

  const handleAdminOverride = async (verdict: 'verified_fix' | 'rejected') => {
    if (!report?.latest_resolution?.verification) return;
    setIsOverriding(true);
    try {
      const updated = await verificationApi.override(
        report.latest_resolution.verification.id,
        verdict,
        overrideNotes || 'Manual administrative review override.'
      );
      setReport(updated);
      setOverrideNotes('');
    } catch (err: any) {
      alert(err.message || 'Override failed');
    } finally {
      setIsOverriding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-4 border-civic-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <div className="text-xs text-slate-500">Loading civic verification record...</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Report Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">{error || 'Invalid report identifier'}</p>
        <Link to="/map" className="text-xs font-semibold text-civic-600 hover:underline">
          &larr; Back to Civic Map
        </Link>
      </div>
    );
  }

  const beforeMedia = report.media.find((m) => m.type === 'before');
  const afterMedia = report.latest_resolution?.after_media || report.media.find((m) => m.type === 'after');
  const verification = report.latest_resolution?.verification;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/map"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Civic Map
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
              {report.category.replace('_', ' ')}
            </span>
            <span className="text-xs text-slate-400">ID #{report.id}</span>
            {report.is_demo && (
              <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono px-2 py-0.5 rounded border border-amber-500/20">
                Demo Case
              </span>
            )}
          </div>
          <StatusBadge status={report.status} size="lg" />
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
          {report.title}
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          {report.description}
        </p>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-civic-500" />
            {report.address} ({report.ward})
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(report.created_at).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" />
            Reported by {report.reporter_display_name}
          </span>
          <button
            onClick={handleSupport}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium text-xs transition ${
              report.user_has_supported
                ? 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-rose-500'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${report.user_has_supported ? 'fill-rose-500 text-rose-500' : ''}`} />
            {report.supports_count} Citizen Support(s)
          </button>
        </div>
      </div>

      {/* Centerpiece: Verification Verdict Card if resolution exists */}
      {verification && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-civic-500" />
            Proof of Resolution (Integrity Check)
          </h2>
          <VerdictCard verification={verification} />
        </div>
      )}

      {/* Visual Evidence Compare Slider (Before vs After) */}
      {beforeMedia && afterMedia && (
        <EvidenceCompareSlider
          beforeUrl={beforeMedia.path}
          afterUrl={afterMedia.path}
          beforeLabel="BEFORE: Reported Defect"
          afterLabel="AFTER: Claimed Repair Photo"
        />
      )}

      {/* If only before photo exists */}
      {beforeMedia && !afterMedia && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Citizen Submitted Evidence Photo
          </h3>
          <div className="h-72 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center">
            <img
              src={`http://localhost:8000${beforeMedia.path}`}
              alt="Before"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Grid: Explainable Priority + Geolocation Map */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
            Explainable Priority Urgency
          </h2>
          <PriorityGauge
            score={report.priority_score}
            breakdown={report.priority_breakdown}
            showDetailsDefault={true}
          />
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
            Reported Defect Location
          </h2>
          <MapComponent
            center={[report.lat, report.lng]}
            zoom={15}
            height="260px"
            reports={[report]}
          />
        </div>
      </div>

      {/* Community Confirmation 72h Window */}
      {(report.status === 'claimed_resolved' || report.status === 'verified_fixed' || report.status === 'needs_review' || report.status === 'reopened') && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-civic-500" />
                Community Re-Verification (72-Hour Window)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Authorities claimed this issue is fixed. As a nearby citizen, verify the physical site:
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Votes: <span className="text-emerald-500 font-bold">{report.confirmations_summary.fixed} Fixed</span> •{' '}
              <span className="text-rose-500 font-bold">{report.confirmations_summary.not_fixed} Defective</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <input
              type="text"
              placeholder="Optional comment on repair quality..."
              value={voteNote}
              onChange={(e) => setVoteNote(e.target.value)}
              className="flex-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
            />
            <button
              onClick={() => handleCommunityVote('fixed')}
              disabled={isVoting}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {t('confirm.yes', 'Yes, It is Fixed')}
            </button>
            <button
              onClick={() => handleCommunityVote('not_fixed')}
              disabled={isVoting}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              {t('confirm.no', 'No, Defect Remains')}
            </button>
          </div>
        </div>
      )}

      {/* Admin Supervisor Review Queue if Needs Review */}
      {user?.role === 'admin' && report.status === 'needs_review' && verification && (
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" />
            Supervisor Verification Decision Required
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
            Closure verification flagged moderate confidence. As Zonal Administrator, inspect before/after alignment and issue final verdict:
          </p>

          <input
            type="text"
            placeholder="Official supervisor review notes / reason for override..."
            value={overrideNotes}
            onChange={(e) => setOverrideNotes(e.target.value)}
            className="w-full text-xs rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white mb-3"
          />

          <div className="flex gap-2">
            <button
              onClick={() => handleAdminOverride('verified_fix')}
              disabled={isOverriding}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition"
            >
              Confirm Verified Fix
            </button>
            <button
              onClick={() => handleAdminOverride('rejected')}
              disabled={isOverriding}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition"
            >
              Reject Fix & Return to Queue
            </button>
          </div>
        </div>
      )}

      {/* Status Events History Timeline */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-civic-500" />
          Audit Trail & Status Timeline
        </h3>

        <div className="space-y-4">
          {report.status_events.map((evt, idx) => (
            <div key={evt.id || idx} className="flex gap-3 text-xs">
              <div className="w-2 h-2 rounded-full bg-civic-500 mt-1.5 shrink-0" />
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Status changed: <span className="uppercase text-slate-500">{evt.from_status}</span> &rarr;{' '}
                  <span className="uppercase text-civic-600 dark:text-civic-400 font-bold">{evt.to_status}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  by {evt.actor_role} • {new Date(evt.created_at).toLocaleString()}
                </div>
                {evt.notes && (
                  <div className="text-slate-600 dark:text-slate-400 text-[11px] mt-1 bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
                    {evt.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
