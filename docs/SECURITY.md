# Security Guide

## File Upload Security

### Allowed File Types

Only specific image formats are allowed:

```javascript
const ALLOWED_EXTENSIONS = {
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'
};
```

### File Size Limits

Default maximum file size: **50MB**

```python
# Flask
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024

# Laravel
'max_size' => 50 * 1024 * 1024
```

### File Validation

1. **Extension Whitelist**: Only allowed extensions are processed
2. **MIME Type Check**: Server validates MIME type
3. **Size Validation**: Enforce file size limits
4. **Filename Sanitization**: Filenames are sanitized and randomized

```python
# Example: Flask implementation
def save_image(self, file):
    if not self.allowed_file(file.filename):
        raise ValueError('File type not allowed')
    
    # Generate unique filename with UUID
    original_ext = secure_filename(file.filename).rsplit('.', 1)[1].lower()
    image_id = f"img_{uuid.uuid4().hex[:12]}"
    filename = f"{image_id}.{original_ext}"
```

## Content Security

### XSS Prevention

All user content is HTML-escaped:

```python
def escape_html(text):
    return (text
        .replace('&', '&amp;')
        .replace('<', '&lt;')
        .replace('>', '&gt;')
        .replace('"', '&quot;')
        .replace("'", '&#39;'))
```

### Content Validation

JSON content is validated before processing:

```python
def validate_content(self, content_json):
    if isinstance(content_json, str):
        try:
            content_json = json.loads(content_json)
        except json.JSONDecodeError:
            return False, 'Invalid JSON'
    
    if not isinstance(content_json, dict):
        return False, 'Content must be a dictionary'
    
    return True, 'Valid'
```

### SQL Injection Prevention

Always use parameterized queries:

```python
# SQLAlchemy (Flask)
post = Post.query.filter_by(id=post_id).first()

# Eloquent (Laravel)
$post = Post::where('id', $postId)->first();
```

## API Security

### CORS Configuration

Control cross-origin requests:

```python
# Flask
CORS(app, resources={
    r"/api/*": {
        "origins": ["https://yourdomain.com"],
        "methods": ["GET", "POST"],
        "allow_headers": ["Content-Type"],
        "max_age": 3600
    }
})
```

```php
// Laravel config/cors.php
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['https://yourdomain.com'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
```

### CSRF Protection

Flask:
```python
from flask_wtf.csrf import CSRFProtect

csrf = CSRFProtect(app)

@app.route('/api/posts', methods=['POST'])
@csrf.exempt  # For API endpoints
def create_post():
    pass
```

Laravel:
```php
// Already included in Laravel by default
// Use CSRF token in forms
<form method="POST" action="/posts">
    @csrf
    <!-- Form fields -->
</form>
```

### Rate Limiting

Prevent brute force and DoS attacks:

```python
# Flask
from flask_limiter import Limiter

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

@app.route('/api/editor/upload-image', methods=['POST'])
@limiter.limit("10 per minute")
def upload_image():
    pass
```

```php
// Laravel
Route::middleware('throttle:10,1')->post('/api/editor/upload-image', 
    [EditorController::class, 'uploadImage']
);
```

### Authentication

Protect editor endpoints with authentication:

```python
# Flask
from functools import wraps
from flask import request, jsonify

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Unauthorized'}), 401
        # Validate token
        return f(*args, **kwargs)
    return decorated

@app.route('/api/posts', methods=['POST'])
@token_required
def create_post():
    pass
```

```php
// Laravel
Route::middleware('auth:sanctum')->post('/posts', 
    [PostController::class, 'store']
);
```

## Storage Security

### File Permissions

Set correct permissions on upload directories:

```bash
# Linux/Mac
chmod 755 uploads
chmod 644 uploads/*/*  # Uploaded files

# Prevent direct execution
chmod 000 uploads/*.php
chmod 000 uploads/*.sh
```

### Directory Structure

Keep uploads outside web root when possible:

```
/var/www/myapp/
├── public/          # Web accessible
├── app/
├── uploads/         # NOT web accessible
└── storage/
```

Configure web server to serve uploads safely:

```nginx
# Nginx
location ~ \.php$ {
    deny all;
}
```

## HTTPS/TLS

Always use HTTPS in production:

```python
# Flask - Redirect HTTP to HTTPS
@app.before_request
def before_request():
    if not request.is_secure and app.env == 'production':
        url = request.url.replace('http://', 'https://', 1)
        return redirect(url, code=301)
```

```php
// Laravel - force HTTPS
// config/app.php
'url' => env('APP_URL', 'https://yourdomain.com'),
```

## Database Security

### Sensitive Data

Never store sensitive information in content:

```python
# GOOD: Store content safely
content = {
    'blocks': [
        {'type': 'paragraph', 'data': {'content': 'Public text'}}
    ]
}

# BAD: Don't store passwords/tokens
content = {
    'blocks': [
        {'type': 'paragraph', 'data': {'content': 'user_password_123'}}
    ]
}
```

### Data Encryption

Encrypt sensitive fields:

```python
# Flask with cryptography
from cryptography.fernet import Fernet

cipher = Fernet(key)
encrypted_content = cipher.encrypt(content.encode())
```

```php
// Laravel encryption
use Illuminate\Support\Facades\Crypt;

$encrypted = Crypt::encrypt($content);
$decrypted = Crypt::decrypt($encrypted);
```

## Logging and Monitoring

### Application Logs

Log important events:

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/api/editor/upload-image', methods=['POST'])
def upload_image():
    try:
        # Process upload
        logger.info(f'Image uploaded by user {user_id}')
    except Exception as e:
        logger.error(f'Upload failed: {str(e)}')
```

```php
// Laravel
Log::info('Image uploaded', ['user_id' => auth()->id()]);
Log::error('Upload failed', ['error' => $exception->getMessage()]);
```

### Security Headers

Add security headers to responses:

```python
# Flask
@app.after_request
def set_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000'
    return response
```

```php
// Laravel middleware
public function handle($request, Closure $next)
{
    $response = $next($request);
    
    $response->headers->set('X-Content-Type-Options', 'nosniff');
    $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
    $response->headers->set('X-XSS-Protection', '1; mode=block');
    
    return $response;
}
```

## Deployment Checklist

- [ ] HTTPS/TLS enabled
- [ ] Database credentials in environment variables
- [ ] Upload folder permissions set correctly
- [ ] CORS configured for specific domains
- [ ] Rate limiting enabled
- [ ] Authentication required for API
- [ ] Logging and monitoring active
- [ ] Security headers configured
- [ ] Database backed up regularly
- [ ] Dependencies updated and patched
- [ ] File size limits enforced
- [ ] Input validation in place

## Common Vulnerabilities

### Path Traversal

❌ BAD:
```python
file_path = os.path.join(upload_dir, request.args.get('path'))
```

✅ GOOD:
```python
filename = secure_filename(request.args.get('path'))
file_path = os.path.join(upload_dir, filename)
```

### Insecure Deserialization

❌ BAD:
```python
content = pickle.loads(request.data)
```

✅ GOOD:
```python
content = json.loads(request.data)
```

### SQL Injection

❌ BAD:
```python
post = Post.query.filter("id = " + str(post_id)).first()
```

✅ GOOD:
```python
post = Post.query.filter_by(id=post_id).first()
```

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Flask Security](https://flask.palletsprojects.com/en/2.0.x/security/)
- [Laravel Security](https://laravel.com/docs/security)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

## Reporting Security Issues

If you discover a security vulnerability, please email security@procontent.dev instead of using the public issue tracker.

## License

MIT
