"""
Flask ProContent Editor - API Routes
"""

from flask import Blueprint, request, jsonify, current_app
from .editor import Editor

editor_bp = Blueprint('procontent', __name__, url_prefix='/api/editor')
editor_instance = None


def init_routes(app, editor):
    """Initialize routes with app and editor instance"""
    global editor_instance
    editor_instance = editor
    app.register_blueprint(editor_bp)


@editor_bp.route('/upload-image', methods=['POST'])
def upload_image():
    """Upload image endpoint"""
    try:
        if 'image' not in request.files:
            return jsonify({'success': False, 'message': 'No image provided'}), 400

        file = request.files['image']

        if not editor_instance.allowed_file(file.filename):
            return jsonify({
                'success': False,
                'message': f'File type not allowed. Allowed types: {editor_instance.ALLOWED_EXTENSIONS}'
            }), 400

        metadata = editor_instance.save_image(file)
        return jsonify({
            'success': True,
            'image_id': metadata['image_id'],
            'url': metadata['url'],
            'metadata': {
                'filename': metadata['filename'],
                'size': metadata['size'],
                'mime_type': metadata['mime_type'],
                'uploaded_at': metadata['uploaded_at']
            }
        }), 200

    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400
    except Exception as e:
        current_app.logger.error(f'Image upload error: {str(e)}')
        return jsonify({'success': False, 'message': 'Upload failed'}), 500


@editor_bp.route('/validate', methods=['POST'])
def validate_content():
    """Validate content JSON"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400

        is_valid, message = editor_instance.validate_content(data)
        return jsonify({
            'success': is_valid,
            'message': message
        }), 200 if is_valid else 400

    except Exception as e:
        current_app.logger.error(f'Validation error: {str(e)}')
        return jsonify({'success': False, 'message': 'Validation failed'}), 500


@editor_bp.route('/render', methods=['POST'])
def render_content():
    """Render content JSON to HTML"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400

        html = editor_instance.render(data)
        return jsonify({
            'success': True,
            'html': html
        }), 200

    except Exception as e:
        current_app.logger.error(f'Render error: {str(e)}')
        return jsonify({'success': False, 'message': 'Render failed'}), 500
