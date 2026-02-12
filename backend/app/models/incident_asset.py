import uuid
from app.extensions import db


class IncidentAsset(db.Model):
    __tablename__ = 'incident_assets'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = db.Column(db.String(36), db.ForeignKey('incidents.id'), nullable=False)
    asset_tracker_id = db.Column(db.String(100))
    asset_name = db.Column(db.String(255), nullable=False)
    asset_type = db.Column(db.String(50))
    impact_type = db.Column(db.String(20))
    notes = db.Column(db.Text)
    session_id = db.Column(db.String(100), default='__default__')

    def to_dict(self):
        return {
            'id': self.id,
            'incident_id': self.incident_id,
            'asset_tracker_id': self.asset_tracker_id,
            'asset_name': self.asset_name,
            'asset_type': self.asset_type,
            'impact_type': self.impact_type,
            'notes': self.notes,
            'session_id': self.session_id,
        }
