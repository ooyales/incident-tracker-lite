export interface User {
  id: string;
  username: string;
  role: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setAuth: (token: string, user: User) => void;
}

export interface Incident {
  id: string;
  incident_number: string;
  title: string;
  description: string | null;
  severity: string;
  category: string | null;
  status: string;
  reported_at: string;
  detected_at: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  impact_description: string | null;
  users_affected: number | null;
  business_impact: string | null;
  data_breach: number;
  reported_by: string | null;
  assigned_to: string | null;
  resolved_by: string | null;
  resolution_summary: string | null;
  root_cause: string | null;
  workaround: string | null;
  problem_id: string | null;
  wiki_url: string | null;
  post_incident_completed: number;
  lessons_learned: string | null;
  preventive_actions: string | null;
  tags: string;
  timeline_entries?: TimelineEntry[];
  assets?: IncidentAsset[];
  responders?: IncidentResponder[];
  communications?: Communication[];
}

export interface TimelineEntry {
  id: string;
  incident_id: string;
  entry_type: string;
  content: string;
  author: string | null;
  created_at: string;
  old_status: string | null;
  new_status: string | null;
}

export interface IncidentAsset {
  id: string;
  incident_id: string;
  asset_name: string;
  asset_type: string | null;
  impact_type: string | null;
  notes: string | null;
}

export interface IncidentResponder {
  id: string;
  incident_id: string;
  person_name: string;
  role: string | null;
  assigned_at: string;
}

export interface Communication {
  id: string;
  incident_id: string;
  channel: string | null;
  recipient: string | null;
  message: string | null;
  sent_at: string;
  sent_by: string | null;
}

export interface Problem {
  id: string;
  problem_number: string;
  title: string;
  description: string | null;
  root_cause: string | null;
  root_cause_category: string | null;
  permanent_fix: string | null;
  fix_status: string;
  fix_owner: string | null;
  fix_due_date: string | null;
  fix_completed_date: string | null;
  estimated_cost: number | null;
  incident_count: number;
  total_downtime_minutes: number | null;
  known_error: number;
  wiki_url: string | null;
  workaround: string | null;
  priority: string;
  created_at: string;
  updated_at: string;
  incidents?: Incident[];
}

export interface SLATarget {
  id: string;
  severity: string;
  response_target_minutes: number;
  resolution_target_minutes: number;
}

export interface DashboardData {
  active_incidents: number;
  resolved_today: number;
  mttr_hours: number;
  mtta_minutes: number;
  sla_compliance_pct: number;
  incidents_by_severity: Array<{ name: string; value: number; color: string }>;
  incidents_by_status: Array<{ name: string; value: number; color: string }>;
  incidents_by_category: Array<{ name: string; value: number; color: string }>;
  recent_activity: Array<TimelineEntry & { incident_number?: string }>;
  trending_problems: Problem[];
  open_incidents: Incident[];
}
