import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.incident import Incident
from app.models.timeline_entry import TimelineEntry
from app.models.incident_asset import IncidentAsset
from app.models.incident_responder import IncidentResponder
from app.models.communication import Communication
from app.services.incident_number import generate_incident_number
from app.errors import NotFoundError, BadRequestError

incidents_bp = Blueprint('incidents', __name__)

SEVERITY_ORDER = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
VALID_SEVERITIES = {'critical', 'high', 'medium', 'low'}
VALID_STATUSES = {'open', 'investigating', 'identified', 'monitoring', 'resolved', 'closed'}
VALID_CATEGORIES = {'outage', 'degradation', 'security', 'data_loss', 'access_issue', 'other'}


@incidents_bp.route('', methods=['GET'])
def list_incidents():
    session_id = request.args.get('session_id', '__default__')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = Incident.query.filter_by(session_id=session_id)

    # Filters
    status = request.args.get('status')
    if status:
        query = query.filter(Incident.status == status)

    severity = request.args.get('severity')
    if severity:
        query = query.filter(Incident.severity == severity)

    category = request.args.get('category')
    if category:
        query = query.filter(Incident.category == category)

    assigned_to = request.args.get('assigned_to')
    if assigned_to:
        query = query.filter(Incident.assigned_to.ilike(f'%{assigned_to}%'))

    search = request.args.get('search')
    if search:
        search_term = f'%{search}%'
        query = query.filter(
            db.or_(
                Incident.title.ilike(search_term),
                Incident.description.ilike(search_term),
                Incident.incident_number.ilike(search_term),
            )
        )

    # Order by severity then reported_at descending
    total = query.count()
    incidents = query.order_by(Incident.reported_at.desc()).offset(
        (page - 1) * per_page
    ).limit(per_page).all()

    return jsonify({
        'incidents': [i.to_dict() for i in incidents],
        'total': total,
        'page': page,
        'per_page': per_page,
    })


@incidents_bp.route('', methods=['POST'])
def create_incident():
    data = request.get_json()
    if not data:
        raise BadRequestError('Missing request body')

    title = data.get('title')
    if not title:
        raise BadRequestError('Title is required')

    session_id = data.get('session_id', '__default__')
    now = datetime.now(timezone.utc).isoformat()

    incident_number = generate_incident_number()

    incident = Incident(
        id=str(uuid.uuid4()),
        incident_number=incident_number,
        title=title,
        description=data.get('description'),
        severity=data.get('severity', 'medium'),
        category=data.get('category', 'other'),
        status='open',
        reported_at=data.get('reported_at', now),
        detected_at=data.get('detected_at'),
        impact_description=data.get('impact_description'),
        users_affected=data.get('users_affected'),
        business_impact=data.get('business_impact'),
        data_breach=data.get('data_breach', 0),
        reported_by=data.get('reported_by'),
        assigned_to=data.get('assigned_to'),
        wiki_url=data.get('wiki_url'),
        tags=data.get('tags', '[]'),
        created_at=now,
        updated_at=now,
        session_id=session_id,
    )
    db.session.add(incident)

    # Create initial timeline entry
    timeline = TimelineEntry(
        id=str(uuid.uuid4()),
        incident_id=incident.id,
        entry_type='update',
        content=f'Incident created: {title}',
        author=data.get('reported_by', 'System'),
        created_at=now,
        session_id=session_id,
    )
    db.session.add(timeline)

    db.session.commit()
    return jsonify(incident.to_dict()), 201


@incidents_bp.route('/<incident_id>', methods=['GET'])
def get_incident(incident_id):
    session_id = request.args.get('session_id', '__default__')

    incident = Incident.query.filter_by(id=incident_id, session_id=session_id).first()
    if not incident:
        raise NotFoundError('Incident not found')

    result = incident.to_dict()
    result['timeline_entries'] = [
        e.to_dict() for e in incident.timeline_entries.order_by(TimelineEntry.created_at.asc()).all()
    ]
    result['assets'] = [a.to_dict() for a in incident.assets.all()]
    result['responders'] = [r.to_dict() for r in incident.responders.all()]
    result['communications'] = [c.to_dict() for c in incident.communications.all()]

    # Include problem info if linked
    if incident.problem:
        result['problem'] = incident.problem.to_dict()

    return jsonify(result)


@incidents_bp.route('/<incident_id>', methods=['PUT'])
def update_incident(incident_id):
    data = request.get_json()
    if not data:
        raise BadRequestError('Missing request body')

    session_id = data.get('session_id', '__default__')
    incident = Incident.query.filter_by(id=incident_id, session_id=session_id).first()
    if not incident:
        raise NotFoundError('Incident not found')

    now = datetime.now(timezone.utc).isoformat()

    updatable_fields = [
        'title', 'description', 'severity', 'category', 'status',
        'detected_at', 'acknowledged_at', 'resolved_at', 'closed_at',
        'impact_description', 'users_affected', 'business_impact',
        'data_breach', 'reported_by', 'assigned_to', 'resolved_by',
        'resolution_summary', 'root_cause', 'workaround', 'problem_id',
        'wiki_url', 'post_incident_completed', 'lessons_learned',
        'preventive_actions', 'tags',
    ]

    for field in updatable_fields:
        if field in data:
            setattr(incident, field, data[field])

    incident.updated_at = now
    db.session.commit()

    return jsonify(incident.to_dict())


@incidents_bp.route('/<incident_id>/status', methods=['PUT'])
def update_status(incident_id):
    data = request.get_json()
    if not data:
        raise BadRequestError('Missing request body')

    new_status = data.get('status')
    if not new_status or new_status not in VALID_STATUSES:
        raise BadRequestError(f'Invalid status. Must be one of: {", ".join(VALID_STATUSES)}')

    session_id = data.get('session_id', '__default__')
    incident = Incident.query.filter_by(id=incident_id, session_id=session_id).first()
    if not incident:
        raise NotFoundError('Incident not found')

    now = datetime.now(timezone.utc).isoformat()
    old_status = incident.status
    incident.status = new_status
    incident.updated_at = now

    # Auto-set timestamps based on status
    if new_status == 'investigating' and not incident.acknowledged_at:
        incident.acknowledged_at = now
    elif new_status == 'resolved':
        incident.resolved_at = now
    elif new_status == 'closed':
        incident.closed_at = now

    # Create timeline entry for status change
    author = data.get('author', 'System')
    content = data.get('content', f'Status changed from {old_status} to {new_status}')
    timeline = TimelineEntry(
        id=str(uuid.uuid4()),
        incident_id=incident.id,
        entry_type='status_change',
        content=content,
        author=author,
        created_at=now,
        old_status=old_status,
        new_status=new_status,
        session_id=session_id,
    )
    db.session.add(timeline)
    db.session.commit()

    return jsonify(incident.to_dict())


@incidents_bp.route('/<incident_id>/assign', methods=['PUT'])
def assign_incident(incident_id):
    data = request.get_json()
    if not data:
        raise BadRequestError('Missing request body')

    assigned_to = data.get('assigned_to')
    if not assigned_to:
        raise BadRequestError('assigned_to is required')

    session_id = data.get('session_id', '__default__')
    incident = Incident.query.filter_by(id=incident_id, session_id=session_id).first()
    if not incident:
        raise NotFoundError('Incident not found')

    now = datetime.now(timezone.utc).isoformat()
    old_assignee = incident.assigned_to
    incident.assigned_to = assigned_to
    incident.updated_at = now

    # Create timeline entry
    content = f'Assigned to {assigned_to}'
    if old_assignee:
        content = f'Reassigned from {old_assignee} to {assigned_to}'

    timeline = TimelineEntry(
        id=str(uuid.uuid4()),
        incident_id=incident.id,
        entry_type='assignment',
        content=content,
        author=data.get('author', 'System'),
        created_at=now,
        session_id=session_id,
    )
    db.session.add(timeline)
    db.session.commit()

    return jsonify(incident.to_dict())


@incidents_bp.route('/<incident_id>/resolve', methods=['PUT'])
def resolve_incident(incident_id):
    data = request.get_json()
    if not data:
        raise BadRequestError('Missing request body')

    session_id = data.get('session_id', '__default__')
    incident = Incident.query.filter_by(id=incident_id, session_id=session_id).first()
    if not incident:
        raise NotFoundError('Incident not found')

    now = datetime.now(timezone.utc).isoformat()
    old_status = incident.status
    incident.status = 'resolved'
    incident.resolved_at = data.get('resolved_at', now)
    incident.resolved_by = data.get('resolved_by')
    incident.resolution_summary = data.get('resolution_summary')
    incident.root_cause = data.get('root_cause', incident.root_cause)
    incident.updated_at = now

    # Create resolution timeline entry
    resolution_text = data.get('resolution_summary', 'Incident resolved')
    timeline = TimelineEntry(
        id=str(uuid.uuid4()),
        incident_id=incident.id,
        entry_type='resolution',
        content=resolution_text,
        author=data.get('resolved_by', 'System'),
        created_at=now,
        old_status=old_status,
        new_status='resolved',
        session_id=session_id,
    )
    db.session.add(timeline)
    db.session.commit()

    return jsonify(incident.to_dict())


@incidents_bp.route('/<incident_id>/report', methods=['GET'])
def get_report(incident_id):
    session_id = request.args.get('session_id', '__default__')
    incident = Incident.query.filter_by(id=incident_id, session_id=session_id).first()
    if not incident:
        raise NotFoundError('Incident not found')

    timeline = [
        e.to_dict() for e in incident.timeline_entries.order_by(TimelineEntry.created_at.asc()).all()
    ]
    assets = [a.to_dict() for a in incident.assets.all()]
    responders = [r.to_dict() for r in incident.responders.all()]
    communications = [c.to_dict() for c in incident.communications.all()]

    # Calculate duration
    duration_hours = None
    if incident.reported_at and incident.resolved_at:
        try:
            from app.services.metrics import _parse_dt
            reported = _parse_dt(incident.reported_at)
            resolved = _parse_dt(incident.resolved_at)
            if reported and resolved:
                duration_hours = round((resolved - reported).total_seconds() / 3600.0, 2)
        except Exception:
            pass

    report = {
        'incident': incident.to_dict(),
        'timeline': timeline,
        'affected_assets': assets,
        'responders': responders,
        'communications': communications,
        'duration_hours': duration_hours,
        'problem': incident.problem.to_dict() if incident.problem else None,
        'report_generated_at': datetime.now(timezone.utc).isoformat(),
    }

    return jsonify(report)
