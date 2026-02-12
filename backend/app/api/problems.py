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
