from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.incident import Incident
from app.models.sla_target import SLATarget
from app.services.metrics import calculate_sla_compliance, _parse_dt

sla_bp = Blueprint('sla', __name__)


@sla_bp.route('', methods=['GET'])
def list_sla_targets():
    """List all SLA targets.
    ---
    tags:
      - SLA
    parameters:
      - name: session_id
        in: query
        type: string
        required: false
        default: __default__
        description: Session ID for demo isolation
    responses:
      200:
        description: List of SLA targets
        schema:
          type: array
          items:
            $ref: '#/definitions/SLATarget'
    """
    session_id = request.args.get('session_id', '__default__')
    targets = SLATarget.query.filter_by(session_id=session_id).all()
    return jsonify([t.to_dict() for t in targets])


@sla_bp.route('/compliance', methods=['GET'])
def get_sla_compliance():
    """Get SLA compliance metrics — overall and per severity with breached incidents.
    ---
    tags:
      - SLA
    parameters:
      - name: session_id
        in: query
        type: string
        required: false
        default: __default__
        description: Session ID for demo isolation
    responses:
      200:
        description: SLA compliance data
        schema:
          type: object
          properties:
            overall_compliance_pct:
              type: number
              description: Overall SLA compliance percentage
            per_severity:
              type: array
              items:
                type: object
                properties:
                  severity:
                    type: string
                    enum: [critical, high, medium, low]
                  response_target_minutes:
                    type: integer
                  resolution_target_minutes:
                    type: integer
                  total_incidents:
                    type: integer
                  compliant:
                    type: integer
                  breached:
                    type: integer
                  compliance_pct:
                    type: number
                  breached_incidents:
                    type: array
                    items:
                      type: object
                      properties:
                        incident_number:
                          type: string
                        title:
                          type: string
                        resolution_minutes:
                          type: number
                        target_minutes:
                          type: integer
    """
    session_id = request.args.get('session_id', '__default__')

    sla_targets = {
        t.severity: t for t in SLATarget.query.filter_by(session_id=session_id).all()
    }

    # Overall compliance
    overall_pct = calculate_sla_compliance(session_id)

    # Per-severity compliance
    per_severity = []
    for severity in ['critical', 'high', 'medium', 'low']:
        target = sla_targets.get(severity)
        if not target:
            continue

        resolved = Incident.query.filter(
            Incident.session_id == session_id,
            Incident.severity == severity,
            Incident.status.in_(['resolved', 'closed']),
            Incident.reported_at.isnot(None),
            Incident.resolved_at.isnot(None),
        ).all()

        total = 0
        compliant = 0
        breached_incidents = []
        for inc in resolved:
            reported = _parse_dt(inc.reported_at)
            resolved_dt = _parse_dt(inc.resolved_at)
            if reported and resolved_dt:
                diff_minutes = (resolved_dt - reported).total_seconds() / 60.0
                total += 1
                if diff_minutes <= target.resolution_target_minutes:
                    compliant += 1
                else:
                    breached_incidents.append({
                        'incident_number': inc.incident_number,
                        'title': inc.title,
                        'resolution_minutes': round(diff_minutes, 1),
                        'target_minutes': target.resolution_target_minutes,
                    })

        pct = round((compliant / total) * 100.0, 1) if total > 0 else 100.0

        per_severity.append({
            'severity': severity,
            'response_target_minutes': target.response_target_minutes,
            'resolution_target_minutes': target.resolution_target_minutes,
            'total_incidents': total,
            'compliant': compliant,
            'breached': total - compliant,
            'compliance_pct': pct,
            'breached_incidents': breached_incidents,
        })

    return jsonify({
        'overall_compliance_pct': overall_pct,
        'per_severity': per_severity,
    })
