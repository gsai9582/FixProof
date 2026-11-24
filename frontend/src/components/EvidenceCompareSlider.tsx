import React, { useState } from 'react';
import { SlidersHorizontal, Eye } from 'lucide-react';

interface Props {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export const EvidenceCompareSlider: React.FC<Props> = ({
  beforeUrl,
  afterUrl,
  beforeLabel = "BEFORE: Complaint Evidence",
  afterLabel = "AFTER: Resolution Evidence"
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');

  const backendHost = 'http://localhost:8000';
  const fullBefore = beforeUrl.startsWith('http') ? beforeUrl : `${backendHost}${beforeUrl}`;
  const fullAfter = afterUrl.startsWith('http') ? afterUrl : `${backendHost}${afterUrl}`;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Eye className="w-4 h-4 text-civic-500" />
          Evidence Comparison (Before vs After)
        </h4>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setViewMode('slider')}
            className={`px-2 py-1 rounded-md font-medium transition ${
              viewMode === 'slider'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Split Slider
          </button>
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`px-2 py-1 rounded-md font-medium transition ${
              viewMode === 'side-by-side'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Side by Side
          </button>
        </div>
      </div>

      {viewMode === 'slider' ? (
        <div className="relative w-full h-72 sm:h-96 rounded-lg overflow-hidden select-none border border-slate-200 dark:border-slate-800 bg-slate-950">
          {/* After image (background layer) */}
          <img
            src={fullAfter}
            alt="After resolution"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur text-emerald-400 border border-emerald-500/30 text-[11px] font-mono px-2 py-0.5 rounded shadow">
            {afterLabel}
          </div>

          {/* Before image (clipped overlay) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPos}%` }}
          >
            <img
              src={fullBefore}
              alt="Before complaint"
              className="absolute inset-0 w-full h-full object-cover max-w-none"
              style={{ width: '100%', height: '100%', minWidth: '100%' }}
            />
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur text-rose-400 border border-rose-500/30 text-[11px] font-mono px-2 py-0.5 rounded shadow">
              {beforeLabel}
            </div>
          </div>

          {/* Split Divider Handle */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-2xl"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white dark:bg-slate-900 border-2 border-civic-500 rounded-full flex items-center justify-center shadow-lg">
              <SlidersHorizontal className="w-4 h-4 text-civic-600 dark:text-civic-400" />
            </div>
          </div>

          {/* Interactive Range Input Overlay */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider">{beforeLabel}</span>
            <div className="h-64 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950">
              <img src={fullBefore} alt="Before" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">{afterLabel}</span>
            <div className="h-64 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950">
              <img src={fullAfter} alt="After" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      )}

      <div className="mt-2 text-center text-[11px] text-slate-400">
        Drag slider left/right to compare defect scene before and after repair.
      </div>
    </div>
  );
};
