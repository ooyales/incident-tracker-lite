import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.incident import Incident
from app.models.timeline_entry import TimelineEntry
from app.errors import NotFoundError, BadRequestError

timeline_bp = Blueprint('timeline', __name__)


@timeline_bp.route('/<incident_id>', methods=['GET'])
def list_timeline(incident_id):
    """List all timeline entries for an incident, ordered by created_at ascending.
    ---
    tags:
      - Timeline
    parameters:
      - name: incident_id
        in: path
        type: string
        required: true
        description: Incident UUID
      - name: session_id
        in: query
        type: string
        required: false
        default: __default__
    responses:
      200:
        description: List of timeline entries
        schema:
          type: array
          items:
            $ref: '#/definitions/TimelineEntry'
      404:
        description: Incident not found
        schema:
          $ref: '#/definitions/Error'
    """
    session_id = request.args.get('session_id', '__default__')

    incident = Incident.query.filter_by(id=incident_id, session_id=session_id).first()
    if not incident:
        raise NotFoundError('Incident not found')

    entries = TimelineEntry.query.filter_by(
        incident_id=incident_id,
        session_id=session_id,
    ).order_by(TimelineEntry.created_at.asc()).all()

    return jsonify([e.to_dict() for e in entries])


@timeline_bp.route('/<incident_id>', methods=['POST'])
def create_timeline_entry(incident_id):
    """Add a new timeline entry to an incident.
    ---
    tags:
      - Timeline
    parameters:
      - name: incident_id
        in: path
        type: string
        required: true
        description: Incident UUID
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - content
          properties:
            content:
              type: string
              example: Identified root cause as memory leak in worker process
            entry_type:
              type: string
              enum: [update, status_change, assignment, resolution, communication]
              default: update
            author:
              type: string
            created_at:
              type: string
              format: date-time
              description: Defaults to current UTC time
            old_status:
              type: string
            new_status:
              type: string
            session_id:
              type: string
              default: __default__
    responses:
      201:
        description: Timeline entry created
        schema:
          $ref: '#/definitions/TimelineEntry'
      400:
        description: Validation error
        schema:
          $ref: '#/definitions/Error'
      404:
        description: Incident not found
        schema:
          $ref: '#/definitions/Error'
    """
    data = request.get_json()
    if not data:
        raise BadRequestError('Missing request body')

    session_id = data.get('session_id', '__default__')
    incident = Incident.query.filter_by(id=incident_id, session_id=session_id).first()
    if not incident:
        raise NotFoundError('Incident not found')

    content = data.get('content')
    if not content:
        raise BadRequestError('Content is required')

    now = datetime.now(timezone.utc).isoformat()

    entry = TimelineEntry(
        id=str(uuid.uuid4()),
        incident_id=incident_id,
        entry_type=data.get('entry_type', 'update'),
        content=content,
        author=data.get('author'),
        created_at=data.get('created_at', now),
        old_status=data.get('old_status'),
        new_status=data.get('new_status'),
        session_id=session_id,
    )
    db.session.add(entry)

    # Update incident's updated_at
    incident.updated_at = now
    db.session.commit()

    return jsonify(entry.to_dict()), 201
