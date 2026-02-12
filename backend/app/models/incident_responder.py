import uuid
from datetime import datetime, timezone
from app.extensions import db


class IncidentResponder(db.Model):
    __tablename__ = 'incident_responders'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = db.Column(db.String(36), db.ForeignKey('incidents.id'), nullable=False)
    person_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(30))
    assigned_at = db.Column(db.String(50), default=lambda: datetime.now(timezone.utc).isoformat())
    session_id = db.Column(db.String(100), default='__default__')

    def to_dict(self):
        return {
            'id': self.id,
            'incident_id': self.incident_id,
            'person_name': self.person_name,
            'role': self.role,
            'assigned_at': self.assigned_at,
            'session_id': self.session_id,
        }
