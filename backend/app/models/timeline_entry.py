import uuid
from datetime import datetime, timezone
from app.extensions import db


class TimelineEntry(db.Model):
    __tablename__ = 'timeline_entries'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = db.Column(db.String(36), db.ForeignKey('incidents.id'), nullable=False)
    entry_type = db.Column(db.String(30), default='update')
    content = db.Column(db.Text, nullable=False)
    author = db.Column(db.String(100))
    created_at = db.Column(db.String(50), default=lambda: datetime.now(timezone.utc).isoformat())
    old_status = db.Column(db.String(20))
    new_status = db.Column(db.String(20))
    session_id = db.Column(db.String(100), default='__default__')

    def to_dict(self):
        return {
            'id': self.id,
            'incident_id': self.incident_id,
            'entry_type': self.entry_type,
            'content': self.content,
            'author': self.author,
            'created_at': self.created_at,
            'old_status': self.old_status,
            'new_status': self.new_status,
            'session_id': self.session_id,
        }
