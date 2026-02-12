import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Bug,
  ChevronDown,
  ChevronUp,
  FileText,
  Search as SearchIcon,
  Wrench,
  AlertTriangle,
  Link2,
  ExternalLink,
  Shield,
} from 'lucide-react';
import { fetchProblem } from '@/api/problems';
import type { Problem, Incident } from '@/types';

function fixStatusBadge(status: string): string {
  switch (status.toLowerCase()) {
    case 'resolved': return 'badge-success';
    case 'in_progress': return 'badge-warning';
    case 'open': return 'badge-info';
    case 'closed': return 'badge-muted';
    default: return 'badge-muted';
  }
}

function priorityBadge(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'critical': return 'badge-danger';
    case 'high': return 'badge-warning';
    case 'medium': return 'badge-info';
    case 'low': return 'badge-muted';
    default: return 'badge-muted';
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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString();
}

function getMockProblem(id: string): Problem {
  return {
    id,
    problem_number: 'PRB-001',
    title: 'Recurring auth service memory leak',
    description: 'The authentication service experiences gradual memory growth that eventually leads to OOM kills. This has caused multiple incidents over the past month, primarily during peak usage hours. The issue was first identified on January 15, 2026 after three back-to-back incidents within a single week.',
    root_cause: 'Memory leak in JWT validation library (jsonwebtoken v8.x) when handling expired tokens. The library creates new Buffer objects for each token validation but does not properly release them when the token is expired. This causes a steady memory increase of approximately 50MB per hour during normal load.',
    root_cause_category: 'Software Bug',
    permanent_fix: 'Upgrade auth library from jsonwebtoken v8.5.1 to v9.0.2 which includes the memory leak fix. Also need to update the token validation middleware to use the new API signatures.',
    fix_status: 'in_progress',
    fix_owner: 'john.doe',
    fix_due_date: '2026-02-28',
    fix_completed_date: null,
    estimated_cost: 5000,
    incident_count: 5,
    total_downtime_minutes: 120,
    known_error: 1,
    wiki_url: 'https://wiki.example.com/ke/auth-memory-leak',
    workaround: 'Restart auth service pods every 4 hours via cron job. This prevents memory from reaching the OOM threshold. Monitoring alert set at 80% memory usage as early warning.',
    priority: 'high',
    created_at: '2026-01-15T00:00:00Z',
    updated_at: '2026-02-10T00:00:00Z',
    incidents: [
      { id: 'inc-2', incident_number: 'INC-002', title: 'Auth service memory leak causing intermittent failures', description: null, severity: 'high', category: 'Application', status: 'identified', reported_at: new Date(Date.now() - 7200000).toISOString(), detected_at: null, acknowledged_at: null, resolved_at: null, closed_at: null, impact_description: null, users_affected: 500, business_impact: 'medium', data_breach: 0, reported_by: 'auto-scaling', assigned_to: 'jane.smith', resolved_by: null, resolution_summary: null, root_cause: null, workaround: null, problem_id: 'p1', wiki_url: null, post_incident_completed: 0, lessons_learned: null, preventive_actions: null, tags: 'auth,memory' },
      { id: 'inc-11', incident_number: 'INC-011', title: 'Auth service OOM kill during morning peak', description: null, severity: 'high', category: 'Application', status: 'resolved', reported_at: '2026-02-05T08:30:00Z', detected_at: null, acknowledged_at: null, resolved_at: '2026-02-05T09:15:00Z', closed_at: '2026-02-05T10:00:00Z', impact_description: null, users_affected: 800, business_impact: 'high', data_breach: 0, reported_by: 'monitoring', assigned_to: 'john.doe', resolved_by: 'john.doe', resolution_summary: 'Restarted auth pods', root_cause: 'Memory leak', workaround: null, problem_id: 'p1', wiki_url: null, post_incident_completed: 1, lessons_learned: null, preventive_actions: null, tags: 'auth,oom' },
      { id: 'inc-12', incident_number: 'INC-012', title: 'Intermittent 401 errors from auth service', description: null, severity: 'medium', category: 'Application', status: 'closed', reported_at: '2026-01-28T14:00:00Z', detected_at: null, acknowledged_at: null, resolved_at: '2026-01-28T15:30:00Z', closed_at: '2026-01-28T16:00:00Z', impact_description: null, users_affected: 200, business_impact: 'medium', data_breach: 0, reported_by: 'helpdesk', assigned_to: 'jane.smith', resolved_by: 'jane.smith', resolution_summary: 'Pod restart resolved', root_cause: 'Memory pressure', workaround: null, problem_id: 'p1', wiki_url: null, post_incident_completed: 1, lessons_learned: null, preventive_actions: null, tags: 'auth,401' },
      { id: 'inc-13', incident_number: 'INC-013', title: 'Auth service unresponsive - all users affected', description: null, severity: 'critical', category: 'Application', status: 'closed', reported_at: '2026-01-22T03:00:00Z', detected_at: null, acknowledged_at: null, resolved_at: '2026-01-22T03:45:00Z', closed_at: '2026-01-22T10:00:00Z', impact_description: null, users_affected: 5000, business_impact: 'critical', data_breach: 0, reported_by: 'monitoring', assigned_to: 'john.doe', resolved_by: 'john.doe', resolution_summary: 'Emergency pod restart + scaling', root_cause: 'Memory leak', workaround: null, problem_id: 'p1', wiki_url: null, post_incident_completed: 1, lessons_learned: 'Need automated memory-based restarts', preventive_actions: 'Added 4-hour restart cron', tags: 'auth,outage' },
      { id: 'inc-14', incident_number: 'INC-014', title: 'Slow token validation response times', description: null, severity: 'low', category: 'Application', status: 'closed', reported_at: '2026-01-18T11:00:00Z', detected_at: null, acknowledged_at: null, resolved_at: '2026-01-18T12:00:00Z', closed_at: '2026-01-18T12:30:00Z', impact_description: null, users_affected: 50, business_impact: 'low', data_breach: 0, reported_by: 'apm', assigned_to: 'john.doe', resolved_by: 'john.doe', resolution_summary: 'Pod restart', root_cause: 'High memory usage', workaround: null, problem_id: 'p1', wiki_url: null, post_incident_completed: 0, lessons_learned: null, preventive_actions: null, tags: 'auth,slow' },
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

export default function ProblemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchProblem(id)
      .then((d) => { if (!cancelled) setProblem(d); })
      .catch(() => { if (!cancelled) setProblem(getMockProblem(id)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-eaw-muted">Loading problem...</div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Bug className="w-8 h-8 text-eaw-muted mb-2" />
        <p className="text-eaw-muted">Problem not found.</p>
        <button className="btn-primary mt-4" onClick={() => navigate('/problems')}>
          Back to Problems
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-sm text-eaw-muted font-mono">{problem.problem_number}</span>
            <span className={priorityBadge(problem.priority)}>{problem.priority} priority</span>
            <span className={fixStatusBadge(problem.fix_status)}>{problem.fix_status.replace('_', ' ')}</span>
          </div>
          <h1 className="text-xl font-bold text-eaw-font">{problem.title}</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-eaw-muted">
            <span>{problem.incident_count} linked incident{problem.incident_count !== 1 ? 's' : ''}</span>
            {problem.total_downtime_minutes != null && (
              <span>{problem.total_downtime_minutes}m total downtime</span>
            )}
          </div>
        </div>
        <button className="btn-secondary text-sm" onClick={() => navigate('/problems')}>
          Back to List
        </button>
      </div>

      {/* Description */}
      <CollapsibleSection title="Description" icon={<FileText className="w-4 h-4 text-eaw-primary" />}>
        <p className="text-sm text-eaw-font leading-relaxed">{problem.description ?? 'No description provided.'}</p>
      </CollapsibleSection>

      {/* Root Cause Analysis */}
      <CollapsibleSection title="Root Cause Analysis" icon={<SearchIcon className="w-4 h-4 text-eaw-danger" />}>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-eaw-muted uppercase">Root Cause</label>
            <p className="text-sm text-eaw-font mt-1">{problem.root_cause ?? 'Not yet identified'}</p>
          </div>
          {problem.root_cause_category && (
            <div>
              <label className="text-xs font-semibold text-eaw-muted uppercase">Category</label>
              <div className="mt-1">
                <span className="badge-info">{problem.root_cause_category}</span>
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Fix Plan */}
      <CollapsibleSection title="Fix Plan" icon={<Wrench className="w-4 h-4 text-eaw-warning" />}>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-eaw-muted uppercase">Permanent Fix</label>
            <p className="text-sm text-eaw-font mt-1">{problem.permanent_fix ?? 'No fix plan defined yet.'}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-eaw-muted uppercase">Fix Owner</label>
              <p className="text-sm text-eaw-font mt-1">{problem.fix_owner ?? 'Unassigned'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-eaw-muted uppercase">Due Date</label>
              <p className="text-sm text-eaw-font mt-1">{formatDate(problem.fix_due_date)}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-eaw-muted uppercase">Completed Date</label>
              <p className="text-sm text-eaw-font mt-1">{formatDate(problem.fix_completed_date)}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-eaw-muted uppercase">Estimated Cost</label>
              <p className="text-sm text-eaw-font mt-1">
                {problem.estimated_cost != null ? `$${problem.estimated_cost.toLocaleString()}` : '-'}
              </p>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-eaw-muted uppercase">Fix Status</label>
            <div className="mt-1">
              <span className={fixStatusBadge(problem.fix_status)}>{problem.fix_status.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Workaround */}
      {problem.workaround && (
        <CollapsibleSection title="Workaround" icon={<Shield className="w-4 h-4 text-eaw-info" />}>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-eaw-font">{problem.workaround}</p>
          </div>
        </CollapsibleSection>
      )}

      {/* Linked Incidents */}
      <CollapsibleSection title="Linked Incidents" icon={<AlertTriangle className="w-4 h-4 text-eaw-warning" />}>
        {(problem.incidents ?? []).length === 0 ? (
          <p className="text-sm text-eaw-muted">No incidents linked to this problem.</p>
        ) : (
          <table className="eaw-table">
            <thead>
              <tr>
                <th>Incident #</th>
                <th>Title</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Users Affected</th>
                <th>Reported</th>
              </tr>
            </thead>
            <tbody>
              {(problem.incidents ?? []).map((inc: Incident) => (
                <tr
                  key={inc.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/incidents/${inc.id}`)}
                >
                  <td className="text-eaw-link font-medium whitespace-nowrap">{inc.incident_number}</td>
                  <td className="max-w-[250px] truncate">{inc.title}</td>
                  <td><span className={severityBadge(inc.severity)}>{inc.severity}</span></td>
                  <td><span className={statusBadge(inc.status)}>{inc.status}</span></td>
                  <td>{inc.users_affected ?? '-'}</td>
                  <td className="text-sm text-eaw-muted whitespace-nowrap">{formatDate(inc.reported_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CollapsibleSection>

      {/* Known Error */}
      {problem.known_error === 1 && (
        <CollapsibleSection title="Known Error" icon={<Link2 className="w-4 h-4 text-eaw-danger" />}>
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-semibold text-red-700">This is a Known Error</span>
            </div>
            <p className="text-sm text-eaw-font mb-2">
              This problem has been documented as a known error with a documented workaround.
            </p>
            {problem.wiki_url && (
              <a
                href={problem.wiki_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-eaw-link hover:text-eaw-link-hover"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Knowledge Base Article
              </a>
            )}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}
