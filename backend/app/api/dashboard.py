from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.incident import Incident
from app.models.timeline_entry import TimelineEntry
from app.models.problem import Problem
from app.services.metrics import calculate_mttr, calculate_mtta, calculate_sla_compliance
from datetime import datetime, timezone

dashboard_bp = Blueprint('dashboard', __name__)

SEVERITY_ORDER = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}

SEVERITY_COLORS = {
    'Critical': '#d9534f',
    'High': '#f0ad4e',
    'Medium': '#5bc0de',
    'Low': '#777',
}

STATUS_COLORS = {
    'Open': '#d9534f',
    'Investigating': '#f0ad4e',
    'Identified': '#5bc0de',
    'Monitoring': '#5cb85c',
    'Resolved': '#337ab7',
    'Closed': '#777',
}

CATEGORY_COLORS = {
    'Outage': '#d9534f',
    'Degradation': '#f0ad4e',
    'Security': '#8B0000',
    'Data Loss': '#5bc0de',
    'Access Issue': '#337ab7',
    'Other': '#777',
}


@dashboard_bp.route('', methods=['GET'])
def get_dashboard():
    """Get dashboard summary with KPIs, charts, and recent activity.
    ---
    tags:
      - Dashboard
    parameters:
      - name: session_id
        in: query
        type: string
        required: false
        default: __default__
        description: Session ID for demo isolation
    responses:
      200:
        description: Dashboard data
        schema:
          type: object
          properties:
            active_incidents:
              type: integer
              description: Count of non-resolved/closed incidents
            resolved_today:
              type: integer
              description: Count of incidents resolved today
            mttr_hours:
              type: number
              description: Mean Time To Resolve in hours
            mtta_minutes:
              type: number
              description: Mean Time To Acknowledge in minutes
            sla_compliance_pct:
              type: number
              description: SLA compliance percentage
            incidents_by_severity:
              type: array
              items:
                type: object
                properties:
                  name:
                    type: string
                  value:
                    type: integer
                  color:
                    type: string
            incidents_by_status:
              type: array
              items:
                type: object
                properties:
                  name:
                    type: string
                  value:
                    type: integer
                  color:
                    type: string
            incidents_by_category:
              type: array
              items:
                type: object
                properties:
                  name:
                    type: string
                  value:
                    type: integer
                  color:
                    type: string
            recent_activity:
              type: array
              items:
                $ref: '#/definitions/TimelineEntry'
            trending_problems:
              type: array
              items:
                $ref: '#/definitions/Problem'
            open_incidents:
              type: array
              items:
                $ref: '#/definitions/Incident'
    """
    session_id = request.args.get('session_id', '__default__')

    # Active incidents (non-resolved, non-closed)
    active_incidents_query = Incident.query.filter(
        Incident.session_id == session_id,
        ~Incident.status.in_(['resolved', 'closed']),
    )
    active_count = active_incidents_query.count()

    # Resolved today
    today_str = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    resolved_today = Incident.query.filter(
        Incident.session_id == session_id,
        Incident.status.in_(['resolved', 'closed']),
        Incident.resolved_at.like(f'{today_str}%'),
    ).count()

    # Metrics
    mttr = calculate_mttr(session_id)
    mtta = calculate_mtta(session_id)
    sla_pct = calculate_sla_compliance(session_id)

    # Incidents by severity
    all_incidents = Incident.query.filter_by(session_id=session_id).all()

    severity_counts = {}
    status_counts = {}
    category_counts = {}
    for inc in all_incidents:
        sev = (inc.severity or 'medium').capitalize()
        severity_counts[sev] = severity_counts.get(sev, 0) + 1

        stat = (inc.status or 'open').capitalize()
        status_counts[stat] = status_counts.get(stat, 0) + 1

        cat = (inc.category or 'other').replace('_', ' ').title()
        category_counts[cat] = category_counts.get(cat, 0) + 1

    incidents_by_severity = [
        {'name': name, 'value': count, 'color': SEVERITY_COLORS.get(name, '#777')}
        for name, count in severity_counts.items()
    ]

    incidents_by_status = [
        {'name': name, 'value': count, 'color': STATUS_COLORS.get(name, '#777')}
        for name, count in status_counts.items()
    ]

    incidents_by_category = [
        {'name': name, 'value': count, 'color': CATEGORY_COLORS.get(name, '#777')}
        for name, count in category_counts.items()
    ]

    # Recent activity — last 10 timeline entries with incident_number
    recent_entries = db.session.query(TimelineEntry, Incident.incident_number).join(
        Incident, TimelineEntry.incident_id == Incident.id
    ).filter(
        Incident.session_id == session_id,
    ).order_by(TimelineEntry.created_at.desc()).limit(10).all()

    recent_activity = []
    for entry, inc_number in recent_entries:
        d = entry.to_dict()
        d['incident_number'] = inc_number
        recent_activity.append(d)

    # Trending problems — top 3 by incident_count
    trending = Problem.query.filter_by(session_id=session_id).order_by(
        Problem.incident_count.desc()
    ).limit(3).all()
    trending_problems = [p.to_dict() for p in trending]

    # Open incidents sorted by severity then reported_at
    active_incidents = active_incidents_query.all()
    active_incidents.sort(key=lambda i: (
        SEVERITY_ORDER.get(i.severity, 99),
        i.reported_at or '',
    ))
    open_incidents = [inc.to_dict() for inc in active_incidents]

    return jsonify({
        'active_incidents': active_count,
        'resolved_today': resolved_today,
        'mttr_hours': mttr,
        'mtta_minutes': mtta,
        'sla_compliance_pct': sla_pct,
        'incidents_by_severity': incidents_by_severity,
        'incidents_by_status': incidents_by_status,
        'incidents_by_category': incidents_by_category,
        'recent_activity': recent_activity,
        'trending_problems': trending_problems,
        'open_incidents': open_incidents,
    })
