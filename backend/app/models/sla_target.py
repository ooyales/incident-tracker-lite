import uuid
from app.extensions import db


class SLATarget(db.Model):
    __tablename__ = 'sla_targets'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    severity = db.Column(db.String(20), nullable=False)
    response_target_minutes = db.Column(db.Integer)
    resolution_target_minutes = db.Column(db.Integer)
    session_id = db.Column(db.String(100), default='__default__')

    def to_dict(self):
        return {
            'id': self.id,
            'severity': self.severity,
            'response_target_minutes': self.response_target_minutes,
            'resolution_target_minutes': self.resolution_target_minutes,
            'session_id': self.session_id,
        }
