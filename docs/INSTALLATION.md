# Installation Guide

## Prerequisites

- Node.js 14+ and npm
- Python 3.7+ and pip
- PHP 7.4+ 
- Composer
- MySQL 5.7+ or PostgreSQL 12+
- Docker (optional)

## Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/mikadojnr/procontent-editor.git
cd procontent-editor

# Start all services
docker-compose up -d

# Run migrations
docker exec procontent_mysql mysql -uroot -proot procontent < database/schema.sql
```

## Flask Installation

### 1. Install Package

```bash
pip install flask-procontent
```

### 2. Initialize Flask App

```python
from flask import Flask
from flask_procontent import Editor, init_routes

app = Flask(__name__)
editor = Editor(app, upload_folder='uploads')
init_routes(app, editor)

if __name__ == '__main__':
    app.run(debug=True)
```

### 3. Create Upload Folder

```bash
mkdir -p uploads
chmod 755 uploads
```

### 4. Add Routes

```python
from flask import render_template_string

@app.route('/')
def editor_page():
    return render_template_string('''
    <!DOCTYPE html>
    <html>
    <head>
        <link rel="stylesheet" href="static/procontent.css">
    </head>
    <body>
        <div id="editor"></div>
        <script src="static/procontent.js"></script>
        <script>
            const editor = new ProContentEditor('#editor', {
                height: 600,
                plugins: ['image', 'table', 'video']
            });
        </script>
    </body>
    </html>
    ''')
```

## Laravel Installation

### 1. Install Package

```bash
composer require procontent/laravel
```

### 2. Publish Configuration

```bash
php artisan vendor:publish --provider="ProContent\\ProContentServiceProvider"
```

### 3. Run Migrations

```bash
php artisan migrate
```

### 4. Register in config/app.php

```php
'aliases' => [
    // ...
    'Editor' => ProContent\ProContentFacade::class,
]
```

### 5. Create Routes

```php
use ProContent\Facades\Editor;

Route::get('/editor', function () {
    return view('editor');
});

Route::post('/api/editor/upload-image', function (Request $request) {
    return response()->json(Editor::uploadImage($request->file('image')));
});
```

### 6. Create View

```blade
@extends('layouts.app')

@section('content')
<div id="editor"></div>

<link rel="stylesheet" href="{{ asset('procontent/css/procontent.css') }}">
<script src="{{ asset('procontent/js/procontent.js') }}"></script>
<script>
    const editor = new ProContentEditor('#editor', {
        height: 600,
        plugins: ['image', 'table', 'video']
    });
</script>
@endsection
```

## Standalone Installation

### 1. Copy Frontend Files

```bash
cp -r frontend/src/* your-project/js/
cp -r frontend/src/styles/main.css your-project/css/
```

### 2. Include in HTML

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="css/main.css">
</head>
<body>
    <div id="editor"></div>
    <script src="js/core/editor.js"></script>
    <script>
        const editor = new ProContentEditor('#editor', {
            height: 600
        });
    </script>
</body>
</html>
```

## Configuration

### Flask Configuration

```python
editor = Editor(
    app=app,
    upload_folder='uploads',
    max_file_size=50*1024*1024  # 50MB
)

app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024
```

### Laravel Configuration

Edit `config/procontent.php`:

```php
return [
    'upload' => [
        'folder' => 'uploads',
        'disk' => 'public',
        'max_size' => 50 * 1024 * 1024,
    ],
    'allowed_extensions' => ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'],
];
```

## Database Setup

### MySQL

```bash
mysql -u root -p < database/schema.sql
```

### PostgreSQL

```bash
psql -U postgres -d procontent -f database/schema.sql
```

### SQLite

```bash
sqlite3 procontent.db < database/schema.sql
```

## Frontend Setup

### Using npm

```bash
cd frontend
npm install
npm run build
```

### Using Webpack

```bash
npm install --save-dev webpack webpack-cli @babel/core @babel/preset-env babel-loader
npm run build
```

## Troubleshooting

### Upload Folder Permission Denied

```bash
chmod 755 uploads
chmod 755 uploads/*/
```

### Database Connection Error

Ensure MySQL/PostgreSQL is running:

```bash
# MySQL
mysql -u root -p -e "SELECT VERSION();"

# PostgreSQL
psql -U postgres -c "SELECT VERSION();"
```

### CORS Issues

Add CORS headers to your API:

Flask:
```python
from flask_cors import CORS
CORS(app)
```

Laravel:
```php
// config/cors.php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_methods' => ['*'],
'allowed_origins' => ['*'],
```

## Next Steps

- [Frontend API Documentation](FRONTEND_API.md)
- [Flask Integration Guide](FLASK_INTEGRATION.md)
- [Laravel Integration Guide](LARAVEL_INTEGRATION.md)
- [Security Best Practices](SECURITY.md)
- [Deployment Guide](DEPLOYMENT.md)
