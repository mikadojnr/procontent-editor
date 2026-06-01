# Flask Integration Guide

## Installation

```bash
pip install flask-procontent
```

## Basic Setup

```python
from flask import Flask
from flask_procontent import Editor, init_routes

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'

# Initialize editor
editor = Editor(app, upload_folder='uploads')

# Register API routes
init_routes(app, editor)

if __name__ == '__main__':
    app.run(debug=True)
```

## Configuration

```python
editor = Editor(
    app=app,
    upload_folder='uploads',
    max_file_size=50*1024*1024  # 50MB
)

# Additional Flask configuration
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024
app.config['UPLOAD_FOLDER'] = 'uploads'
```

## API Endpoints

### POST `/api/editor/upload-image`

Upload an image file.

**Request:**
```
Content-Type: multipart/form-data
image: <binary file data>
```

**Response:**
```json
{
  "success": true,
  "image_id": "img_abc123def456",
  "url": "/uploads/2026/06/01/img_abc123def456.jpg",
  "metadata": {
    "filename": "img_abc123def456.jpg",
    "size": 125000,
    "mime_type": "image/jpeg",
    "uploaded_at": "2026-06-01T12:00:00"
  }
}
```

### POST `/api/editor/validate`

Validate content JSON structure.

**Request:**
```json
{
  "blocks": [
    {
      "type": "paragraph",
      "data": {"content": "Hello"}
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Valid"
}
```

### POST `/api/editor/render`

Render content JSON to HTML.

**Request:**
```json
{
  "blocks": [
    {"type": "paragraph", "data": {"content": "Hello"}},
    {"type": "image", "data": {"src": "/uploads/img.jpg", "alt": "Test"}}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "html": "<div class=\"procontent-rendered\">...</div>"
}
```

## Usage Examples

### Create Editor Page

```python
from flask import Flask, render_template_string

@app.route('/')
def editor():
    return render_template_string('''
    <!DOCTYPE html>
    <html>
    <head>
        <title>ProContent Editor</title>
        <link rel="stylesheet" href="static/procontent.css">
    </head>
    <body>
        <div id="editor"></div>
        <button id="save-btn">Save</button>
        
        <script src="static/procontent.js"></script>
        <script>
            const editor = new ProContentEditor('#editor', {
                height: 600,
                plugins: ['image', 'table', 'video']
            });
            
            document.getElementById('save-btn').addEventListener('click', async () => {
                const content = editor.getContent();
                const response = await fetch('/api/posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(content)
                });
                const data = await response.json();
                console.log('Saved:', data);
            });
        </script>
    </body>
    </html>
    ''')
```

### Custom Upload Handling

```python
from flask import request, jsonify
from werkzeug.utils import secure_filename

@app.route('/api/editor/upload-image', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'success': False, 'message': 'No file'}), 400
    
    file = request.files['image']
    
    try:
        metadata = editor.save_image(file)
        
        # Optional: Save to database
        # db.images.insert_one(metadata)
        
        return jsonify({
            'success': True,
            'image_id': metadata['image_id'],
            'url': metadata['url'],
            'metadata': metadata
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400
```

### Render Content

```python
from flask import Flask

@app.route('/posts/<int:post_id>')
def view_post(post_id):
    # Fetch from database
    post = db.posts.find_one({'id': post_id})
    
    if not post:
        return 'Not found', 404
    
    # Render content
    html = editor.render(post['content_json'])
    
    return f'''
    <!DOCTYPE html>
    <html>
    <head>
        <link rel="stylesheet" href="/static/procontent.css">
        <title>{post['title']}</title>
    </head>
    <body>
        <h1>{post['title']}</h1>
        {html}
    </body>
    </html>
    '''
```

### Content Validation

```python
@app.route('/api/validate', methods=['POST'])
def validate():
    data = request.get_json()
    is_valid, message = editor.validate_content(data)
    
    return jsonify({
        'success': is_valid,
        'message': message
    }), 200 if is_valid else 400
```

## Database Integration

### Using SQLAlchemy

```python
from flask_sqlalchemy import SQLAlchemy
import json

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///procontent.db'
db = SQLAlchemy(app)

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    content_json = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=db.func.now())
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': json.loads(self.content_json) if self.content_json else None
        }

@app.route('/api/posts', methods=['POST'])
def create_post():
    data = request.get_json()
    
    post = Post(
        title=data.get('title'),
        content_json=json.dumps(data.get('content'))
    )
    
    db.session.add(post)
    db.session.commit()
    
    return jsonify(post.to_dict()), 201
```

### Using MongoDB

```python
from pymongo import MongoClient
from bson.objectid import ObjectId
import json

client = MongoClient('mongodb://localhost:27017')
db = client['procontent']
posts = db['posts']

@app.route('/api/posts', methods=['POST'])
def create_post():
    data = request.get_json()
    
    result = posts.insert_one({
        'title': data.get('title'),
        'content': data.get('content'),
        'created_at': datetime.now()
    })
    
    return jsonify({
        'id': str(result.inserted_id),
        'message': 'Created'
    }), 201
```

## Error Handling

```python
@app.errorhandler(400)
def bad_request(error):
    return jsonify({'success': False, 'message': 'Bad request'}), 400

@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({'success': False, 'message': 'File too large'}), 413

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'message': 'Server error'}), 500
```

## Security

### CSRF Protection

```python
from flask_wtf.csrf import CSRFProtect

csrf = CSRFProtect(app)

@app.route('/api/posts', methods=['POST'])
@csrf.exempt  # Disable CSRF for API
def create_post():
    # Handle request
    pass
```

### Rate Limiting

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

@app.route('/api/editor/upload-image', methods=['POST'])
@limiter.limit("10 per minute")
def upload_image():
    # Handle upload
    pass
```

### CORS

```python
from flask_cors import CORS

CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type"]
    }
})
```

## Testing

```python
import unittest
from flask import Flask

class TestEditor(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        self.editor = Editor(self.app)
        self.client = self.app.test_client()
    
    def test_upload_image(self):
        with open('test_image.jpg', 'rb') as f:
            response = self.client.post(
                '/api/editor/upload-image',
                data={'image': f}
            )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
    
    def test_validate_content(self):
        response = self.client.post(
            '/api/editor/validate',
            json={'blocks': [{'type': 'paragraph', 'data': {'content': 'Test'}}]}
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])

if __name__ == '__main__':
    unittest.main()
```

## Deployment

### Using Gunicorn

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

### Using Docker

```dockerfile
FROM python:3.10

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "app:app"]
```

## Performance Optimization

### Caching

```python
from flask_caching import Cache

cache = Cache(app, config={'CACHE_TYPE': 'simple'})

@app.route('/posts/<int:post_id>')
@cache.cached(timeout=300)
def view_post(post_id):
    # Cached response
    pass
```

### Compression

```python
from flask_compress import Compress

Compress(app)
```

## License

MIT
