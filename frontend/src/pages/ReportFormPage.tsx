import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { reportApi, DuplicateCheckItem } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { MapComponent } from '../components/MapComponent';
import {
  Camera, Upload, Mic, MicOff, Sparkles, AlertCircle, Shield,
  MapPin, Check, ArrowRight, RefreshCw, AlertTriangle, Layers
} from 'lucide-react';

export const ReportFormPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('pothole');
  const [severity, setSeverity] = useState<number>(3);
  const [ward, setWard] = useState('Ward 172 - Adyar');
  const [address, setAddress] = useState('Lattice Bridge Road, Adyar');
  const [lat, setLat] = useState<number>(13.0068);
  const [lng, setLng] = useState<number>(80.2565);

  // AI & Voice State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  // Duplicate Detection State
  const [duplicateItems, setDuplicateItems] = useState<DuplicateCheckItem[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [clusterId, setClusterId] = useState<string | undefined>(undefined);

  // Submit status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check speech recognition support
  useEffect(() => {
    const Speech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (Speech) setVoiceSupported(true);

    // Auto-detect browser geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
        },
        () => {
          // Default to Chennai Adyar if blocked
          setLat(13.0068);
          setLng(80.2565);
        }
      );
    }
  }, []);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
    }
  };

  const runIntakeAnalysis = async () => {
    if (!photo) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      const fd = new FormData();
      fd.append('image', photo);
      if (category) fd.append('user_category', category);
      if (description) fd.append('user_text', description);

      const res = await reportApi.analyze(fd);
      setAnalysisResult(res);
      setCategory(res.suggested_category);
      setTitle(res.suggested_title);
      setDescription(res.suggested_description);
      setSeverity(res.suggested_severity);
    } catch (err: any) {
      setErrorMsg(err.message || 'AI intake analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleVoiceRecording = () => {
    const Speech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Speech) return;

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new Speech();
    recognition.lang = i18n.language === 'ta' ? 'ta-IN' : i18n.language === 'hi' ? 'hi-IN' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.start();
  };

  const handlePreSubmitCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photo) {
      setErrorMsg('Please upload or capture a photo of the defect');
      return;
    }

    setErrorMsg(null);

    // Run spatial duplicate check
    try {
      const dup = await reportApi.checkDuplicates(lat, lng, category);
      if (dup.has_duplicates && dup.nearby_reports.length > 0) {
        setDuplicateItems(dup.nearby_reports);
        setClusterId(dup.cluster_id);
        setShowDuplicateModal(true);
        return;
      }
    } catch {
      // Proceed if duplicate check encounters network issue
    }

    await submitReport();
  };

  const submitReport = async (overrideDup = false) => {
    if (!photo) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const fd = new FormData();
      fd.append('image', photo);
      fd.append('title', title || `Reported ${category}`);
      fd.append('description', description || 'Civic infrastructure defect requiring attention.');
      fd.append('category', category);
      fd.append('lat', String(lat));
      fd.append('lng', String(lng));
      fd.append('address', address);
      fd.append('ward', ward);
      fd.append('severity', String(severity));
      fd.append('language', i18n.language);
      if (clusterId) fd.append('cluster_id', clusterId);
      fd.append('override_duplicate', String(overrideDup));

      const created = await reportApi.create(fd);
      navigate(`/reports/${created.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit report. Please log in first.');
    } finally {
      setIsSubmitting(false);
      setShowDuplicateModal(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Report Civic Defect
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Upload photo evidence. AI auto-extracts severity, verifies location, and detects existing duplicates.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handlePreSubmitCheck} className="space-y-6">
        {/* Step 1: Evidence Photo Capture */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Camera className="w-4 h-4 text-civic-500" />
            1. Photo Evidence (Mandatory)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-civic-500 transition flex flex-col items-center justify-center min-h-[200px]">
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <label className="cursor-pointer">
                <span className="px-3.5 py-1.5 rounded-lg bg-civic-600 hover:bg-civic-700 text-white text-xs font-semibold shadow-xs">
                  Choose Photo / Camera
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-400 mt-2">
                Supports JPG, PNG with camera EXIF GPS
              </p>
            </div>

            {/* Preview Box */}
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 flex flex-col items-center justify-center min-h-[200px] relative">
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover max-h-56" />
                  <button
                    type="button"
                    onClick={runIntakeAnalysis}
                    disabled={isAnalyzing}
                    className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 backdrop-blur"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isAnalyzing ? 'Analyzing Image...' : 'AI Auto-Classify'}
                  </button>
                </>
              ) : (
                <div className="text-center p-4 text-slate-500 text-xs">
                  Photo preview will appear here
                </div>
              )}
            </div>
          </div>

          {/* AI Intake Badge */}
          {analysisResult && (
            <div className="mt-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Intake Classification Mode: {analysisResult.mode === 'ai' ? 'Vision AI (Gemini)' : 'Basic Heuristic'}
                </span>
                <span className="font-mono text-slate-500 text-[11px]">
                  Confidence: {(analysisResult.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="text-slate-600 dark:text-slate-300 text-[11px]">
                {analysisResult.hazard_cues?.join(' • ')}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Category & Description */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-civic-500" />
            2. Defect Classification & Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
              >
                <option value="pothole">{t('categories.pothole', 'Pothole')}</option>
                <option value="garbage">{t('categories.garbage', 'Garbage Dump')}</option>
                <option value="water_leakage">{t('categories.water_leakage', 'Water Leakage')}</option>
                <option value="broken_streetlight">{t('categories.broken_streetlight', 'Broken Streetlight')}</option>
                <option value="drainage">{t('categories.drainage', 'Blocked Drainage')}</option>
                <option value="unsafe_infrastructure">{t('categories.unsafe_infrastructure', 'Unsafe Infrastructure')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Physical Severity (1 to 5)
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={severity}
                onChange={(e) => setSeverity(Number(e.target.value))}
                className="w-full cursor-pointer accent-civic-600 mt-2"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>1 - Minor</span>
                <span className="font-bold text-civic-600 font-mono">Level {severity}</span>
                <span>5 - Critical Emergency</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Issue Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hazardous deep pothole near school crossing"
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Description
              </label>
              {voiceSupported && (
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  className={`text-xs px-2.5 py-1 rounded-md flex items-center gap-1 font-medium transition ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-civic-500'
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  {isListening ? 'Listening (Speak now)...' : 'Voice Input (Tamil/Hindi/English)'}
                </button>
              )}
            </div>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe physical dimensions, water depth, traffic impediment or safety hazards..."
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Step 3: Geolocation & Map */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-civic-500" />
              3. Location & Ward
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              GPS: {lat.toFixed(5)}, {lng.toFixed(5)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ward
              </label>
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
              >
                <option value="Ward 172 - Adyar">Ward 172 - Adyar</option>
                <option value="Ward 113 - T. Nagar">Ward 113 - T. Nagar</option>
                <option value="Ward 85 - Anna Nagar">Ward 85 - Anna Nagar</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Street Address / Landmark
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Interactive Leaflet Pin Drag */}
          <div>
            <div className="text-[11px] text-slate-500 mb-2">
              📍 Drag the green marker or click on the map to pinpoint the exact defect location:
            </div>
            <MapComponent
              center={[lat, lng]}
              zoom={15}
              height="280px"
              draggablePin={true}
              pinPosition={[lat, lng]}
              onPinChange={(newLat, newLng) => {
                setLat(newLat);
                setLng(newLng);
              }}
            />
          </div>
        </div>

        {/* Privacy Shield Notice */}
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-civic-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Privacy Safeguard:</span> EXIF metadata (camera serial, hardware tags) is automatically stripped from publicly displayed photos. Your name is anonymized to "Citizen" on public boards.
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl bg-civic-600 hover:bg-civic-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Verifying & Submitting...' : 'Submit Geotagged Report'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Duplicate Alert Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Nearby Duplicate Detected!
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Our spatial index found <strong>{duplicateItems.length} active report(s)</strong> within 50 meters of your coordinates. Merging increases the priority score rather than creating fragmented tickets.
            </p>

            <div className="space-y-2 mb-5 max-h-48 overflow-y-auto pr-1">
              {duplicateItems.map((item) => (
                <div key={item.id} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{item.title}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-1">
                    <span>{item.distance_meters.toFixed(0)}m away</span>
                    <span>•</span>
                    <span>{item.supports_count} supporter(s)</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                type="button"
                onClick={() => submitReport(false)}
                className="px-4 py-2 rounded-lg bg-civic-600 hover:bg-civic-700 text-white font-semibold text-xs transition"
              >
                Merge with Cluster & Boost Priority
              </button>
              <button
                type="button"
                onClick={() => submitReport(true)}
                className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-300 transition"
              >
                Submit as Separate Issue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
