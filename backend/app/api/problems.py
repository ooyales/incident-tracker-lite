import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.problem import Problem
from app.models.incident import Incident
from app.services.incident_number import generate_problem_number
from app.errors import NotFoundError, BadRequestError

problems_bp = Blueprint('problems', __name__)


@problems_bp.route('', methods=['GET'])
def list_problems():
    """List all problems with optional filters and pagination.
    ---
    tags:
      - Problems
    parameters:
      - name: session_id
        in: query
        type: string
        required: false
        default: __default__
        description: Session ID for demo isolation
      - name: page
        in: query
        type: integer
        required: false
        default: 1
      - name: per_page
        in: query
        type: integer
        required: false
        default: 20
      - name: fix_status
        in: query
        type: string
        required: false
        description: Filter by fix status
        enum: [open, in_progress, implemented, verified]
      - name: priority
        in: query
        type: string
        required: false
        enum: [critical, high, medium, low]
    responses:
      200:
        description: Paginated list of problems
        schema:
          type: object
          properties:
            problems:
              type: array
              items:
                $ref: '#/definitions/Problem'
            total:
              type: integer
            page:
              type: integer
            per_page:
              type: integer
    """
    session_id = request.args.get('session_id', '__default__')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = Problem.query.filter_by(session_id=session_id)

    fix_status = request.args.get('fix_status')
    if fix_status:
        query = query.filter(Problem.fix_status == fix_status)

    priority = request.args.get('priority')
    if priority:
        query = query.filter(Problem.priority == priority)

    total = query.count()
    problems = query.order_by(Problem.created_at.desc()).offset(
        (page - 1) * per_page
    ).limit(per_page).all()

    return jsonify({
        'problems': [p.to_dict() for p in problems],
        'total': total,
        'page': page,
        'per_page': per_page,
    })


@problems_bp.route('', methods=['POST'])
def create_problem():
    """Create a new problem record. Auto-generates problem number.
    ---
    tags:
      - Problems
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - title
          properties:
            title:
              type: string
              example: Recurring memory leak in worker pool
            description:
              type: string
            root_cause:
              type: string
            root_cause_category:
              type: string
            permanent_fix:
              type: string
            fix_status:
              type: string
              enum: [open, in_progress, implemented, verified]
              default: open
            fix_owner:
              type: string
            fix_due_date:
              type: string
              format: date
            estimated_cost:
              type: number
            known_error:
              type: integer
              default: 0
            wiki_url:
              type: string
            workaround:
              type: string
            priority:
              type: string
              enum: [critical, high, medium, low]
              default: medium
            session_id:
              type: string
              default: __default__
    responses:
      201:
        description: Problem created
        schema:
          $ref: '#/definitions/Problem'
      400:
        description: Validation error
        schema:
          $ref: '#/definitions/Error'
    """
    data = request.get_json()
    if not data:
        raise BadRequestError('Missing request body')

    title = data.get('title')
    if not title:
        raise BadRequestError('Title is required')

    session_id = data.get('session_id', '__default__')
    now = datetime.now(timezone.utc).isoformat()
    problem_number = generate_problem_number()

    problem = Problem(
        id=str(uuid.uuid4()),
        problem_number=problem_number,
        title=title,
        description=data.get('description'),
        root_cause=data.get('root_cause'),
        root_cause_category=data.get('root_cause_category'),
        permanent_fix=data.get('permanent_fix'),
        fix_status=data.get('fix_status', 'open'),
        fix_owner=data.get('fix_owner'),
        fix_due_date=data.get('fix_due_date'),
        estimated_cost=data.get('estimated_cost'),
        known_error=data.get('known_error', 0),
        wiki_url=data.get('wiki_url'),
        workaround=data.get('workaround'),
        priority=data.get('priority', 'medium'),
        created_at=now,
        updated_at=now,
        session_id=session_id,
    )
    db.session.add(problem)
    db.session.commit()

    return jsonify(problem.to_dict()), 201


@problems_bp.route('/<problem_id>', methods=['GET'])
def get_problem(problem_id):
    """Get a single problem by ID with linked incidents.
    ---
    tags:
      - Problems
    parameters:
      - name: problem_id
        in: path
        type: string
        required: true
        description: Problem UUID
      - name: session_id
        in: query
        type: string
        required: false
        default: __default__
    responses:
      200:
        description: Problem details with linked incidents
        schema:
          allOf:
            - $ref: '#/definitions/Problem'
            - type: object
              properties:
                incidents:
                  type: array
                  items:
                    $ref: '#/definitions/Incident'
      404:
        description: Problem not found
        schema:
          $ref: '#/definitions/Error'
    """
    session_id = request.args.get('session_id', '__default__')
    problem = Problem.query.filter_by(id=problem_id, session_id=session_id).first()
    if not problem:
        raise NotFoundError('Problem not found')

    result = problem.to_dict()
    # Include linked incidents
    linked_incidents = Incident.query.filter_by(
        problem_id=problem_id, session_id=session_id
    ).all()
    result['incidents'] = [i.to_dict() for i in linked_incidents]

    return jsonify(result)


@problems_bp.route('/<problem_id>', methods=['PUT'])
def update_problem(problem_id):
    """Update an existing problem record.
    ---
    tags:
      - Problems
    parameters:
      - name: problem_id
        in: path
        type: string
        required: true
        description: Problem UUID
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            title:
              type: string
            description:
              type: string
            root_cause:
              type: string
            root_cause_category:
              type: string
            permanent_fix:
              type: string
            fix_status:
              type: string
              enum: [open, in_progress, implemented, verified]
            fix_owner:
              type: string
            fix_due_date:
              type: string
              format: date
            fix_completed_date:
              type: string
              format: date
            estimated_cost:
              type: number
            incident_count:
              type: integer
            total_downtime_minutes:
              type: integer
            known_error:
              type: integer
            wiki_url:
              type: string
            workaround:
              type: string
            priority:
              type: string
              enum: [critical, high, medium, low]
            session_id:
              type: string
              default: __default__
    responses:
      200:
        description: Updated problem
        schema:
          $ref: '#/definitions/Problem'
      400:
        description: Missing request body
        schema:
          $ref: '#/definitions/Error'
      404:
        description: Problem not found
        schema:
          $ref: '#/definitions/Error'
    """
    data = request.get_json()
    if not data:
        raise BadRequestError('Missing request body')

    session_id = data.get('session_id', '__default__')
    problem = Problem.query.filter_by(id=problem_id, session_id=session_id).first()
    if not problem:
        raise NotFoundError('Problem not found')

    now = datetime.now(timezone.utc).isoformat()

    updatable_fields = [
        'title', 'description', 'root_cause', 'root_cause_category',
        'permanent_fix', 'fix_status', 'fix_owner', 'fix_due_date',
        'fix_completed_date', 'estimated_cost', 'incident_count',
        'total_downtime_minutes', 'known_error', 'wiki_url', 'workaround',
        'priority',
    ]

    for field in updatable_fields:
        if field in data:
            setattr(problem, field, data[field])

    problem.updated_at = now
    db.session.commit()

    return jsonify(problem.to_dict())


@problems_bp.route('/<problem_id>/link/<incident_id>', methods=['POST'])
def link_incident(problem_id, incident_id):
    """Link an incident to a problem. Updates the problem's incident count.
    ---
    tags:
      - Problems
    parameters:
      - name: problem_id
        in: path
        type: string
        required: true
        description: Problem UUID
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
        description: Link confirmation with both objects
        schema:
          type: object
          properties:
            message:
              type: string
            problem:
              $ref: '#/definitions/Problem'
            incident:
              $ref: '#/definitions/Incident'
      404:
        description: Problem or incident not found
        schema:
          $ref: '#/definitions/Error'
    """
    session_id = request.args.get('session_id', '__default__')

    problem = Problem.query.filter_by(id=problem_id, session_id=session_id).first()
    if not problem:
        raise NotFoundError('Problem not found')

    incident = Incident.query.filter_by(id=incident_id, session_id=session_id).first()
    if not incident:
        raise NotFoundError('Incident not found')

    incident.problem_id = problem_id
    incident.updated_at = datetime.now(timezone.utc).isoformat()

    # Update problem incident count
    linked_count = Incident.query.filter_by(
        problem_id=problem_id, session_id=session_id
    ).count()
    problem.incident_count = linked_count

    db.session.commit()

    return jsonify({
        'message': f'Incident {incident.incident_number} linked to problem {problem.problem_number}',
        'problem': problem.to_dict(),
        'incident': incident.to_dict(),
    })
