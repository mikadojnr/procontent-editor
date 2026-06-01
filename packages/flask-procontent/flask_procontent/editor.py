"""
Flask ProContent Editor - Main Editor Class
"""

import os
import json
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename
from pathlib import Path


class Editor:
    """Main editor class for Flask integration"""

    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'}
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

    def __init__(self, app=None, upload_folder='uploads', max_file_size=None):
        self.app = app
        self.upload_folder = upload_folder
        self.max_file_size = max_file_size or self.MAX_FILE_SIZE

        if app:
            self.init_app(app)

    def init_app(self, app):
        """Initialize Flask app"""
        self.app = app
        app.config.setdefault('UPLOAD_FOLDER', self.upload_folder)
        app.config.setdefault('MAX_CONTENT_LENGTH', self.max_file_size)

        # Create upload folder if it doesn't exist
        Path(app.config['UPLOAD_FOLDER']).mkdir(parents=True, exist_ok=True)

    def allowed_file(self, filename):
        """Check if file extension is allowed"""
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in self.ALLOWED_EXTENSIONS

    def save_image(self, file):
        """Save uploaded image and return metadata"""
        if not file or file.filename == '':
            return None

        if not self.allowed_file(file.filename):
            raise ValueError('File type not allowed')

        # Generate unique filename
        original_ext = secure_filename(file.filename).rsplit('.', 1)[1].lower()
        image_id = f"img_{uuid.uuid4().hex[:12]}"
        filename = f"{image_id}.{original_ext}"

        # Create subfolder for date organization
        from flask import current_app
        upload_folder = current_app.config.get('UPLOAD_FOLDER', self.upload_folder)
        date_folder = datetime.now().strftime('%Y/%m/%d')
        filepath = os.path.join(upload_folder, date_folder)

        # Create directories
        Path(filepath).mkdir(parents=True, exist_ok=True)

        # Save file
        full_path = os.path.join(filepath, filename)
        file.save(full_path)

        # Return metadata
        return {
            'image_id': image_id,
            'filename': filename,
            'original_filename': secure_filename(file.filename),
            'filepath': os.path.join(date_folder, filename),
            'url': f"/uploads/{date_folder}/{filename}",
            'size': os.path.getsize(full_path),
            'uploaded_at': datetime.now().isoformat(),
            'mime_type': file.content_type
        }

    def render(self, content_json):
        """Render content JSON to HTML"""
        if isinstance(content_json, str):
            content_json = json.loads(content_json)

        html = '<div class="procontent-rendered">'

        if 'blocks' in content_json:
            for block in content_json['blocks']:
                html += self.render_block(block)
        else:
            html += self.render_block(content_json)

        html += '</div>'
        return html

    def render_block(self, block):
        """Render individual block to HTML"""
        block_type = block.get('type', 'paragraph')
        data = block.get('data', {})

        if block_type == 'paragraph':
            return f'<p>{self.escape_html(data.get("content", ""))}</p>'

        elif block_type == 'heading':
            level = data.get('level', 1)
            return f'<h{level}>{self.escape_html(data.get("content", ""))}</h{level}>'

        elif block_type == 'image':
            alt = self.escape_html(data.get('alt', ''))
            src = data.get('src', '')
            width = data.get('width', '')
            height = data.get('height', '')
            alignment = data.get('alignment', 'center')

            style = f'text-align: {alignment};'
            width_attr = f'width="{width}"' if width else ''
            height_attr = f'height="{height}"' if height else ''

            caption = data.get('caption', '')
            caption_html = f'<figcaption>{self.escape_html(caption)}</figcaption>' if caption else ''

            return f'''
            <figure style="{style}">
                <img src="{src}" alt="{alt}" {width_attr} {height_attr} />
                {caption_html}
            </figure>
            '''

        elif block_type == 'gallery':
            images = data.get('images', [])
            gallery_html = '<div class="gallery">'
            for img in images:
                alt = self.escape_html(img.get('alt', ''))
                src = img.get('src', '')
                gallery_html += f'<div class="gallery-item"><img src="{src}" alt="{alt}" /></div>'
            gallery_html += '</div>'
            return gallery_html

        elif block_type == 'table':
            rows = data.get('rows', [])
            table_html = '<table border="1"><tbody>'
            for row in rows:
                table_html += '<tr>'
                for cell in row:
                    table_html += f'<td>{self.escape_html(str(cell))}</td>'
                table_html += '</tr>'
            table_html += '</tbody></table>'
            return table_html

        elif block_type == 'list':
            items = data.get('items', [])
            list_type = data.get('list_type', 'ul')
            list_tag = 'ul' if list_type == 'ul' else 'ol'
            list_html = f'<{list_tag}>'
            for item in items:
                list_html += f'<li>{self.escape_html(str(item))}</li>'
            list_html += f'</{list_tag}>'
            return list_html

        elif block_type == 'quote':
            return f'<blockquote>{self.escape_html(data.get("content", ""))}</blockquote>'

        elif block_type == 'code':
            language = data.get('language', 'plaintext')
            content = self.escape_html(data.get('content', ''))
            return f'<pre><code class="language-{language}">{content}</code></pre>'

        elif block_type == 'divider':
            return '<hr />'

        elif block_type == 'callout':
            callout_type = data.get('callout_type', 'info')
            content = self.escape_html(data.get('content', ''))
            return f'<div class="callout callout-{callout_type}">{content}</div>'

        elif block_type == 'video':
            url = data.get('url', '')
            return f'<div class="video-embed"><iframe src="{url}" allowfullscreen></iframe></div>'

        elif block_type == 'audio':
            url = data.get('url', '')
            return f'<audio controls><source src="{url}" /></audio>'

        else:
            return ''

    @staticmethod
    def escape_html(text):
        """Escape HTML special characters"""
        return (text
                .replace('&', '&amp;')
                .replace('<', '&lt;')
                .replace('>', '&gt;')
                .replace('"', '&quot;')
                .replace("'", '&#39;'))

    def validate_content(self, content_json):
        """Validate content JSON structure"""
        if isinstance(content_json, str):
            try:
                content_json = json.loads(content_json)
            except json.JSONDecodeError:
                return False, 'Invalid JSON'

        if not isinstance(content_json, dict):
            return False, 'Content must be a dictionary'

        if 'blocks' in content_json and not isinstance(content_json['blocks'], list):
            return False, 'Blocks must be a list'

        return True, 'Valid'

    def get_image_metadata(self, filepath):
        """Get image metadata (requires PIL)"""
        try:
            from PIL import Image
            img = Image.open(filepath)
            return {
                'width': img.width,
                'height': img.height,
                'format': img.format
            }
        except ImportError:
            return None
