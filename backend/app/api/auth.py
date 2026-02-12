from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash, generate_password_hash

auth_bp = Blueprint('auth', __name__)

# Demo users
DEMO_USERS = {
    'admin': {
        'id': 'user-admin-001',
        'username': 'admin',
        'password': generate_password_hash('admin123'),
        'role': 'admin',
        'name': 'Admin User',
    },
    'responder': {
        'id': 'user-responder-001',
        'username': 'responder',
        'password': generate_password_hash('resp123'),
        'role': 'responder',
        'name': 'Incident Responder',
    },
}


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'message': 'Missing request body'}), 400

    username = data.get('username', '').strip()
    password = data.get('password', '')

    user = DEMO_USERS.get(username)
    if not user or not check_password_hash(user['password'], password):
        return jsonify({'message': 'Invalid username or password'}), 401

    token = create_access_token(
        identity=user['id'],
        additional_claims={'username': user['username'], 'role': user['role']},
    )

    return jsonify({
        'token': token,
        'access_token': token,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'role': user['role'],
            'name': user['name'],
        },
    })


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    current_user_id = get_jwt_identity()
    for user in DEMO_USERS.values():
        if user['id'] == current_user_id:
            return jsonify({
                'id': user['id'],
                'username': user['username'],
                'role': user['role'],
                'name': user['name'],
            })
    return jsonify({'message': 'User not found'}), 404
