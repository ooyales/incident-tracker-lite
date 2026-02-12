import uuid
from datetime import datetime, timezone
from app.extensions import db


class Communication(db.Model):
    __tablename__ = 'communications'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = db.Column(db.String(36), db.ForeignKey('incidents.id'), nullable=False)
    channel = db.Column(db.String(30))
    recipient = db.Column(db.String(200))
    message = db.Column(db.Text)
    sent_at = db.Column(db.String(50), default=lambda: datetime.now(timezone.utc).isoformat())
    sent_by = db.Column(db.String(100))
    session_id = db.Column(db.String(100), default='__default__')

    def to_dict(self):
        return {
            'id': self.id,
            'incident_id': self.incident_id,
            'channel': self.channel,
            'recipient': self.recipient,
            'message': self.message,
            'sent_at': self.sent_at,
            'sent_by': self.sent_by,
            'session_id': self.session_id,
        }
