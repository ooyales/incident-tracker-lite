def register_blueprints(app):
    from app.api.auth import auth_bp
    from app.api.dashboard import dashboard_bp
    from app.api.incidents import incidents_bp
    from app.api.timeline import timeline_bp
    from app.api.problems import problems_bp
    from app.api.sla import sla_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(incidents_bp, url_prefix='/api/incidents')
    app.register_blueprint(timeline_bp, url_prefix='/api/timeline')
    app.register_blueprint(problems_bp, url_prefix='/api/problems')
    app.register_blueprint(sla_bp, url_prefix='/api/sla')
