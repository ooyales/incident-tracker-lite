import os
from flask import Flask
from sqlalchemy import BigInteger
from sqlalchemy.ext.compiler import compiles
from flasgger import Swagger
from app.config import config
from app.extensions import db, jwt, cors
from app.errors import register_error_handlers


@compiles(BigInteger, 'sqlite')
def _render_bigint_as_int(type_, compiler, **kw):
    return 'INTEGER'


SWAGGER_TEMPLATE = {
    "info": {
        "title": "Incident Tracker Lite API",
        "description": "API for Incident Tracker Lite — incident lifecycle management, timeline tracking, problem management, SLA compliance, and executive dashboards.",
        "version": "1.0.0",
    },
    "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "JWT token. Enter: **Bearer {your-jwt-token}**"
        }
    },
    "security": [{"Bearer": []}],
    "basePath": "/",
    "schemes": ["http", "https"],
    "definitions": {
        "Error": {
            "type": "object",
            "properties": {
                "message": {"type": "string"}
            }
        },
        "LoginUser": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "username": {"type": "string"},
                "role": {"type": "string", "enum": ["admin", "responder"]},
                "name": {"type": "string"}
            }
        },
        "Incident": {
            "type": "object",
            "properties": {
                "id": {"type": "string", "format": "uuid"},
                "incident_number": {"type": "string", "description": "Auto-generated (INC-00001)"},
                "title": {"type": "string"},
                "description": {"type": "string"},
                "severity": {"type": "string", "enum": ["critical", "high", "medium", "low"]},
                "category": {"type": "string", "enum": ["outage", "degradation", "security", "data_loss", "access_issue", "other"]},
                "status": {"type": "string", "enum": ["open", "investigating", "identified", "monitoring", "resolved", "closed"]},
                "reported_at": {"type": "string", "format": "date-time"},
                "detected_at": {"type": "string", "format": "date-time"},
                "acknowledged_at": {"type": "string", "format": "date-time"},
                "resolved_at": {"type": "string", "format": "date-time"},
                "closed_at": {"type": "string", "format": "date-time"},
                "impact_description": {"type": "string"},
                "users_affected": {"type": "integer"},
                "business_impact": {"type": "string"},
                "data_breach": {"type": "integer"},
                "reported_by": {"type": "string"},
                "assigned_to": {"type": "string"},
                "resolved_by": {"type": "string"},
                "resolution_summary": {"type": "string"},
                "root_cause": {"type": "string"},
                "workaround": {"type": "string"},
                "problem_id": {"type": "string", "format": "uuid"},
                "wiki_url": {"type": "string"},
                "post_incident_completed": {"type": "integer"},
                "lessons_learned": {"type": "string"},
                "preventive_actions": {"type": "string"},
                "tags": {"type": "string"},
                "created_at": {"type": "string", "format": "date-time"},
                "updated_at": {"type": "string", "format": "date-time"},
                "session_id": {"type": "string"}
            }
        },
        "TimelineEntry": {
            "type": "object",
            "properties": {
                "id": {"type": "string", "format": "uuid"},
                "incident_id": {"type": "string", "format": "uuid"},
                "entry_type": {"type": "string", "enum": ["update", "status_change", "assignment", "resolution", "communication"]},
                "content": {"type": "string"},
                "author": {"type": "string"},
                "created_at": {"type": "string", "format": "date-time"},
                "old_status": {"type": "string"},
                "new_status": {"type": "string"},
                "session_id": {"type": "string"}
            }
        },
        "IncidentAsset": {
            "type": "object",
            "properties": {
                "id": {"type": "string", "format": "uuid"},
                "incident_id": {"type": "string", "format": "uuid"},
                "asset_tracker_id": {"type": "string"},
                "asset_name": {"type": "string"},
                "asset_type": {"type": "string"},
                "impact_type": {"type": "string"},
                "notes": {"type": "string"},
                "session_id": {"type": "string"}
            }
        },
        "IncidentResponder": {
            "type": "object",
            "properties": {
                "id": {"type": "string", "format": "uuid"},
                "incident_id": {"type": "string", "format": "uuid"},
                "person_name": {"type": "string"},
                "role": {"type": "string"},
                "assigned_at": {"type": "string", "format": "date-time"},
                "session_id": {"type": "string"}
            }
        },
        "Problem": {
            "type": "object",
            "properties": {
                "id": {"type": "string", "format": "uuid"},
                "problem_number": {"type": "string", "description": "Auto-generated (PRB-00001)"},
                "title": {"type": "string"},
                "description": {"type": "string"},
                "root_cause": {"type": "string"},
                "root_cause_category": {"type": "string"},
                "permanent_fix": {"type": "string"},
                "fix_status": {"type": "string", "enum": ["open", "in_progress", "implemented", "verified"]},
                "fix_owner": {"type": "string"},
                "fix_due_date": {"type": "string", "format": "date"},
                "fix_completed_date": {"type": "string", "format": "date"},
                "estimated_cost": {"type": "number"},
                "incident_count": {"type": "integer"},
                "total_downtime_minutes": {"type": "integer"},
                "known_error": {"type": "integer"},
                "wiki_url": {"type": "string"},
                "workaround": {"type": "string"},
                "priority": {"type": "string", "enum": ["critical", "high", "medium", "low"]},
                "created_at": {"type": "string", "format": "date-time"},
                "updated_at": {"type": "string", "format": "date-time"},
                "session_id": {"type": "string"}
            }
        },
        "Communication": {
            "type": "object",
            "properties": {
                "id": {"type": "string", "format": "uuid"},
                "incident_id": {"type": "string", "format": "uuid"},
                "channel": {"type": "string"},
                "recipient": {"type": "string"},
                "message": {"type": "string"},
                "sent_at": {"type": "string", "format": "date-time"},
                "sent_by": {"type": "string"},
                "session_id": {"type": "string"}
            }
        },
        "SLATarget": {
            "type": "object",
            "properties": {
                "id": {"type": "string", "format": "uuid"},
                "severity": {"type": "string", "enum": ["critical", "high", "medium", "low"]},
                "response_target_minutes": {"type": "integer"},
                "resolution_target_minutes": {"type": "integer"},
                "session_id": {"type": "string"}
            }
        }
    }
}

SWAGGER_CONFIG = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec",
            "route": "/apispec.json",
            "rule_filter": lambda rule: rule.rule.startswith('/api/'),
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/apidocs/"
}


def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.url_map.strict_slashes = False
    app.config.from_object(config[config_name])

    db.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})
    jwt.init_app(app)

    Swagger(app, config=SWAGGER_CONFIG, template=SWAGGER_TEMPLATE)

    from app.api import register_blueprints
    register_blueprints(app)

    register_error_handlers(app)

    @app.route('/api/health')
    def health_check():
        """Health check endpoint.
        ---
        tags:
          - System
        security: []
        responses:
          200:
            description: Service is healthy
            schema:
              type: object
              properties:
                status:
                  type: string
                  example: healthy
                timestamp:
                  type: string
                  format: date-time
                app:
                  type: string
                  example: incident-tracker-lite
        """
        from flask import jsonify
        from datetime import datetime
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'app': 'incident-tracker-lite'
        })

    # Demo auth (enabled via DEMO_AUTH_ENABLED env var)
    try:
        from demo_auth import init_demo_auth
        from demo_sessions import SessionManager
        db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        if db_uri.startswith('sqlite:///'):
            template_db = os.path.join(app.instance_path, db_uri.replace('sqlite:///', ''))
        else:
            template_db = os.path.join(app.instance_path, 'incident_tracker.db')
        _session_mgr = SessionManager(
            template_db=template_db,
            sessions_dir=os.path.join(os.path.dirname(app.instance_path), 'data', 'sessions')
        )
        init_demo_auth(app, session_manager=_session_mgr)
    except ImportError:
        pass

    register_cli(app)
    return app


def register_cli(app):
    @app.cli.command('seed')
    def seed_command():
        from app.seed import seed
        seed()
        print('Database seeded.')

    @app.cli.command('init-db')
    def init_db_command():
        db.create_all()
        print('Database initialized.')

    @app.cli.command('reset-db')
    def reset_db_command():
        db.drop_all()
        db.create_all()
        from app.seed import seed
        seed()
        print('Database reset and seeded.')
