import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Shield,
  ChevronDown,
  ChevronUp,
  Bug,
  BarChart3,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { fetchDashboard } from '@/api/dashboard';
import type { DashboardData, Incident, Problem, TimelineEntry } from '@/types';

function severityBorderColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical': return 'border-l-red-500';
    case 'high': return 'border-l-orange-500';
    case 'medium': return 'border-l-blue-500';
    case 'low': return 'border-l-gray-400';
    default: return 'border-l-gray-300';
  }
}

function severityBadge(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical': return 'badge-danger';
    case 'high': return 'badge-warning';
    case 'medium': return 'badge-info';
    case 'low': return 'badge-muted';
    default: return 'badge-muted';
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Mock data for when backend is not available
const mockDashboard: DashboardData = {
  active_incidents: 7,
  resolved_today: 3,
  mttr_hours: 4.2,
  mtta_minutes: 12,
  sla_compliance_pct: 87,
  incidents_by_severity: [
    { name: 'Critical', value: 2, color: '#d9534f' },
    { name: 'High', value: 3, color: '#f0ad4e' },
    { name: 'Medium', value: 5, color: '#5bc0de' },
    { name: 'Low', value: 4, color: '#777' },
  ],
  incidents_by_status: [
    { name: 'Open', value: 3, color: '#d9534f' },
    { name: 'Investigating', value: 2, color: '#f0ad4e' },
    { name: 'Identified', value: 1, color: '#5bc0de' },
    { name: 'Resolved', value: 5, color: '#5cb85c' },
    { name: 'Closed', value: 3, color: '#777' },
  ],
  incidents_by_category: [
    { name: 'Infrastructure', value: 5, color: '#337ab7' },
    { name: 'Application', value: 4, color: '#5cb85c' },
    { name: 'Security', value: 3, color: '#d9534f' },
    { name: 'Network', value: 2, color: '#f0ad4e' },
    { name: 'Database', value: 1, color: '#5bc0de' },
  ],
  recent_activity: [
    { id: '1', incident_id: 'inc-1', entry_type: 'status_change', content: 'Status changed from Open to Investigating', author: 'admin', created_at: new Date(Date.now() - 300000).toISOString(), old_status: 'open', new_status: 'investigating', incident_number: 'INC-001' },
    { id: '2', incident_id: 'inc-2', entry_type: 'note', content: 'Identified root cause as memory leak in auth service', author: 'john.doe', created_at: new Date(Date.now() - 900000).toISOString(), old_status: null, new_status: null, incident_number: 'INC-002' },
    { id: '3', incident_id: 'inc-3', entry_type: 'assignment', content: 'Assigned to jane.smith for investigation', author: 'admin', created_at: new Date(Date.now() - 1800000).toISOString(), old_status: null, new_status: null, incident_number: 'INC-003' },
    { id: '4', incident_id: 'inc-1', entry_type: 'status_change', content: 'Status changed from Investigating to Identified', author: 'admin', created_at: new Date(Date.now() - 3600000).toISOString(), old_status: 'investigating', new_status: 'identified', incident_number: 'INC-001' },
    { id: '5', incident_id: 'inc-4', entry_type: 'note', content: 'Database failover completed successfully', author: 'dba_team', created_at: new Date(Date.now() - 7200000).toISOString(), old_status: null, new_status: null, incident_number: 'INC-004' },
    { id: '6', incident_id: 'inc-2', entry_type: 'communication', content: 'Stakeholders notified of ETA for resolution', author: 'admin', created_at: new Date(Date.now() - 10800000).toISOString(), old_status: null, new_status: null, incident_number: 'INC-002' },
    { id: '7', incident_id: 'inc-5', entry_type: 'status_change', content: 'Status changed from Identified to Resolved', author: 'jane.smith', created_at: new Date(Date.now() - 14400000).toISOString(), old_status: 'identified', new_status: 'resolved', incident_number: 'INC-005' },
    { id: '8', incident_id: 'inc-3', entry_type: 'note', content: 'Patching network switches in DC-East', author: 'net_ops', created_at: new Date(Date.now() - 18000000).toISOString(), old_status: null, new_status: null, incident_number: 'INC-003' },
  ],
  trending_problems: [
    { id: 'p1', problem_number: 'PRB-001', title: 'Recurring auth service memory leak', description: null, root_cause: 'Memory leak in JWT validation', root_cause_category: 'Software Bug', permanent_fix: 'Upgrade auth library', fix_status: 'in_progress', fix_owner: 'john.doe', fix_due_date: '2026-02-28', fix_completed_date: null, estimated_cost: 5000, incident_count: 5, total_downtime_minutes: 120, known_error: 1, wiki_url: null, workaround: 'Restart auth service every 4 hours', priority: 'high', created_at: '2026-01-15T00:00:00Z', updated_at: '2026-02-10T00:00:00Z' },
    { id: 'p2', problem_number: 'PRB-002', title: 'Database connection pool exhaustion', description: null, root_cause: 'Connection leak in ORM layer', root_cause_category: 'Configuration', permanent_fix: 'Configure connection pool limits', fix_status: 'open', fix_owner: 'dba_team', fix_due_date: '2026-03-01', fix_completed_date: null, estimated_cost: 2000, incident_count: 3, total_downtime_minutes: 60, known_error: 0, wiki_url: null, workaround: null, priority: 'medium', created_at: '2026-01-20T00:00:00Z', updated_at: '2026-02-08T00:00:00Z' },
    { id: 'p3', problem_number: 'PRB-003', title: 'SSL certificate expiry automation failure', description: null, root_cause: null, root_cause_category: 'Process Gap', permanent_fix: null, fix_status: 'open', fix_owner: null, fix_due_date: null, fix_completed_date: null, estimated_cost: null, incident_count: 2, total_downtime_minutes: 30, known_error: 0, wiki_url: null, workaround: 'Manual cert renewal', priority: 'low', created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-05T00:00:00Z' },
  ],
  open_incidents: [
    { id: 'inc-1', incident_number: 'INC-001', title: 'Production API gateway returning 503 errors', description: null, severity: 'critical', category: 'Infrastructure', status: 'investigating', reported_at: new Date(Date.now() - 3600000).toISOString(), detected_at: null, acknowledged_at: null, resolved_at: null, closed_at: null, impact_description: null, users_affected: 1500, business_impact: 'high', data_breach: 0, reported_by: 'monitoring', assigned_to: 'john.doe', resolved_by: null, resolution_summary: null, root_cause: null, workaround: null, problem_id: null, wiki_url: null, post_incident_completed: 0, lessons_learned: null, preventive_actions: null, tags: 'api,gateway,production' },
    { id: 'inc-2', incident_number: 'INC-002', title: 'Auth service memory leak causing intermittent failures', description: null, severity: 'high', category: 'Application', status: 'identified', reported_at: new Date(Date.now() - 7200000).toISOString(), detected_at: null, acknowledged_at: null, resolved_at: null, closed_at: null, impact_description: null, users_affected: 500, business_impact: 'medium', data_breach: 0, reported_by: 'auto-scaling', assigned_to: 'jane.smith', resolved_by: null, resolution_summary: null, root_cause: null, workaround: null, problem_id: 'p1', wiki_url: null, post_incident_completed: 0, lessons_learned: null, preventive_actions: null, tags: 'auth,memory' },
    { id: 'inc-3', incident_number: 'INC-003', title: 'Network latency spike in DC-East region', description: null, severity: 'high', category: 'Network', status: 'investigating', reported_at: new Date(Date.now() - 14400000).toISOString(), detected_at: null, acknowledged_at: null, resolved_at: null, closed_at: null, impact_description: null, users_affected: 200, business_impact: 'medium', data_breach: 0, reported_by: 'noc', assigned_to: 'net_ops', resolved_by: null, resolution_summary: null, root_cause: null, workaround: null, problem_id: null, wiki_url: null, post_incident_completed: 0, lessons_learned: null, preventive_actions: null, tags: 'network,latency' },
    { id: 'inc-4', incident_number: 'INC-004', title: 'Database replica lag exceeding threshold', description: null, severity: 'medium', category: 'Database', status: 'open', reported_at: new Date(Date.now() - 10800000).toISOString(), detected_at: null, acknowledged_at: null, resolved_at: null, closed_at: null, impact_description: null, users_affected: 50, business_impact: 'low', data_breach: 0, reported_by: 'dba_team', assigned_to: 'dba_team', resolved_by: null, resolution_summary: null, root_cause: null, workaround: null, problem_id: 'p2', wiki_url: null, post_incident_completed: 0, lessons_learned: null, preventive_actions: null, tags: 'database,replication' },
    { id: 'inc-6', incident_number: 'INC-006', title: 'SSL certificate expiry warning for payments domain', description: null, severity: 'medium', category: 'Security', status: 'open', reported_at: new Date(Date.now() - 21600000).toISOString(), detected_at: null, acknowledged_at: null, resolved_at: null, closed_at: null, impact_description: null, users_affected: null, business_impact: 'high', data_breach: 0, reported_by: 'monitoring', assigned_to: null, resolved_by: null, resolution_summary: null, root_cause: null, workaround: null, problem_id: 'p3', wiki_url: null, post_incident_completed: 0, lessons_learned: null, preventive_actions: null, tags: 'ssl,cert,security' },
    { id: 'inc-7', incident_number: 'INC-007', title: 'Slow dashboard load times during peak hours', description: null, severity: 'low', category: 'Application', status: 'open', reported_at: new Date(Date.now() - 43200000).toISOString(), detected_at: null, acknowledged_at: null, resolved_at: null, closed_at: null, impact_description: null, users_affected: 30, business_impact: 'low', data_breach: 0, reported_by: 'helpdesk', assigned_to: 'frontend_team', resolved_by: null, resolution_summary: null, root_cause: null, workaround: null, problem_id: null, wiki_url: null, post_incident_completed: 0, lessons_learned: null, preventive_actions: null, tags: 'performance,dashboard' },
    { id: 'inc-8', incident_number: 'INC-008', title: 'CDN cache invalidation not propagating', description: null, severity: 'low', category: 'Infrastructure', status: 'monitoring', reported_at: new Date(Date.now() - 86400000).toISOString(), detected_at: null, acknowledged_at: null, resolved_at: null, closed_at: null, impact_description: null, users_affected: 100, business_impact: 'low', data_breach: 0, reported_by: 'devops', assigned_to: 'infra_team', resolved_by: null, resolution_summary: null, root_cause: null, workaround: null, problem_id: null, wiki_url: null, post_incident_completed: 0, lessons_learned: null, preventive_actions: null, tags: 'cdn,cache' },
  ],
};

const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function CollapsibleSection({ title, icon, defaultOpen = true, children }: { title: string; icon: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="eaw-section">
      <div className="eaw-section-header" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </div>
      {open && <div className="eaw-section-content">{children}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(mockDashboard);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    fetchDashboard()
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { /* use mock data */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const sortedOpenIncidents = [...data.open_incidents].sort(
    (a, b) => (severityOrder[a.severity.toLowerCase()] ?? 9) - (severityOrder[b.severity.toLowerCase()] ?? 9)
  );

  const slaColor =
    data.sla_compliance_pct > 90
      ? 'text-green-600'
      : data.sla_compliance_pct > 70
      ? 'text-yellow-600'
      : 'text-red-600';

  const slaIconBg =
    data.sla_compliance_pct > 90
      ? 'bg-green-100'
      : data.sla_compliance_pct > 70
      ? 'bg-yellow-100'
      : 'bg-red-100';

  return (
    <div>
      <h1 className="text-xl font-bold text-eaw-font mb-4">Dashboard</h1>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="kpi-card">
          <div className="kpi-icon bg-orange-100">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <div className="kpi-value">{data.active_incidents}</div>
            <div className="kpi-label">Active Incidents</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-green-100">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <div className="kpi-value">{data.resolved_today}</div>
            <div className="kpi-label">Resolved Today</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-blue-100">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="kpi-value">{data.mttr_hours}h</div>
            <div className="kpi-label">MTTR</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon bg-purple-100">
            <Zap className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <div className="kpi-value">{data.mtta_minutes}m</div>
            <div className="kpi-label">MTTA</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className={`kpi-icon ${slaIconBg}`}>
            <Shield className={`w-6 h-6 ${slaColor}`} />
          </div>
          <div>
            <div className={`kpi-value ${slaColor}`}>{data.sla_compliance_pct}%</div>
            <div className="kpi-label">SLA Compliance</div>
          </div>
        </div>
      </div>

      {/* Open Incidents */}
      <CollapsibleSection
        title="Open Incidents"
        icon={<AlertTriangle className="w-4 h-4 text-eaw-danger" />}
      >
        {sortedOpenIncidents.length === 0 ? (
          <p className="text-sm text-eaw-muted">No open incidents. All clear!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {sortedOpenIncidents.map((inc: Incident) => (
              <div
                key={inc.id}
                className={`eaw-card border-l-4 ${severityBorderColor(inc.severity)} cursor-pointer hover:shadow-md transition-shadow`}
                onClick={() => navigate(`/incidents/${inc.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={severityBadge(inc.severity)}>{inc.severity}</span>
                  <span className="text-xs text-eaw-muted">{timeAgo(inc.reported_at)}</span>
                </div>
                <h3 className="text-sm font-semibold text-eaw-font mb-1 line-clamp-2">{inc.title}</h3>
                <div className="flex items-center justify-between text-xs text-eaw-muted">
                  <span>{inc.incident_number}</span>
                  <span>{inc.assigned_to ?? 'Unassigned'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Severity Pie */}
        <CollapsibleSection
          title="Incidents by Severity"
          icon={<AlertTriangle className="w-4 h-4 text-eaw-warning" />}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.incidents_by_severity}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {data.incidents_by_severity.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CollapsibleSection>

        {/* Category Bar */}
        <CollapsibleSection
          title="Incidents by Category"
          icon={<BarChart3 className="w-4 h-4 text-eaw-primary" />}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.incidents_by_category}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {data.incidents_by_category.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CollapsibleSection>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <CollapsibleSection
          title="Recent Activity"
          icon={<Clock className="w-4 h-4 text-eaw-info" />}
        >
          <div className="space-y-0">
            {data.recent_activity.slice(0, 10).map((entry: TimelineEntry & { incident_number?: string }, i) => (
              <div key={entry.id} className="flex gap-3 pb-4 relative">
                {/* Timeline line */}
                {i < data.recent_activity.length - 1 && (
                  <div className="absolute left-[11px] top-6 bottom-0 w-px bg-gray-200" />
                )}
                <div className="flex-shrink-0 mt-1">
                  <div className="w-[22px] h-[22px] rounded-full bg-gray-100 flex items-center justify-center">
                    <Clock className="w-3 h-3 text-eaw-muted" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-eaw-muted mb-0.5">
                    <span>{timeAgo(entry.created_at)}</span>
                    {entry.incident_number && (
                      <button
                        className="text-eaw-link hover:text-eaw-link-hover font-medium"
                        onClick={() => navigate(`/incidents/${entry.incident_id}`)}
                      >
                        {entry.incident_number}
                      </button>
                    )}
                    {entry.author && <span>by {entry.author}</span>}
                  </div>
                  <p className="text-sm text-eaw-font">{entry.content}</p>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Trending Problems */}
        <CollapsibleSection
          title="Trending Problems"
          icon={<Bug className="w-4 h-4 text-eaw-danger" />}
        >
          <table className="eaw-table">
            <thead>
              <tr>
                <th>Problem #</th>
                <th>Title</th>
                <th>Incidents</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.trending_problems.map((p: Problem) => (
                <tr
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/problems/${p.id}`)}
                >
                  <td className="text-eaw-link font-medium">{p.problem_number}</td>
                  <td className="max-w-[200px] truncate">{p.title}</td>
                  <td>
                    <span className="badge-danger">{p.incident_count}</span>
                  </td>
                  <td>
                    <span className={
                      p.fix_status === 'resolved' ? 'badge-success' :
                      p.fix_status === 'in_progress' ? 'badge-warning' :
                      'badge-info'
                    }>
                      {p.fix_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CollapsibleSection>
      </div>
    </div>
  );
}

