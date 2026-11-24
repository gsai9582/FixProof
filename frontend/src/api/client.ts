export interface User {
  id: number;
  name: string;
  email: string;
  role: 'citizen' | 'officer' | 'admin';
  language: string;
  created_at: string;
}

export interface Media {
  id: number;
  type: 'before' | 'after';
  path: string;
  phash?: string;
  exif_gps_lat?: number;
  exif_gps_lng?: number;
  taken_at?: string;
  created_at: string;
}

export interface Verification {
  id: number;
  resolution_id: number;
  report_id: number;
  geo_pass: boolean;
  geo_distance_meters: number;
  time_pass: boolean;
  time_delta_seconds: number;
  scene_pass: boolean;
  scene_similarity_score: number;
  defect_fixed: boolean;
  confidence: number;
  verdict: 'verified_fix' | 'needs_review' | 'rejected';
  reasons: string[];
  mode: 'ai' | 'basic';
  admin_override: boolean;
  admin_notes?: string;
  created_at: string;
}

export interface Resolution {
  id: number;
  report_id: number;
  officer_id: number;
  officer_name?: string;
  note: string;
  claimed_at: string;
  after_media?: Media;
  verification?: Verification;
}

export interface PriorityBreakdown {
  severity_score: number;
  exposure_score: number;
  corroboration_score: number;
  ageing_score: number;
  final_score: number;
  explanation: string[];
}

export interface StatusEvent {
  id: number;
  from_status: string;
  to_status: string;
  actor_id?: number;
  actor_role: string;
  notes?: string;
  created_at: string;
}

export interface Report {
  id: number;
  category: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  address: string;
  ward: string;
  status: 'reported' | 'in_progress' | 'claimed_resolved' | 'verified_fixed' | 'needs_review' | 'rejected' | 'reopened';
  severity: number;
  priority_score: number;
  priority_breakdown?: PriorityBreakdown;
  cluster_id?: string;
  language: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  reporter_display_name: string;
  supports_count: number;
  user_has_supported: boolean;
  media: Media[];
  latest_resolution?: Resolution;
  confirmations_summary: { fixed: number; not_fixed: number };
  status_events: StatusEvent[];
}

export interface ReportAnalyzeResponse {
  suggested_category: string;
  suggested_title: string;
  suggested_description: string;
  suggested_severity: number;
  hazard_cues: string[];
  confidence: number;
  mode: 'ai' | 'basic';
  blur_score: number;
  is_usable: boolean;
}

export interface DuplicateCheckItem {
  id: number;
  title: string;
  category: string;
  distance_meters: number;
  created_at: string;
  status: string;
  supports_count: number;
}

export interface DuplicateCheckResponse {
  has_duplicates: boolean;
  cluster_id?: string;
  nearby_reports: DuplicateCheckItem[];
}

export interface DepartmentScore {
  department_name: string;
  ward: string;
  claimed_closures: number;
  verified_closures: number;
  integrity_score: number;
  reopen_rate: number;
  median_resolution_hours: number;
  sla_breaches: number;
  duplicates_merged: number;
  sample_size_warning: boolean;
}

export interface WardScore {
  ward_name: string;
  claimed_closures: number;
  verified_closures: number;
  integrity_score: number;
  reopen_rate: number;
  active_reports: number;
  sample_size_warning: boolean;
}

export interface AnalyticsSummary {
  total_reports: number;
  active_reports: number;
  claimed_closures: number;
  verified_closures: number;
  rejected_closures: number;
  reopened_reports: number;
  overall_integrity_score: number;
  median_time_hours: number;
  category_distribution: Record<string, number>;
  status_distribution: Record<string, number>;
  wards: WardScore[];
  departments: DepartmentScore[];
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getAuthHeaders(isMultipart = false): HeadersInit {
  const token = localStorage.getItem('fixproof_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const isMultipart = options.body instanceof FormData;
  
  const headers = {
    ...getAuthHeaders(isMultipart),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    let errorDetail = 'API Request Failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      errorDetail = `${response.status} ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

// Auth APIs
export const authApi = {
  login: (data: any) => apiRequest<{ access_token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  register: (data: any) => apiRequest<{ access_token: string; user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getMe: () => apiRequest<User>('/auth/me'),
};

// Report APIs
export const reportApi = {
  analyze: (formData: FormData) => apiRequest<ReportAnalyzeResponse>('/reports/analyze', {
    method: 'POST',
    body: formData,
  }),
  checkDuplicates: (lat: number, lng: number, category: string, phash?: string) => {
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng), category });
    if (phash) params.append('phash', phash);
    return apiRequest<DuplicateCheckResponse>(`/reports/check-duplicates?${params}`);
  },
  create: (formData: FormData) => apiRequest<Report>('/reports', {
    method: 'POST',
    body: formData,
  }),
  getReports: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
    });
    return apiRequest<Report[]>(`/reports?${q}`);
  },
  getReport: (id: number) => apiRequest<Report>(`/reports/${id}`),
  support: (id: number) => apiRequest<Report>(`/reports/${id}/support`, {
    method: 'POST',
  }),
  confirm: (id: number, answer: 'fixed' | 'not_fixed', note?: string) => apiRequest<Report>(`/reports/${id}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ answer, note }),
  }),
};

// Officer APIs
export const officerApi = {
  getQueue: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
    });
    return apiRequest<Report[]>(`/officer/queue?${q}`);
  },
  resolve: (reportId: number, formData: FormData) => apiRequest<Report>(`/officer/reports/${reportId}/resolve`, {
    method: 'POST',
    body: formData,
  }),
};

// Verification Supervision APIs
export const verificationApi = {
  getPending: () => apiRequest<Report[]>('/verification/pending'),
  override: (verificationId: number, verdict: 'verified_fix' | 'rejected', notes: string) => apiRequest<Report>(`/verification/${verificationId}/override`, {
    method: 'POST',
    body: JSON.stringify({ verdict, notes }),
  }),
};

// Accountability APIs
export const accountabilityApi = {
  getSummary: () => apiRequest<AnalyticsSummary>('/accountability/summary'),
  getDepartments: () => apiRequest<DepartmentScore[]>('/accountability/departments'),
  getWards: () => apiRequest<WardScore[]>('/accountability/wards'),
};

export const healthApi = {
  getHealth: () => fetch('http://localhost:8000/health').then(r => r.json()),
};
