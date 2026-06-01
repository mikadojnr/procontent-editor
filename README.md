# ProContent Editor

A production-ready, self-hosted, enterprise-grade WYSIWYG Rich Text Editor with complete ownership, extensibility, and backend integration support for Flask and Laravel applications.

## Features

### Core Capabilities
- **Block-Based Architecture**: Document stored as structured JSON blocks
- **Rich Text Formatting**: Bold, italic, underline, strikethrough, colors, alignment
- **Media Support**: Images, galleries, videos, audio with metadata preservation
- **Advanced Tables**: Merge/split cells, resize columns/rows
- **Slash Commands**: `/image`, `/table`, `/quote`, `/code`
- **Keyboard Shortcuts**: Full suite of productivity shortcuts
- **Dark/Light Mode**: Theme switching support
- **Responsive Design**: Mobile and desktop optimized

### Image Management
- Drag & drop upload
- Clipboard paste
- UUID-based tracking
- Database metadata storage
- Resize, crop, rotate capabilities
- Multiple layouts (full-width, centered, float)
- Lazy loading support
- Exact position preservation

### Backend Integration
- **Flask**: Complete Python package with upload endpoints
- **Laravel**: Full PHP package with service provider
- **Databases**: MySQL, PostgreSQL, SQLite support

## Project Structure

```
procontent-editor/
├── frontend/                 # Vanilla JavaScript editor
│   ├── src/
│   │   ├── core/            # Core editor engine
│   │   ├── plugins/         # Plugin system
│   │   ├── tools/           # Toolbar tools
│   │   ├── blocks/          # Block types
│   │   ├── utils/           # Utilities
│   │   └── styles/          # CSS
│   ├── dist/                # Compiled output
│   └── index.html           # Demo
│
├── packages/
│   ├── flask-procontent/    # Flask integration
│   │   ├── procontent/
│   │   ├── setup.py
│   │   └── tests/
│   │
│   └── laravel-procontent/  # Laravel integration
│       ├── src/
│       ├── composer.json
│       └── tests/
│
├── database/                 # Migrations & schemas
│   ├── migrations/
│   ├── seeds/
│   └── schemas/
│
├── examples/
│   ├── flask-app/           # Flask demo project
│   └── laravel-app/         # Laravel demo project
│
├── docs/                     # Documentation
├── docker/                   # Docker configuration
├── tests/                    # Test suite
└── .github/                  # GitHub workflows
```

## Quick Start

### Frontend

```html
<link rel="stylesheet" href="procontent.css">
<div id="editor"></div>
<script src="procontent.js"></script>
<script>
  const editor = new ProContentEditor('#editor', {
    height: 600,
    plugins: ['image', 'table', 'video'],
    theme: 'light'
  });
</script>
```

### Flask

```python
from flask import Flask
from flask_procontent import Editor, upload_routes

app = Flask(__name__)
editor = Editor(app)
app.register_blueprint(upload_routes)

@app.route('/render/<post_id>')
def render_post(post_id):
    post = Post.query.get(post_id)
    html = editor.render(post.content_json)
    return html
```

### Laravel

```php
use ProContent\Facades\Editor;

route::post('/api/editor/upload', [
    ProContentController::class, 'upload'
]);

route::get('/posts/{id}/render', function($id) {
    $post = Post::find($id);
    return Editor::render($post->content_json);
});
```

## Installation

See [docs/INSTALLATION.md](docs/INSTALLATION.md) for detailed setup instructions.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Frontend API](docs/FRONTEND_API.md)
- [Flask Integration](docs/FLASK_INTEGRATION.md)
- [Laravel Integration](docs/LARAVEL_INTEGRATION.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [Security](docs/SECURITY.md)
- [Deployment](docs/DEPLOYMENT.md)

## License

MIT
