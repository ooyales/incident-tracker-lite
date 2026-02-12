import { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingDown, Shield, BarChart3, Server, PieChart as PieChartIcon } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const mttrData = [
  { month: 'Sep', mttr: 8.2 },
  { month: 'Oct', mttr: 7.5 },
  { month: 'Nov', mttr: 6.1 },
  { month: 'Dec', mttr: 5.8 },
  { month: 'Jan', mttr: 4.9 },
  { month: 'Feb', mttr: 4.2 },
];

const slaData = [
  { severity: 'Critical', compliance: 82, target: 95 },
  { severity: 'High', compliance: 88, target: 90 },
  { severity: 'Medium', compliance: 94, target: 85 },
  { severity: 'Low', compliance: 97, target: 80 },
];

const volumeData = [
  { month: 'Sep', incidents: 18 },
  { month: 'Oct', incidents: 22 },
  { month: 'Nov', incidents: 15 },
  { month: 'Dec', incidents: 12 },
  { month: 'Jan', incidents: 19 },
  { month: 'Feb', incidents: 14 },
];

const topSystemsData = [
  { name: 'API Gateway', incidents: 8, color: '#337ab7' },
  { name: 'Auth Service', incidents: 6, color: '#d9534f' },
  { name: 'Payment DB', incidents: 5, color: '#f0ad4e' },
  { name: 'CDN Edge', incidents: 4, color: '#5bc0de' },
  { name: 'Email Service', incidents: 3, color: '#5cb85c' },
  { name: 'Load Balancer', incidents: 2, color: '#777' },
];

const categoryData = [
  { name: 'Infrastructure', value: 35, color: '#337ab7' },
  { name: 'Application', value: 28, color: '#5cb85c' },
  { name: 'Security', value: 15, color: '#d9534f' },
  { name: 'Network', value: 12, color: '#f0ad4e' },
  { name: 'Database', value: 10, color: '#5bc0de' },
];

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

export default function MetricsPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-eaw-font mb-4">Metrics & Analytics</h1>

      <div className="eaw-page-summary">
        Performance metrics and trend analysis for incident management. Data shown covers the last 6 months.
      </div>

      {/* Top row: MTTR Trend + SLA Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <CollapsibleSection
          title="MTTR Trend"
          icon={<TrendingDown className="w-4 h-4 text-eaw-success" />}
        >
          <p className="text-xs text-eaw-muted mb-3">Mean Time To Resolve (hours) - showing improvement over time</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mttrData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit="h" />
                <Tooltip
                  formatter={(value: number) => [`${value}h`, 'MTTR']}
                  contentStyle={{ fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="mttr"
                  stroke="#5cb85c"
                  strokeWidth={2}
                  dot={{ fill: '#5cb85c', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="SLA Compliance by Severity"
          icon={<Shield className="w-4 h-4 text-eaw-primary" />}
        >
          <p className="text-xs text-eaw-muted mb-3">Current SLA compliance vs target for each severity level</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slaData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="severity" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit="%" domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend />
                <Bar dataKey="compliance" name="Actual" fill="#337ab7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" name="Target" fill="#ddd" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CollapsibleSection>
      </div>

      {/* Middle row: Incident Volume + Top Systems */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <CollapsibleSection
          title="Incident Volume"
          icon={<BarChart3 className="w-4 h-4 text-eaw-info" />}
        >
          <p className="text-xs text-eaw-muted mb-3">Monthly incident count over the last 6 months</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="incidents"
                  stroke="#5bc0de"
                  fill="#d9edf7"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Top Affected Systems"
          icon={<Server className="w-4 h-4 text-eaw-warning" />}
        >
          <p className="text-xs text-eaw-muted mb-3">Assets with the highest incident counts</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topSystemsData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 90, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="incidents" radius={[0, 4, 4, 0]}>
                  {topSystemsData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CollapsibleSection>
      </div>

      {/* Category Distribution */}
      <CollapsibleSection
        title="Category Distribution"
        icon={<PieChartIcon className="w-4 h-4 text-eaw-primary" />}
      >
        <p className="text-xs text-eaw-muted mb-3">Distribution of incidents across categories (last 6 months)</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value} incidents`, 'Count']}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CollapsibleSection>
    </div>
  );
}
