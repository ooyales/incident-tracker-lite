from datetime import datetime, timezone
from app.extensions import db


class IncidentCounter(db.Model):
    __tablename__ = 'incident_counters'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    counter_type = db.Column(db.String(20), nullable=False)  # 'incident' or 'problem'
    year = db.Column(db.Integer, nullable=False)
    last_number = db.Column(db.Integer, nullable=False, default=0)

    __table_args__ = (
        db.UniqueConstraint('counter_type', 'year', name='uq_counter_type_year'),
    )


def generate_incident_number():
    """Generate next incident number in format INC-YYYY-NNNN."""
    year = datetime.now(timezone.utc).year
    counter = IncidentCounter.query.filter_by(
        counter_type='incident', year=year
    ).with_for_update().first()

    if counter is None:
        counter = IncidentCounter(counter_type='incident', year=year, last_number=0)
        db.session.add(counter)

    counter.last_number += 1
    db.session.flush()

    return f'INC-{year}-{counter.last_number:04d}'


def generate_problem_number():
    """Generate next problem number in format PRB-YYYY-NNNN."""
    year = datetime.now(timezone.utc).year
    counter = IncidentCounter.query.filter_by(
        counter_type='problem', year=year
    ).with_for_update().first()

    if counter is None:
        counter = IncidentCounter(counter_type='problem', year=year, last_number=0)
        db.session.add(counter)

    counter.last_number += 1
    db.session.flush()

    return f'PRB-{year}-{counter.last_number:04d}'
