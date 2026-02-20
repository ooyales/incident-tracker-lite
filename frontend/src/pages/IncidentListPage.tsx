import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, AlertTriangle, X } from 'lucide-react';
import { fetchIncidents, createIncident } from '@/api/incidents';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Incident } from '@/types';

function severityBadge(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical': return 'badge-danger';
    case 'high': return 'badge-warning';
    case 'medium': return 'badge-info';
    case 'low': return 'badge-muted';
    default: return 'badge-muted';
  }
}

function statusBadge(status: string): string {
  switch (status.toLowerCase()) {
    case 'open': return 'badge-danger';
    case 'investigating': return 'badge-warning';
    case 'identified': return 'badge-info';
    case 'monitoring': return 'badge-info';
    case 'resolved': return 'badge-success';
    case 'closed': return 'badge-muted';
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

const mockIncidents: Incident[] = [
  { id: 'inc-1', incident_number: 'INC-001', title: 'Production API gateway returning 503 errors', description: 'Multiple 503 errors detected on production API gateway affecting customer-facing services.', severity: 'critical', category: 'Infrastructure', status: 'investigating', reported_at: new Date(Date.now() - 3600000).toISOString(), detected_at: null, acknowledged_at: null, resolved_at: null, closed_at: null, impact_description: 'All external API consumers affected', users_affected: 1500, business_impact: 'high', data_breach: 0, reported_by: 'monitoring', assigned_to: 'john.doe', resolved_by: null, resolution_summary: null, root_cause: null, workaround: null, problem_id: null, wiki_url: null, post_incident_completed: 0, lessons_learned: null, preventive_actions: null, tags: 'api,gateway,production' },
  { id: 'inc-2', incident_number: 'INC-002', title: 'Auth service memory leak causing intermittent failures', description: 'Auth service pods showing steadily increasing memory usage leading to OOM kills.', severity: 'high', category: 'Application', status: 'identified', reported_at: new Date(Date.now() - 7200000).toISOString(), detected_at: null, acknowledged_at: null, resolved_at: null, closed_at: null, impact_description: 'Login failures for ~30% of users', users_affected: 500, business_impact: 'medium', data_breach: 0, reported_by: 'auto-scaling', assigned_to: 'jane.smith', resolved_by: null, resolution_summary: null, root_cause: null, workaround: null, problem_id: 'p1', wiki_url: null, post_incident_completed: 0, lessons_learned: null, preventive_actions: null, tags: 'auth,memory' },
  { id: 'inc-3', incident_number: 'INC-003', title: 'Network latency spike in DC-East region', description: 'Elevated latency observed across DC-East network switches.', severity: 'high', category: 'Network', status: 'investigating', reported_at: new Date(Date.now() - 14400000).toISOString(), detected_at: null, acknowledged_at: null, resolved_at: null, closed_at: null, impact_description: 'Services in DC-East experiencing degraded performance', users_affected: 200, business_impact: 'medium', data_breach: 0, reported_by: 'noc', assigned_to: 'net_ops', resolved_by: null, resolution_summary: null, root_cause: null, workaround: null, problem_id: null, wiki_url: null, post_incident_completed: 0, lessons_learned: null, preventive_actions: null, tags: 'network,latency' },
  { id: 'inc-4', incident_number: 'INC-004', title: 'Database replica lag exceeding threshold', description: 'Read replicas lagging behind primary by more than 30 seconds.', severity: 'medium', category: 'Database', status: 'open', reported_at: new Date(Date.now() - 10800000).toISOString(), detected_at: null, acknowledged_at: null, resolved_at: null, closed_at: null, impact_description: 'Stale data for read-only queries', users_affected: 50, business_impact: 'low', data_breach: 0, reported_by: 'dba_team', assigned_to: 'dba_team', resolved_by: null, resolution_summary: null, root_cause: null, workaround: null, problem_id: 'p2', wiki_url: null, post_incident_completed: 0, lessons_learned: null, preventive_actions: null, tags: 'database,replication' },
  { id: 'inc-5', incident_number: 'INC-005', title: 'Scheduled backup job failed on storage cluster', description: 'Nightly backup job failed due to insufficient storage space.', severity: 'medium', category: 'Infrastructure', status: 'resolved', reported_at: new Date(Date.now() - 86400000).toISOString(), detected_at: null, acknowledged_at: null, resolved_at: new Date(Date.now() - 72000000).toISOString(), closed_at: null, impact_description: 'No backup for 24 hours', users_affected: null, business_impact: 'medium', data_breach: 0, reported_by: 'cron-monitor', assigned_to: 'storage_team', resolved_by: 'storage_team', resolution_summary: 'Expanded storage volume and re-ran backup', root_cause: 'Storage volume at 98% capacity', workaround: null, problem_id: null, wiki_url: null, post_incident_completed: 1, lessons_learned: 'Need capacity alerting at 80%', preventive_actions: 'Added storage capacity monitoring', tags: 'backup,storage' },
  { id: 'inc-6', incident_number: 'INC-006', title: 'SSL certificate expiry warning for payments domain', description: 'SSL cert for payments.example.com expires in 7 days.', severity: 'medium', category: 'Security', status: 'open', reported_at: new Date(Date.now() - 21600000).toISOString(), detected_at: null, acknowledged_at: null, resolved_at: null, closed_at: null, impact_description: 'Potential service disruption if not renewed', users_affected: null, business_impact: 'high', data_breach: 0, reported_by: 'monitoring', assigned_to: null, resolved_by: null, resolution_summary: null, root_cause: null, workaround: null, problem_id: 'p3', wiki_url: null, post_incident_completed: 0, lessons_learned: null, preventive_actions: null, tags: 'ssl,cert,security' },
  { id: 'inc-7', incident_number: 'INC-007', title: 'Slow dashboard load times during peak hours', description: 'Dashboard pages taking 10+ seconds to load during business hours.', severity: 'low', category: 'Application', status: 'open', reported_at: new Date(Date.now() - 43200000).toISOString(), detected_at: null, acknowledged_at: null, resolved_at: null, closed_at: null, impact_description: 'User experience degradation', users_affected: 30, business_impact: 'low', data_breach: 0, reported_by: 'helpdesk', assigned_to: 'frontend_team', resolved_by: null, resolution_summary: null, root_cause: null, workaround: null, problem_id: null, wiki_url: null, post_incident_completed: 0, lessons_learned: null, preventive_actions: null, tags: 'performance,dashboard' },
  { id: 'inc-8', incident_number: 'INC-008', title: 'CDN cache invalidation not propagating', description: 'Cache purge requests are not propagating to all edge nodes.', severity: 'low', category: 'Infrastructure', status: 'monitoring', reported_at: new Date(Date.now() - 86400000).toISOString(), detected_at: null, acknowledged_at: null, resolved_at: null, closed_at: null, impact_description: 'Stale content served to some users', users_affected: 100, business_impact: 'low', data_breach: 0, reported_by: 'devops', assigned_to: 'infra_team', resolved_by: null, resolution_summary: null, root_cause: null, workaround: null, problem_id: null, wiki_url: null, post_incident_completed: 0, lessons_learned: null, preventive_actions: null, tags: 'cdn,cache' },
  { id: 'inc-9', incident_number: 'INC-009', title: 'Email notification service queue backlog', description: 'Email queue has grown to 50k undelivered messages.', severity: 'high', category: 'Application', status: 'resolved', reported_at: new Date(Date.now() - 172800000).toISOString(), detected_at: null, acknowledged_at: null, resolved_at: new Date(Date.now() - 158400000).toISOString(), closed_at: new Date(Date.now() - 144000000).toISOString(), impact_description: 'Users not receiving transactional emails', users_affected: 2000, business_impact: 'high', data_breach: 0, reported_by: 'support', assigned_to: 'messaging_team', resolved_by: 'messaging_team', resolution_summary: 'Scaled up email workers and cleared backlog', root_cause: 'SMTP relay rate limiting', workaround: null, problem_id: null, wiki_url: null, post_incident_completed: 1, lessons_learned: 'Need queue depth alerting', preventive_actions: 'Added queue monitoring dashboard', tags: 'email,queue' },
  { id: 'inc-10', incident_number: 'INC-010', title: 'Unauthorized access attempt detected on admin panel', description: 'Multiple failed login attempts from suspicious IP range targeting admin endpoints.', severity: 'critical', category: 'Security', status: 'closed', reported_at: new Date(Date.now() - 259200000).toISOString(), detected_at: null, acknowledged_at: null, resolved_at: new Date(Date.now() - 252000000).toISOString(), closed_at: new Date(Date.now() - 244800000).toISOString(), impact_description: 'No actual breach confirmed', users_affected: 0, business_impact: 'high', data_breach: 0, reported_by: 'security_ops', assigned_to: 'security_team', resolved_by: 'security_team', resolution_summary: 'Blocked IP range, enabled additional MFA', root_cause: 'Brute force attack from known threat actor', workaround: null, problem_id: null, wiki_url: null, post_incident_completed: 1, lessons_learned: 'Implement rate limiting on auth endpoints', preventive_actions: 'Deployed WAF rules, enhanced MFA', tags: 'security,brute-force' },
];

const SEVERITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['All', 'Open', 'Investigating', 'Identified', 'Monitoring', 'Resolved', 'Closed'];
const CATEGORIES = ['All', 'Infrastructure', 'Application', 'Security', 'Network', 'Database'];

export default function IncidentListPage() {
  const isMobile = useIsMobile();
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState('All');
  const [status, setStatus] = useState('All');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    const params: Record<string, string> = {};
    if (severity !== 'All') params.severity = severity.toLowerCase();
    if (status !== 'All') params.status = status.toLowerCase();
    if (category !== 'All') params.category = category;
    if (search) params.search = search;

    fetchIncidents(params)
      .then((d) => { if (!cancelled) setIncidents(d); })
      .catch(() => { /* use mock */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [severity, status, category, search]);

  const filtered = incidents.filter((inc) => {
    if (severity !== 'All' && inc.severity.toLowerCase() !== severity.toLowerCase()) return false;
    if (status !== 'All' && inc.status.toLowerCase() !== status.toLowerCase()) return false;
    if (category !== 'All' && inc.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        inc.title.toLowerCase().includes(q) ||
        inc.incident_number.toLowerCase().includes(q) ||
        (inc.assigned_to ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-eaw-font">Incidents</h1>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          Create Incident
        </button>
      </div>

      {/* Filter Bar */}
      <div className="eaw-card mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-eaw-muted" />
            <input
              type="text"
              className="w-full py-2 pr-3 pl-9 text-sm border border-eaw-border rounded outline-none transition-colors focus:border-eaw-primary focus:ring-1 focus:ring-eaw-primary"
              placeholder="Search incidents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="select-field w-full sm:w-auto" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            {SEVERITIES.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Severities' : s}</option>)}
          </select>
          <select className="select-field w-full sm:w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
          </select>
          <select className="select-field w-full sm:w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
          </select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="eaw-section hidden md:block">
        <table className="eaw-table">
          <thead>
            <tr>
              <th>Incident #</th>
              <th>Title</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Reported</th>
              <th>Elapsed</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-eaw-muted py-8">
                  No incidents found matching your filters.
                </td>
              </tr>
            ) : (
              filtered.map((inc) => (
                <tr
                  key={inc.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/incidents/${inc.id}`)}
                >
                  <td className="text-eaw-link font-medium whitespace-nowrap">{inc.incident_number}</td>
                  <td className="max-w-[300px] truncate">{inc.title}</td>
                  <td><span className={severityBadge(inc.severity)}>{inc.severity}</span></td>
                  <td><span className={statusBadge(inc.status)}>{inc.status}</span></td>
                  <td className="whitespace-nowrap">{inc.assigned_to ?? '-'}</td>
                  <td className="whitespace-nowrap text-sm">{new Date(inc.reported_at).toLocaleDateString()}</td>
                  <td className="whitespace-nowrap text-sm text-eaw-muted">{timeAgo(inc.reported_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden mobile-card-table">
        {filtered.length === 0 ? (
          <div className="eaw-card text-center text-eaw-muted py-8">
            No incidents found matching your filters.
          </div>
        ) : (
          filtered.map((inc) => (
            <div
              key={inc.id}
              className="mobile-card-row clickable"
              onClick={() => navigate(`/incidents/${inc.id}`)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-eaw-link font-medium text-sm">{inc.incident_number}</span>
                <span className="text-xs text-eaw-muted">{timeAgo(inc.reported_at)}</span>
              </div>
              <p className="text-sm font-semibold text-eaw-font mb-2 line-clamp-2">{inc.title}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={severityBadge(inc.severity)}>{inc.severity}</span>
                <span className={statusBadge(inc.status)}>{inc.status}</span>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-eaw-muted">
                <span>{inc.assigned_to ?? 'Unassigned'}</span>
                <span>{new Date(inc.reported_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Incident Modal */}
      {showCreateModal && (
        <CreateIncidentModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(inc) => {
            setIncidents((prev) => [inc, ...prev]);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

function CreateIncidentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (inc: Incident) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState('medium');
  const [incidentCategory, setIncidentCategory] = useState('Infrastructure');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const inc = await createIncident({
        title,
        description,
        severity: incidentSeverity,
        category: incidentCategory,
      });
      onCreated(inc);
    } catch {
      // Fallback: create mock
      const mock: Incident = {
        id: `inc-new-${Date.now()}`,
        incident_number: `INC-${String(Date.now()).slice(-4)}`,
        title,
        description,
        severity: incidentSeverity,
        category: incidentCategory,
        status: 'open',
        reported_at: new Date().toISOString(),
        detected_at: null,
        acknowledged_at: null,
        resolved_at: null,
        closed_at: null,
        impact_description: null,
        users_affected: null,
        business_impact: null,
        data_breach: 0,
        reported_by: 'admin',
        assigned_to: null,
        resolved_by: null,
        resolution_summary: null,
        root_cause: null,
        workaround: null,
        problem_id: null,
        wiki_url: null,
        post_incident_completed: 0,
        lessons_learned: null,
        preventive_actions: null,
        tags: '',
      };
      onCreated(mock);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-eaw-border">
          <h2 className="text-lg font-semibold text-eaw-font">Create Incident</h2>
          <button onClick={onClose} className="text-eaw-muted hover:text-eaw-font">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-eaw-font mb-1">Title *</label>
            <input
              className="input-field"
              placeholder="Brief description of the incident"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-eaw-font mb-1">Description</label>
            <textarea
              className="input-field min-h-[80px]"
              placeholder="Detailed description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-eaw-font mb-1">Severity</label>
              <select className="select-field w-full" value={incidentSeverity} onChange={(e) => setIncidentSeverity(e.target.value)}>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-eaw-font mb-1">Category</label>
              <select className="select-field w-full" value={incidentCategory} onChange={(e) => setIncidentCategory(e.target.value)}>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Application">Application</option>
                <option value="Security">Security</option>
                <option value="Network">Network</option>
                <option value="Database">Database</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={!title.trim() || submitting}>
              {submitting ? 'Creating...' : 'Create Incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
