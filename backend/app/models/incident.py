import uuid
from datetime import datetime, timezone
from app.extensions import db


class Incident(db.Model):
    __tablename__ = 'incidents'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_number = db.Column(db.String(20), unique=True, nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    severity = db.Column(db.String(20), default='medium')
    category = db.Column(db.String(50))
    status = db.Column(db.String(20), default='open')
    reported_at = db.Column(db.String(50), default=lambda: datetime.now(timezone.utc).isoformat())
    detected_at = db.Column(db.String(50))
    acknowledged_at = db.Column(db.String(50))
    resolved_at = db.Column(db.String(50))
    closed_at = db.Column(db.String(50))
    impact_description = db.Column(db.Text)
    users_affected = db.Column(db.Integer)
    business_impact = db.Column(db.String(20))
    data_breach = db.Column(db.Integer, default=0)
    reported_by = db.Column(db.String(100))
    assigned_to = db.Column(db.String(100))
    resolved_by = db.Column(db.String(100))
    resolution_summary = db.Column(db.Text)
    root_cause = db.Column(db.Text)
    workaround = db.Column(db.Text)
    problem_id = db.Column(db.String(36), db.ForeignKey('problems.id'))
    wiki_url = db.Column(db.String(500))
    post_incident_completed = db.Column(db.Integer, default=0)
    lessons_learned = db.Column(db.Text)
    preventive_actions = db.Column(db.Text)
    created_at = db.Column(db.String(50), default=lambda: datetime.now(timezone.utc).isoformat())
    updated_at = db.Column(db.String(50), default=lambda: datetime.now(timezone.utc).isoformat())
    tags = db.Column(db.Text, default='[]')
    session_id = db.Column(db.String(100), default='__default__')

    # Relationships
    timeline_entries = db.relationship('TimelineEntry', backref='incident', lazy='dynamic',
                                       cascade='all, delete-orphan')
    assets = db.relationship('IncidentAsset', backref='incident', lazy='dynamic',
                             cascade='all, delete-orphan')
    responders = db.relationship('IncidentResponder', backref='incident', lazy='dynamic',
                                 cascade='all, delete-orphan')
    communications = db.relationship('Communication', backref='incident', lazy='dynamic',
                                     cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'incident_number': self.incident_number,
            'title': self.title,
            'description': self.description,
            'severity': self.severity,
            'category': self.category,
            'status': self.status,
            'reported_at': self.reported_at,
            'detected_at': self.detected_at,
            'acknowledged_at': self.acknowledged_at,
            'resolved_at': self.resolved_at,
            'closed_at': self.closed_at,
            'impact_description': self.impact_description,
            'users_affected': self.users_affected,
            'business_impact': self.business_impact,
            'data_breach': self.data_breach,
            'reported_by': self.reported_by,
            'assigned_to': self.assigned_to,
            'resolved_by': self.resolved_by,
            'resolution_summary': self.resolution_summary,
            'root_cause': self.root_cause,
            'workaround': self.workaround,
            'problem_id': self.problem_id,
            'wiki_url': self.wiki_url,
            'post_incident_completed': self.post_incident_completed,
            'lessons_learned': self.lessons_learned,
            'preventive_actions': self.preventive_actions,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'tags': self.tags,
            'session_id': self.session_id,
        }
