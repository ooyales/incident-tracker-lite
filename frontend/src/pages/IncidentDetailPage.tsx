import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  ArrowRight,
  Send,
  Server,
  Users,
  FileText,
  MessageSquare,
  Link2,
  ShieldCheck,
} from 'lucide-react';
import { fetchIncident, updateIncidentStatus } from '@/api/incidents';
import { addTimelineEntry } from '@/api/timeline';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Incident, TimelineEntry, IncidentAsset, IncidentResponder, Communication } from '@/types';

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

function timeElapsed(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString();
}

const STATUS_FLOW = ['open', 'investigating', 'identified', 'monitoring', 'resolved', 'closed'];

const ENTRY_TYPES = [
  { value: 'note', label: 'Note' },
  { value: 'status_change', label: 'Status Change' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'communication', label: 'Communication' },
  { value: 'escalation', label: 'Escalation' },
  { value: 'resolution', label: 'Resolution' },
];

function entryTypeIcon(entryType: string) {
  switch (entryType) {
    case 'status_change': return <ArrowRight className="w-3 h-3 text-blue-500" />;
    case 'assignment': return <User className="w-3 h-3 text-purple-500" />;
    case 'communication': return <MessageSquare className="w-3 h-3 text-green-500" />;
    case 'escalation': return <AlertTriangle className="w-3 h-3 text-red-500" />;
    case 'resolution': return <ShieldCheck className="w-3 h-3 text-green-600" />;
    default: return <FileText className="w-3 h-3 text-gray-500" />;
  }
}

// Mock incident for fallback
function getMockIncident(id: string): Incident {
  return {
    id,
    incident_number: 'INC-001',
    title: 'Production API gateway returning 503 errors',
    description: 'Multiple 503 errors detected on production API gateway affecting customer-facing services. Error rate spiked from 0.1% to 45% within a 5-minute window. All downstream services affected including payment processing and user authentication.',
    severity: 'critical',
    category: 'Infrastructure',
    status: 'investigating',
    reported_at: new Date(Date.now() - 3600000).toISOString(),
    detected_at: new Date(Date.now() - 3900000).toISOString(),
    acknowledged_at: new Date(Date.now() - 3500000).toISOString(),
    resolved_at: null,
    closed_at: null,
    impact_description: 'All external API consumers affected. Payment processing halted. User authentication intermittent.',
    users_affected: 1500,
    business_impact: 'high',
    data_breach: 0,
    reported_by: 'monitoring',
    assigned_to: 'john.doe',
    resolved_by: null,
    resolution_summary: null,
    root_cause: null,
    workaround: 'Routing traffic through backup gateway (reduced capacity)',
    problem_id: null,
    wiki_url: null,
    post_incident_completed: 0,
    lessons_learned: null,
    preventive_actions: null,
    tags: 'api,gateway,production',
    timeline_entries: [
      { id: 't1', incident_id: id, entry_type: 'status_change', content: 'Incident opened - automated alert triggered', author: 'monitoring', created_at: new Date(Date.now() - 3600000).toISOString(), old_status: null, new_status: 'open' },
      { id: 't2', incident_id: id, entry_type: 'assignment', content: 'Assigned to john.doe (on-call SRE)', author: 'pagerduty', created_at: new Date(Date.now() - 3500000).toISOString(), old_status: null, new_status: null },
      { id: 't3', incident_id: id, entry_type: 'status_change', content: 'Status changed from Open to Investigating', author: 'john.doe', created_at: new Date(Date.now() - 3400000).toISOString(), old_status: 'open', new_status: 'investigating' },
      { id: 't4', incident_id: id, entry_type: 'note', content: 'Checking API gateway logs - seeing connection pool exhaustion errors', author: 'john.doe', created_at: new Date(Date.now() - 3000000).toISOString(), old_status: null, new_status: null },
      { id: 't5', incident_id: id, entry_type: 'communication', content: 'Status page updated - investigating API issues', author: 'admin', created_at: new Date(Date.now() - 2700000).toISOString(), old_status: null, new_status: null },
      { id: 't6', incident_id: id, entry_type: 'escalation', content: 'Escalated to infrastructure team lead', author: 'john.doe', created_at: new Date(Date.now() - 1800000).toISOString(), old_status: null, new_status: null },
      { id: 't7', incident_id: id, entry_type: 'note', content: 'Identified upstream load balancer misconfiguration after recent deployment', author: 'infra_lead', created_at: new Date(Date.now() - 900000).toISOString(), old_status: null, new_status: null },
    ],
    assets: [
      { id: 'a1', incident_id: id, asset_name: 'api-gateway-prod-01', asset_type: 'Server', impact_type: 'Degraded', notes: 'Primary gateway instance' },
      { id: 'a2', incident_id: id, asset_name: 'api-gateway-prod-02', asset_type: 'Server', impact_type: 'Down', notes: 'Secondary gateway - completely unresponsive' },
      { id: 'a3', incident_id: id, asset_name: 'lb-external-01', asset_type: 'Load Balancer', impact_type: 'Misconfigured', notes: 'Root cause - bad config pushed' },
    ],
    responders: [
      { id: 'r1', incident_id: id, person_name: 'john.doe', role: 'Incident Commander', assigned_at: new Date(Date.now() - 3500000).toISOString() },
      { id: 'r2', incident_id: id, person_name: 'jane.smith', role: 'Communications Lead', assigned_at: new Date(Date.now() - 3400000).toISOString() },
      { id: 'r3', incident_id: id, person_name: 'infra_lead', role: 'Subject Matter Expert', assigned_at: new Date(Date.now() - 1800000).toISOString() },
    ],
    communications: [
      { id: 'c1', incident_id: id, channel: 'Status Page', recipient: 'External Users', message: 'We are currently investigating issues with our API services.', sent_at: new Date(Date.now() - 2700000).toISOString(), sent_by: 'admin' },
      { id: 'c2', incident_id: id, channel: 'Slack', recipient: '#engineering', message: 'P1 incident in progress - API gateway down. War room: #inc-001', sent_at: new Date(Date.now() - 3400000).toISOString(), sent_by: 'john.doe' },
      { id: 'c3', incident_id: id, channel: 'Email', recipient: 'VP Engineering', message: 'Executive briefing: Critical API outage affecting 1500 users', sent_at: new Date(Date.now() - 1800000).toISOString(), sent_by: 'jane.smith' },
    ],
  };
}

function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
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

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [newEntryContent, setNewEntryContent] = useState('');
  const [newEntryType, setNewEntryType] = useState('note');
  const [submittingEntry, setSubmittingEntry] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchIncident(id)
      .then((d) => { if (!cancelled) setIncident(d); })
      .catch(() => { if (!cancelled) setIncident(getMockIncident(id)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!incident || !id) return;
    try {
      const updated = await updateIncidentStatus(id, newStatus);
      setIncident(updated);
    } catch {
      // Optimistic update for mock
      setIncident({
        ...incident,
        status: newStatus,
        timeline_entries: [
          {
            id: `t-${Date.now()}`,
            incident_id: incident.id,
            entry_type: 'status_change',
            content: `Status changed from ${incident.status} to ${newStatus}`,
            author: 'admin',
            created_at: new Date().toISOString(),
            old_status: incident.status,
            new_status: newStatus,
          },
          ...(incident.timeline_entries ?? []),
        ],
      });
    }
  };

  const handleAddEntry = async () => {
    if (!incident || !id || !newEntryContent.trim()) return;
    setSubmittingEntry(true);
    try {
      const entry = await addTimelineEntry(id, {
        entry_type: newEntryType,
        content: newEntryContent,
        author: 'admin',
      });
      setIncident({
        ...incident,
        timeline_entries: [entry, ...(incident.timeline_entries ?? [])],
      });
    } catch {
      // Mock fallback
      const entry: TimelineEntry = {
        id: `t-${Date.now()}`,
        incident_id: incident.id,
        entry_type: newEntryType,
        content: newEntryContent,
        author: 'admin',
        created_at: new Date().toISOString(),
        old_status: null,
        new_status: null,
      };
      setIncident({
        ...incident,
        timeline_entries: [entry, ...(incident.timeline_entries ?? [])],
      });
    } finally {
      setNewEntryContent('');
      setSubmittingEntry(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-eaw-muted">Loading incident...</div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertTriangle className="w-8 h-8 text-eaw-muted mb-2" />
        <p className="text-eaw-muted">Incident not found.</p>
        <button className="btn-primary mt-4" onClick={() => navigate('/incidents')}>
          Back to Incidents
        </button>
      </div>
    );
  }

  const currentIdx = STATUS_FLOW.indexOf(incident.status.toLowerCase());
  const nextStatuses = STATUS_FLOW.slice(currentIdx + 1);

  const timeline = [...(incident.timeline_entries ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-sm text-eaw-muted font-mono">{incident.incident_number}</span>
            <span className={severityBadge(incident.severity)}>{incident.severity}</span>
            <span className={statusBadge(incident.status)}>{incident.status}</span>
          </div>
          <h1 className="text-xl font-bold text-eaw-font">{incident.title}</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-eaw-muted">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {timeElapsed(incident.reported_at)} elapsed
            </span>
            {incident.assigned_to && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {incident.assigned_to}
              </span>
            )}
          </div>
        </div>
        <button className="btn-secondary text-sm" onClick={() => navigate('/incidents')}>
          Back to List
        </button>
      </div>

      {/* Quick Actions Bar */}
      {nextStatuses.length > 0 && (
        <div className="eaw-card mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-eaw-font mr-2">Advance Status:</span>
            {nextStatuses.map((s) => (
              <button
                key={s}
                className={`text-sm px-3 py-1.5 rounded font-medium transition-colors ${
                  s === 'resolved'
                    ? 'btn-success'
                    : s === 'closed'
                    ? 'bg-gray-200 text-eaw-font hover:bg-gray-300'
                    : 'btn-primary'
                }`}
                onClick={() => handleStatusChange(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Overview Section */}
      <CollapsibleSection title="Overview" icon={<FileText className="w-4 h-4 text-eaw-primary" />}>
        <div className="space-y-3">
          {incident.description && (
            <div>
              <label className="text-xs font-semibold text-eaw-muted uppercase">Description</label>
              <p className="text-sm text-eaw-font mt-1">{incident.description}</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-eaw-muted uppercase">Impact</label>
              <p className="text-sm text-eaw-font mt-1">{incident.impact_description ?? '-'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-eaw-muted uppercase">Users Affected</label>
              <p className="text-sm text-eaw-font mt-1">{incident.users_affected ?? '-'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-eaw-muted uppercase">Business Impact</label>
              <p className="text-sm text-eaw-font mt-1">{incident.business_impact ?? '-'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-eaw-muted uppercase">Data Breach</label>
              <p className="text-sm mt-1">
                {incident.data_breach ? (
                  <span className="badge-danger">Yes</span>
                ) : (
                  <span className="badge-success">No</span>
                )}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-eaw-muted uppercase">Reported At</label>
              <p className="text-sm text-eaw-font mt-1">{formatDate(incident.reported_at)}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-eaw-muted uppercase">Detected At</label>
              <p className="text-sm text-eaw-font mt-1">{formatDate(incident.detected_at)}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-eaw-muted uppercase">Acknowledged At</label>
              <p className="text-sm text-eaw-font mt-1">{formatDate(incident.acknowledged_at)}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-eaw-muted uppercase">Category</label>
              <p className="text-sm text-eaw-font mt-1">{incident.category ?? '-'}</p>
            </div>
          </div>
          {incident.workaround && (
            <div>
              <label className="text-xs font-semibold text-eaw-muted uppercase">Workaround</label>
              <p className="text-sm text-eaw-font mt-1 bg-yellow-50 p-2 rounded border border-yellow-200">{incident.workaround}</p>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Timeline Section */}
      <CollapsibleSection title="Timeline" icon={<Clock className="w-4 h-4 text-eaw-info" />}>
        {/* Add entry form */}
        <div className="mb-4 p-3 bg-gray-50 rounded border border-eaw-border">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3">
            <select
              className="select-field w-full sm:w-auto"
              value={newEntryType}
              onChange={(e) => setNewEntryType(e.target.value)}
            >
              {ENTRY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <textarea
              className="input-field flex-1 min-h-[60px]"
              placeholder="Add a timeline entry..."
              value={newEntryContent}
              onChange={(e) => setNewEntryContent(e.target.value)}
              rows={2}
            />
            <button
              className="btn-primary self-end sm:self-start"
              onClick={handleAddEntry}
              disabled={!newEntryContent.trim() || submittingEntry}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timeline entries */}
        <div className="space-y-0">
          {timeline.map((entry, i) => (
            <div key={entry.id} className="flex gap-3 pb-4 relative">
              {i < timeline.length - 1 && (
                <div className="absolute left-[11px] top-6 bottom-0 w-px bg-gray-200" />
              )}
              <div className="flex-shrink-0 mt-1">
                <div className="w-[22px] h-[22px] rounded-full bg-gray-100 flex items-center justify-center">
                  {entryTypeIcon(entry.entry_type)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-eaw-muted mb-0.5">
                  <span>{formatDate(entry.created_at)}</span>
                  <span className="badge-muted text-[10px]">{entry.entry_type}</span>
                  {entry.author && <span>by {entry.author}</span>}
                </div>
                <p className="text-sm text-eaw-font">{entry.content}</p>
              </div>
            </div>
          ))}
          {timeline.length === 0 && (
            <p className="text-sm text-eaw-muted">No timeline entries yet.</p>
          )}
        </div>
      </CollapsibleSection>

      {/* Affected Assets */}
      <CollapsibleSection title="Affected Assets" icon={<Server className="w-4 h-4 text-eaw-warning" />}>
        {(incident.assets ?? []).length === 0 ? (
          <p className="text-sm text-eaw-muted">No assets linked to this incident.</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="eaw-table">
                <thead>
                  <tr>
                    <th>Asset Name</th>
                    <th>Type</th>
                    <th>Impact</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(incident.assets ?? []).map((a: IncidentAsset) => (
                    <tr key={a.id}>
                      <td className="font-medium">{a.asset_name}</td>
                      <td>{a.asset_type ?? '-'}</td>
                      <td>
                        <span className={
                          a.impact_type === 'Down' ? 'badge-danger' :
                          a.impact_type === 'Degraded' ? 'badge-warning' :
                          'badge-info'
                        }>
                          {a.impact_type ?? '-'}
                        </span>
                      </td>
                      <td className="text-sm text-eaw-muted">{a.notes ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="md:hidden mobile-card-table">
              {(incident.assets ?? []).map((a: IncidentAsset) => (
                <div key={a.id} className="mobile-card-row">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-eaw-font">{a.asset_name}</span>
                    <span className={
                      a.impact_type === 'Down' ? 'badge-danger' :
                      a.impact_type === 'Degraded' ? 'badge-warning' :
                      'badge-info'
                    }>
                      {a.impact_type ?? '-'}
                    </span>
                  </div>
                  <div className="text-xs text-eaw-muted">Type: {a.asset_type ?? '-'}</div>
                  {a.notes && <div className="text-xs text-eaw-muted mt-1">{a.notes}</div>}
                </div>
              ))}
            </div>
          </>
        )}
      </CollapsibleSection>

      {/* Responders */}
      <CollapsibleSection title="Responders" icon={<Users className="w-4 h-4 text-purple-500" />}>
        {(incident.responders ?? []).length === 0 ? (
          <p className="text-sm text-eaw-muted">No responders assigned.</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="eaw-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Assigned At</th>
                  </tr>
                </thead>
                <tbody>
                  {(incident.responders ?? []).map((r: IncidentResponder) => (
                    <tr key={r.id}>
                      <td className="font-medium">{r.person_name}</td>
                      <td>
                        <span className="badge-info">{r.role ?? '-'}</span>
                      </td>
                      <td className="text-sm text-eaw-muted">{formatDate(r.assigned_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="md:hidden mobile-card-table">
              {(incident.responders ?? []).map((r: IncidentResponder) => (
                <div key={r.id} className="mobile-card-row">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-eaw-font">{r.person_name}</span>
                    <span className="badge-info">{r.role ?? '-'}</span>
                  </div>
                  <div className="text-xs text-eaw-muted">{formatDate(r.assigned_at)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </CollapsibleSection>

      {/* Resolution (shown when resolved or closed) */}
      {(incident.status.toLowerCase() === 'resolved' || incident.status.toLowerCase() === 'closed') && (
        <CollapsibleSection title="Resolution" icon={<ShieldCheck className="w-4 h-4 text-green-600" />}>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-eaw-muted uppercase">Resolution Summary</label>
              <p className="text-sm text-eaw-font mt-1">{incident.resolution_summary ?? 'Not provided'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-eaw-muted uppercase">Root Cause</label>
              <p className="text-sm text-eaw-font mt-1">{incident.root_cause ?? 'Not identified'}</p>
            </div>
            {incident.workaround && (
              <div>
                <label className="text-xs font-semibold text-eaw-muted uppercase">Workaround</label>
                <p className="text-sm text-eaw-font mt-1">{incident.workaround}</p>
              </div>
            )}
            {incident.lessons_learned && (
              <div>
                <label className="text-xs font-semibold text-eaw-muted uppercase">Lessons Learned</label>
                <p className="text-sm text-eaw-font mt-1">{incident.lessons_learned}</p>
              </div>
            )}
            {incident.preventive_actions && (
              <div>
                <label className="text-xs font-semibold text-eaw-muted uppercase">Preventive Actions</label>
                <p className="text-sm text-eaw-font mt-1">{incident.preventive_actions}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-eaw-muted uppercase">Resolved At</label>
                <p className="text-sm text-eaw-font mt-1">{formatDate(incident.resolved_at)}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-eaw-muted uppercase">Resolved By</label>
                <p className="text-sm text-eaw-font mt-1">{incident.resolved_by ?? '-'}</p>
              </div>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Communications */}
      <CollapsibleSection title="Communications" icon={<MessageSquare className="w-4 h-4 text-green-500" />} defaultOpen={false}>
        {(incident.communications ?? []).length === 0 ? (
          <p className="text-sm text-eaw-muted">No communications logged.</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="eaw-table">
                <thead>
                  <tr>
                    <th>Channel</th>
                    <th>Recipient</th>
                    <th>Message</th>
                    <th>Sent At</th>
                    <th>Sent By</th>
                  </tr>
                </thead>
                <tbody>
                  {(incident.communications ?? []).map((c: Communication) => (
                    <tr key={c.id}>
                      <td><span className="badge-info">{c.channel ?? '-'}</span></td>
                      <td className="font-medium">{c.recipient ?? '-'}</td>
                      <td className="max-w-[250px] truncate text-sm">{c.message ?? '-'}</td>
                      <td className="text-sm text-eaw-muted whitespace-nowrap">{formatDate(c.sent_at)}</td>
                      <td>{c.sent_by ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="md:hidden mobile-card-table">
              {(incident.communications ?? []).map((c: Communication) => (
                <div key={c.id} className="mobile-card-row">
                  <div className="flex items-center justify-between mb-1">
                    <span className="badge-info">{c.channel ?? '-'}</span>
                    <span className="text-xs text-eaw-muted">{formatDate(c.sent_at)}</span>
                  </div>
                  <div className="text-sm font-medium text-eaw-font mb-1">{c.recipient ?? '-'}</div>
                  <p className="text-sm text-eaw-muted line-clamp-2">{c.message ?? '-'}</p>
                  <div className="text-xs text-eaw-muted mt-1">by {c.sent_by ?? '-'}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </CollapsibleSection>

      {/* Linked Problem */}
      {incident.problem_id && (
        <CollapsibleSection title="Linked Problem" icon={<Link2 className="w-4 h-4 text-eaw-danger" />} defaultOpen={false}>
          <div
            className="eaw-card cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-orange-500"
            onClick={() => navigate(`/problems/${incident.problem_id}`)}
          >
            <div className="text-sm text-eaw-link font-medium">Problem: {incident.problem_id}</div>
            <p className="text-sm text-eaw-muted mt-1">Click to view linked problem details</p>
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}
