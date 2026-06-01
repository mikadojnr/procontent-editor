# Flask ProContent Editor

Flask integration for ProContent Editor - a production-ready WYSIWYG rich text editor.

## Installation

```bash
pip install flask-procontent
```

## Quick Start

```python
from flask import Flask
from flask_procontent import Editor, init_routes

app = Flask(__name__)
editor = Editor(app, upload_folder='uploads')
init_routes(app, editor)

@app.route('/')
def index():
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <link rel="stylesheet" href="/static/procontent.css">
    </head>
    <body>
        <div id="editor"></div>
        <script src="/static/procontent.js"></script>
        <script>
            const editor = new ProContentEditor('#editor', {
                height: 600,
                plugins: ['image', 'table']
            });
        </script>
    </body>
    </html>
    '''

if __name__ == '__main__':
    app.run(debug=True)
```

## API Endpoints

### Upload Image

**POST** `/api/editor/upload-image`

Upload an image file.

Request:
```
Content-Type: multipart/form-data
image: <file>
```

Response:
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

### Validate Content

**POST** `/api/editor/validate`

Validate content JSON structure.

Request:
```json
{
  "blocks": [
    {"type": "paragraph", "data": {"content": "Hello"}}
  ]
}
```

Response:
```json
{
  "success": true,
  "message": "Valid"
}
```

### Render Content

**POST** `/api/editor/render`

Render content JSON to HTML.

Request:
```json
{
  "blocks": [
    {"type": "paragraph", "data": {"content": "Hello"}},
    {"type": "image", "data": {"src": "/uploads/img.jpg", "alt": "Test"}}
  ]
}
```

Response:
```json
{
  "success": true,
  "html": "<div class=\"procontent-rendered\"><p>Hello</p><figure>...</figure></div>"
}
```

## Content Format

Content is stored as a JSON document with blocks:

```json
{
  "blocks": [
    {
      "id": "block_uuid",
      "type": "paragraph",
      "data": {
        "content": "Introduction text"
      }
    },
    {
      "id": "block_uuid",
      "type": "image",
      "data": {
        "image_id": "img_9837",
        "src": "/uploads/2026/06/01/img_9837.jpg",
        "alt": "Example Image",
        "width": 800,
        "height": 450,
        "alignment": "center"
      }
    }
  ]
}
```

## Rendering

```python
from flask_procontent import Editor

editor = Editor()
content = {...}  # JSON content
html = editor.render(content)
```

## Configuration

```python
editor = Editor(
    app=app,
    upload_folder='uploads',
    max_file_size=50*1024*1024  # 50MB
)
```

## License

MIT
