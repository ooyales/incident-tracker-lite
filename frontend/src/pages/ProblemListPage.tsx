import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bug, Search } from 'lucide-react';
import { fetchProblems } from '@/api/problems';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Problem } from '@/types';

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

const mockProblems: Problem[] = [
  {
    id: 'p1', problem_number: 'PRB-001', title: 'Recurring auth service memory leak', description: 'The authentication service experiences gradual memory growth that eventually leads to OOM kills. This has caused multiple incidents over the past month.', root_cause: 'Memory leak in JWT validation library when handling expired tokens', root_cause_category: 'Software Bug', permanent_fix: 'Upgrade auth library to v3.2.1 which includes the memory leak fix', fix_status: 'in_progress', fix_owner: 'john.doe', fix_due_date: '2026-02-28', fix_completed_date: null, estimated_cost: 5000, incident_count: 5, total_downtime_minutes: 120, known_error: 1, wiki_url: 'https://wiki.example.com/ke/auth-memory-leak', workaround: 'Restart auth service pods every 4 hours via cron job', priority: 'high', created_at: '2026-01-15T00:00:00Z', updated_at: '2026-02-10T00:00:00Z',
  },
  {
    id: 'p2', problem_number: 'PRB-002', title: 'Database connection pool exhaustion', description: 'Production database frequently runs out of available connections during peak hours.', root_cause: 'Connection leak in ORM layer - connections not properly returned to pool on error paths', root_cause_category: 'Configuration', permanent_fix: 'Configure connection pool limits and add connection leak detection', fix_status: 'open', fix_owner: 'dba_team', fix_due_date: '2026-03-01', fix_completed_date: null, estimated_cost: 2000, incident_count: 3, total_downtime_minutes: 60, known_error: 0, wiki_url: null, workaround: 'Manually kill idle connections during peak hours', priority: 'medium', created_at: '2026-01-20T00:00:00Z', updated_at: '2026-02-08T00:00:00Z',
  },
  {
    id: 'p3', problem_number: 'PRB-003', title: 'SSL certificate expiry automation failure', description: 'Auto-renewal of SSL certificates via Let\'s Encrypt is failing silently.', root_cause: null, root_cause_category: 'Process Gap', permanent_fix: null, fix_status: 'open', fix_owner: null, fix_due_date: null, fix_completed_date: null, estimated_cost: null, incident_count: 2, total_downtime_minutes: 30, known_error: 0, wiki_url: null, workaround: 'Manual cert renewal using certbot', priority: 'low', created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-05T00:00:00Z',
  },
  {
    id: 'p4', problem_number: 'PRB-004', title: 'CDN origin failover not triggering', description: 'When the primary origin goes down, CDN does not automatically failover to the backup origin.', root_cause: 'CDN health check configuration using wrong endpoint', root_cause_category: 'Configuration', permanent_fix: 'Update CDN health check to use /healthz endpoint', fix_status: 'resolved', fix_owner: 'infra_team', fix_due_date: '2026-02-01', fix_completed_date: '2026-01-30', estimated_cost: 500, incident_count: 1, total_downtime_minutes: 45, known_error: 0, wiki_url: null, workaround: null, priority: 'medium', created_at: '2026-01-10T00:00:00Z', updated_at: '2026-01-30T00:00:00Z',
  },
  {
    id: 'p5', problem_number: 'PRB-005', title: 'Email delivery delays during high volume', description: 'Transactional emails experience significant delays when volume exceeds 10k/hour.', root_cause: 'SMTP relay rate limiting imposed by provider', root_cause_category: 'Capacity', permanent_fix: 'Migrate to dedicated SMTP provider with higher throughput', fix_status: 'in_progress', fix_owner: 'messaging_team', fix_due_date: '2026-03-15', fix_completed_date: null, estimated_cost: 15000, incident_count: 4, total_downtime_minutes: 180, known_error: 1, wiki_url: 'https://wiki.example.com/ke/email-delays', workaround: 'Queue prioritization for critical transactional emails', priority: 'high', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-02-11T00:00:00Z',
  },
];

const FIX_STATUSES = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'];
const PRIORITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];

export default function ProblemListPage() {
  const isMobile = useIsMobile();
  const [problems, setProblems] = useState<Problem[]>(mockProblems);
  const [loading, setLoading] = useState(true);
  const [fixStatus, setFixStatus] = useState('All');
  const [priority, setPriority] = useState('All');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const params: Record<string, string> = {};
    if (fixStatus !== 'All') params.fix_status = fixStatus.toLowerCase().replace(' ', '_');
    if (priority !== 'All') params.priority = priority.toLowerCase();

    fetchProblems(params)
      .then((d) => { if (!cancelled) setProblems(d); })
      .catch(() => { /* use mock */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fixStatus, priority]);

  const filtered = problems.filter((p) => {
    const statusMatch = fixStatus === 'All' || p.fix_status.toLowerCase().replace('_', ' ') === fixStatus.toLowerCase();
    const priorityMatch = priority === 'All' || p.priority.toLowerCase() === priority.toLowerCase();
    const searchMatch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.problem_number.toLowerCase().includes(search.toLowerCase());
    return statusMatch && priorityMatch && searchMatch;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-eaw-font flex items-center gap-2">
          <Bug className="w-5 h-5" />
          Problems
        </h1>
      </div>

      {/* Filter Bar */}
      <div className="eaw-card mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-eaw-muted" />
            <input
              type="text"
              className="w-full py-2 pr-3 pl-9 text-sm border border-eaw-border rounded outline-none transition-colors focus:border-eaw-primary focus:ring-1 focus:ring-eaw-primary"
              placeholder="Search problems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="select-field w-full sm:w-auto" value={fixStatus} onChange={(e) => setFixStatus(e.target.value)}>
            {FIX_STATUSES.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
          </select>
          <select className="select-field w-full sm:w-auto" value={priority} onChange={(e) => setPriority(e.target.value)}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p === 'All' ? 'All Priorities' : p}</option>)}
          </select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="eaw-section hidden md:block">
        <table className="eaw-table">
          <thead>
            <tr>
              <th>Problem #</th>
              <th>Title</th>
              <th>Root Cause Category</th>
              <th>Incident Count</th>
              <th>Fix Status</th>
              <th>Priority</th>
              <th>Fix Owner</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-eaw-muted py-8">
                  No problems found matching your filters.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/problems/${p.id}`)}
                >
                  <td className="text-eaw-link font-medium whitespace-nowrap">{p.problem_number}</td>
                  <td className="max-w-[300px] truncate">{p.title}</td>
                  <td>{p.root_cause_category ?? '-'}</td>
                  <td>
                    <span className="badge-danger">{p.incident_count}</span>
                  </td>
                  <td><span className={fixStatusBadge(p.fix_status)}>{p.fix_status.replace('_', ' ')}</span></td>
                  <td><span className={priorityBadge(p.priority)}>{p.priority}</span></td>
                  <td className="whitespace-nowrap">{p.fix_owner ?? '-'}</td>
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
            No problems found matching your filters.
          </div>
        ) : (
          filtered.map((p) => (
            <div
              key={p.id}
              className="mobile-card-row clickable"
              onClick={() => navigate(`/problems/${p.id}`)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-eaw-link font-medium text-sm">{p.problem_number}</span>
                <span className={priorityBadge(p.priority)}>{p.priority}</span>
              </div>
              <p className="text-sm font-semibold text-eaw-font mb-2 line-clamp-2">{p.title}</p>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={fixStatusBadge(p.fix_status)}>{p.fix_status.replace('_', ' ')}</span>
                <span className="badge-danger">{p.incident_count} incidents</span>
              </div>
              <div className="flex items-center justify-between text-xs text-eaw-muted">
                <span>{p.root_cause_category ?? '-'}</span>
                <span>{p.fix_owner ?? 'Unassigned'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
