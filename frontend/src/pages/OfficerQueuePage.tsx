import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { officerApi, Report } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import {
  ClipboardList, CheckCircle2, AlertTriangle, Clock, MapPin,
  Camera, Upload, ArrowRight, ShieldCheck, X, FileText
} from 'lucide-react';

export const OfficerQueuePage: React.FC = () => {
  const { user, quickLogin } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [wardFilter, setWardFilter] = useState('');

  // Resolution Modal State
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<File | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [afterLat, setAfterLat] = useState<number>(0);
  const [afterLng, setAfterLng] = useState<number>(0);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const data = await officerApi.getQueue({
        ward: wardFilter || undefined,
      });
      setReports(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [wardFilter, user]);

  const openResolveModal = (rep: Report) => {
    setActiveReport(rep);
    setResolutionNote('');
    setAfterPhoto(null);
    setAfterPreview(null);
    setResolveError(null);
    // Default after coordinates to report site coordinates with tiny offset
    setAfterLat(rep.lat + 0.00005);
    setAfterLng(rep.lng + 0.00004);
  };

  const handleAfterPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAfterPhoto(file);
      setAfterPreview(URL.createObjectURL(file));
    }
  };

  const submitResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReport || !afterPhoto) {
      setResolveError('After-photo evidence is required to prove resolution.');
      return;
    }

    setIsResolving(true);
    setResolveError(null);

    try {
      const fd = new FormData();
      fd.append('after_image', afterPhoto);
      fd.append('note', resolutionNote || 'Defect resolved following municipal repair protocols.');
      fd.append('after_lat', String(afterLat));
      fd.append('after_lng', String(afterLng));

      const updated = await officerApi.resolve(activeReport.id, fd);
      setActiveReport(null);
      navigate(`/reports/${updated.id}`);
    } catch (err: any) {
      setResolveError(err.message || 'Resolution failed');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Field Officer Resolution Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ranked by multi-factor explainable Priority Score. To close a ticket, upload an in-app geotagged after-photo.
          </p>
        </div>

        {user?.role !== 'officer' && user?.role !== 'admin' && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs flex items-center gap-2">
            <span className="text-amber-600 dark:text-amber-400">Viewing as guest. Sign in as Field Officer to resolve tickets:</span>
            <button
              onClick={() => quickLogin('officer')}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-semibold"
            >
              Switch to Officer
            </button>
          </div>
        )}
      </div>

      {/* Filter toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Ward Filter:</span>
          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
          >
            <option value="">All Chennai Wards</option>
            <option value="Ward 172 - Adyar">Ward 172 - Adyar</option>
            <option value="Ward 113 - T. Nagar">Ward 113 - T. Nagar</option>
            <option value="Ward 85 - Anna Nagar">Ward 85 - Anna Nagar</option>
          </select>
        </div>

        <div className="text-xs font-mono text-slate-400">
          {reports.length} Active Complaints in Queue
        </div>
      </div>

      {/* Ranked Queue Cards */}
      <div className="space-y-3">
        {reports.map((rep, idx) => (
          <div
            key={rep.id}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-xs font-bold flex items-center justify-center">
                  #{idx + 1}
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {rep.category.replace('_', ' ')}
                </span>
                <StatusBadge status={rep.status} size="sm" />
                {rep.is_demo && (
                  <span className="text-[10px] text-amber-500 font-mono">Demo Case</span>
                )}
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {rep.title}
              </h3>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-civic-500" />
                  {rep.address}
                </span>
                <span>•</span>
                <span>{rep.ward}</span>
                <span>•</span>
                <span>Severity {rep.severity}/5</span>
              </div>
            </div>

            {/* Score & Action Button */}
            <div className="flex items-center gap-4 self-end md:self-center">
              <div className="text-right">
                <div className="text-xs text-slate-400">Priority Score</div>
                <div className="text-xl font-bold font-mono text-civic-600 dark:text-civic-400">
                  {rep.priority_score.toFixed(1)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/reports/${rep.id}`}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition"
                >
                  View Detail
                </Link>

                <button
                  onClick={() => openResolveModal(rep)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-civic-600 hover:bg-civic-700 shadow-xs flex items-center gap-1.5 transition"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Resolve with Proof
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resolve & Prove Modal */}
      {activeReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-civic-600 dark:text-civic-400">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Resolve Ticket #{activeReport.id} with Proof
                </h3>
              </div>
              <button
                onClick={() => setActiveReport(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resolveError && (
              <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
                {resolveError}
              </div>
            )}

            <form onSubmit={submitResolution} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  1. Capture / Upload After-Photo Evidence (Mandatory)
                </label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAfterPhotoChange}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-civic-50 file:text-civic-700 hover:file:bg-civic-100"
                  />
                  {afterPreview && (
                    <div className="mt-3 h-40 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img src={afterPreview} alt="After" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  2. Contractor Work Notes
                </label>
                <textarea
                  rows={2}
                  required
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Detail repair materials, excavation depth, compaction, or waste tonnage cleared..."
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                />
              </div>

              {/* Geotag Coordinates Simulation for Live Demo */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>3. Verification Geolocation Coordinates:</span>
                  <span className="text-[10px] text-slate-400">Original site: {activeReport.lat}, {activeReport.lng}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500">Latitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={afterLat}
                      onChange={(e) => setAfterLat(Number(e.target.value))}
                      className="w-full p-1.5 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Longitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={afterLng}
                      onChange={(e) => setAfterLng(Number(e.target.value))}
                      className="w-full p-1.5 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>
                </div>

                {/* Preset shortcuts for Hackathon Demo */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-slate-400">Demo Simulation:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAfterLat(activeReport.lat + 0.00005);
                      setAfterLng(activeReport.lng + 0.00004);
                    }}
                    className="text-[10px] text-emerald-600 hover:underline font-medium"
                  >
                    [Valid: ~7m away]
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAfterLat(13.0550);
                      setAfterLng(80.2820);
                    }}
                    className="text-[10px] text-rose-600 hover:underline font-medium"
                  >
                    [Fake: Marina Beach 4.2km away]
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveReport(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResolving}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-civic-600 hover:bg-civic-700 shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {isResolving ? 'Running Verification Pipeline...' : 'Submit & Trigger Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
