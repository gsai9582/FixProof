import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { reportApi, Report } from '../api/client';
import { MapComponent } from '../components/MapComponent';
import { StatusBadge } from '../components/StatusBadge';
import {
  MapPin, Filter, Grid, Map as MapIcon, SlidersHorizontal,
  Search, ShieldAlert, ArrowUpRight
} from 'lucide-react';

export const ExploreMapPage: React.FC = () => {
  const { t } = useTranslation();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Filters
  const [category, setCategory] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [ward, setWard] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const data = await reportApi.getReports({
        category: category || undefined,
        status: status || undefined,
        ward: ward || undefined,
      });
      setReports(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [category, status, ward]);

  const filteredReports = reports.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.title.toLowerCase().includes(q) || r.address.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Civic Infrastructure Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse geotagged reports, live verification outcomes, and community-confirmed repairs across Chennai wards.
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              viewMode === 'map'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            Interactive Map
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            Grid List ({filteredReports.length})
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, landmark, street..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
        >
          <option value="">All Categories</option>
          <option value="pothole">{t('categories.pothole', 'Pothole')}</option>
          <option value="garbage">{t('categories.garbage', 'Garbage Dump')}</option>
          <option value="water_leakage">{t('categories.water_leakage', 'Water Leakage')}</option>
          <option value="broken_streetlight">{t('categories.broken_streetlight', 'Broken Streetlight')}</option>
          <option value="drainage">{t('categories.drainage', 'Blocked Drainage')}</option>
          <option value="unsafe_infrastructure">{t('categories.unsafe_infrastructure', 'Unsafe Infrastructure')}</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
        >
          <option value="">All Statuses</option>
          <option value="reported">Reported</option>
          <option value="in_progress">In Progress</option>
          <option value="verified_fixed">Verified Fixed</option>
          <option value="needs_review">Needs Review</option>
          <option value="rejected">Rejected (Fake Fix)</option>
          <option value="reopened">Reopened</option>
        </select>

        <select
          value={ward}
          onChange={(e) => setWard(e.target.value)}
          className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
        >
          <option value="">All Chennai Wards</option>
          <option value="Ward 172 - Adyar">Ward 172 - Adyar</option>
          <option value="Ward 113 - T. Nagar">Ward 113 - T. Nagar</option>
          <option value="Ward 85 - Anna Nagar">Ward 85 - Anna Nagar</option>
        </select>
      </div>

      {/* Main Content Area */}
      {viewMode === 'map' ? (
        <div className="space-y-4">
          <MapComponent reports={filteredReports} height="560px" />
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500">
            <div>
              Showing {filteredReports.length} reports across Chennai. Click any colored pin to inspect proof.
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Pothole</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Garbage</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Water</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Light</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Drainage</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((rep) => (
            <Link
              key={rep.id}
              to={`/reports/${rep.id}`}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs hover:border-civic-500 transition group block"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  {rep.category.replace('_', ' ')}
                </span>
                <StatusBadge status={rep.status} size="sm" />
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-civic-600 dark:group-hover:text-civic-400 transition mb-1 line-clamp-1">
                {rep.title}
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                {rep.description}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="font-mono font-bold text-civic-600 dark:text-civic-400">
                  Priority: {rep.priority_score.toFixed(0)}
                </span>
                <span className="text-[11px] text-slate-400">
                  {rep.ward.split('-')[1]?.trim()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
