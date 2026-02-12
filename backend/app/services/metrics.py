from datetime import datetime
from app.extensions import db
from app.models.incident import Incident
from app.models.sla_target import SLATarget


def _parse_dt(dt_str):
    """Parse an ISO format datetime string."""
    if not dt_str:
        return None
    try:
        # Handle various ISO formats
        dt_str = dt_str.replace('Z', '+00:00')
        if '+' in dt_str or dt_str.endswith('Z'):
            return datetime.fromisoformat(dt_str)
        return datetime.fromisoformat(dt_str)
    except (ValueError, TypeError):
        return None


def calculate_mttr(session_id='__default__'):
    """Calculate Mean Time To Resolve in hours for resolved incidents."""
    resolved = Incident.query.filter(
        Incident.session_id == session_id,
        Incident.status.in_(['resolved', 'closed']),
        Incident.reported_at.isnot(None),
        Incident.resolved_at.isnot(None),
    ).all()

    if not resolved:
        return 0.0

    total_hours = 0.0
    count = 0
    for inc in resolved:
        reported = _parse_dt(inc.reported_at)
        resolved_dt = _parse_dt(inc.resolved_at)
        if reported and resolved_dt:
            diff = (resolved_dt - reported).total_seconds() / 3600.0
            if diff >= 0:
                total_hours += diff
                count += 1

    return round(total_hours / count, 2) if count > 0 else 0.0


def calculate_mtta(session_id='__default__'):
    """Calculate Mean Time To Acknowledge in minutes."""
    acknowledged = Incident.query.filter(
        Incident.session_id == session_id,
        Incident.reported_at.isnot(None),
        Incident.acknowledged_at.isnot(None),
    ).all()

    if not acknowledged:
        return 0.0

    total_minutes = 0.0
    count = 0
    for inc in acknowledged:
        reported = _parse_dt(inc.reported_at)
        ack = _parse_dt(inc.acknowledged_at)
        if reported and ack:
            diff = (ack - reported).total_seconds() / 60.0
            if diff >= 0:
                total_minutes += diff
                count += 1

    return round(total_minutes / count, 2) if count > 0 else 0.0


def calculate_sla_compliance(session_id='__default__'):
    """Calculate percentage of resolved incidents within SLA targets."""
    sla_targets = {
        t.severity: t for t in SLATarget.query.filter_by(session_id=session_id).all()
    }

    if not sla_targets:
        return 100.0

    resolved = Incident.query.filter(
        Incident.session_id == session_id,
        Incident.status.in_(['resolved', 'closed']),
        Incident.reported_at.isnot(None),
        Incident.resolved_at.isnot(None),
    ).all()

    if not resolved:
        return 100.0

    compliant = 0
    total = 0
    for inc in resolved:
        severity = inc.severity
        target = sla_targets.get(severity)
        if not target or not target.resolution_target_minutes:
            compliant += 1
            total += 1
            continue

        reported = _parse_dt(inc.reported_at)
        resolved_dt = _parse_dt(inc.resolved_at)
        if reported and resolved_dt:
            diff_minutes = (resolved_dt - reported).total_seconds() / 60.0
            total += 1
            if diff_minutes <= target.resolution_target_minutes:
                compliant += 1

    return round((compliant / total) * 100.0, 1) if total > 0 else 100.0
