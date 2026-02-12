import uuid
from datetime import datetime, timezone
from app.extensions import db


class Problem(db.Model):
    __tablename__ = 'problems'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    problem_number = db.Column(db.String(20), unique=True, nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    root_cause = db.Column(db.Text)
    root_cause_category = db.Column(db.String(30))
    permanent_fix = db.Column(db.Text)
    fix_status = db.Column(db.String(20), default='open')
    fix_owner = db.Column(db.String(100))
    fix_due_date = db.Column(db.String(50))
    fix_completed_date = db.Column(db.String(50))
    estimated_cost = db.Column(db.Float)
    incident_count = db.Column(db.Integer, default=0)
    total_downtime_minutes = db.Column(db.Integer)
    known_error = db.Column(db.Integer, default=0)
    wiki_url = db.Column(db.String(500))
    workaround = db.Column(db.Text)
    priority = db.Column(db.String(20), default='medium')
    created_at = db.Column(db.String(50), default=lambda: datetime.now(timezone.utc).isoformat())
    updated_at = db.Column(db.String(50), default=lambda: datetime.now(timezone.utc).isoformat())
    session_id = db.Column(db.String(100), default='__default__')

    # Relationships
    incidents = db.relationship('Incident', backref='problem', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'problem_number': self.problem_number,
            'title': self.title,
            'description': self.description,
            'root_cause': self.root_cause,
            'root_cause_category': self.root_cause_category,
            'permanent_fix': self.permanent_fix,
            'fix_status': self.fix_status,
            'fix_owner': self.fix_owner,
            'fix_due_date': self.fix_due_date,
            'fix_completed_date': self.fix_completed_date,
            'estimated_cost': self.estimated_cost,
            'incident_count': self.incident_count,
            'total_downtime_minutes': self.total_downtime_minutes,
            'known_error': self.known_error,
            'wiki_url': self.wiki_url,
            'workaround': self.workaround,
            'priority': self.priority,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'session_id': self.session_id,
        }
