# Frontend API Documentation

## ProContentEditor API

### Initialization

```javascript
const editor = new ProContentEditor(selector, options);
```

#### Selector
CSS selector string for the container element.

#### Options

```javascript
{
  height: 600,                    // Editor height in pixels
  minHeight: 300,                 // Minimum height
  plugins: [],                    // Array of plugin names
  theme: 'light',                 // 'light' or 'dark'
  autosave: false,               // Enable autosave
  autosaveInterval: 30000,       // Autosave interval in ms
  spellcheck: true,              // Enable spellcheck
  readOnly: false                // Read-only mode
}
```

### Methods

#### `addBlock(blockData)`

Add a new block to the editor.

```javascript
editor.addBlock({
  type: 'paragraph',
  data: { content: 'Hello world' }
});
```

#### `renderBlock(block)`

Render a block to HTML.

```javascript
const html = editor.renderBlock({
  type: 'image',
  data: {
    src: '/uploads/image.jpg',
    alt: 'Test'
  }
});
```

#### `getContent()`

Get current editor content as JSON.

```javascript
const content = editor.getContent();
// {
//   blocks: [...],
//   timestamp: 1234567890
// }
```

#### `setContent(content)`

Set editor content from JSON.

```javascript
editor.setContent({
  blocks: [
    { type: 'paragraph', data: { content: 'Hello' } }
  ]
});
```

#### `undo()`

Undo the last action.

```javascript
editor.undo();
```

#### `redo()`

Redo the last undone action.

```javascript
editor.redo();
```

#### `save()`

Save content (if backend configured).

```javascript
await editor.save();
```

#### `destroy()`

Destroy the editor instance.

```javascript
editor.destroy();
```

#### `insertImageBlock()`

Insert an image block via file upload dialog.

```javascript
editor.insertImageBlock();
```

#### `insertTableBlock()`

Insert a table block.

```javascript
editor.insertTableBlock();
```

#### `insertLink()`

Insert a link into selected text.

```javascript
editor.insertLink();
```

#### `showSlashCommands()`

Show slash command menu.

```javascript
editor.showSlashCommands();
```

#### `executeCommand(command, value)`

Execute a toolbar command.

```javascript
editor.executeCommand('bold');
editor.executeCommand('heading', 'h1');
```

### Events

#### Content Change

```javascript
editor.container.addEventListener('procontent-change', (e) => {
  console.log('Content changed:', e.detail.content);
});
```

#### Block Added

```javascript
editor.container.addEventListener('procontent-block-added', (e) => {
  console.log('Block added:', e.detail.block);
});
```

#### Block Removed

```javascript
editor.container.addEventListener('procontent-block-removed', (e) => {
  console.log('Block removed:', e.detail.blockId);
});
```

#### Upload Progress

```javascript
editor.container.addEventListener('procontent-upload-progress', (e) => {
  console.log('Upload progress:', e.detail.progress);
});
```

### Block Types

#### Paragraph

```javascript
{
  type: 'paragraph',
  data: {
    content: 'Text content'
  }
}
```

#### Heading

```javascript
{
  type: 'heading',
  data: {
    content: 'Heading text',
    level: 1
  }
}
```

#### Image

```javascript
{
  type: 'image',
  data: {
    image_id: 'img_abc123',
    src: '/uploads/image.jpg',
    alt: 'Description',
    width: 800,
    height: 600,
    alignment: 'center',
    caption: 'Image caption'
  }
}
```

#### Gallery

```javascript
{
  type: 'gallery',
  data: {
    images: [
      { src: '/uploads/img1.jpg', alt: 'Image 1' },
      { src: '/uploads/img2.jpg', alt: 'Image 2' }
    ]
  }
}
```

#### Table

```javascript
{
  type: 'table',
  data: {
    rows: [
      ['Cell 1', 'Cell 2'],
      ['Cell 3', 'Cell 4']
    ]
  }
}
```

#### List

```javascript
{
  type: 'list',
  data: {
    list_type: 'ul',  // 'ul' or 'ol'
    items: ['Item 1', 'Item 2']
  }
}
```

#### Quote

```javascript
{
  type: 'quote',
  data: {
    content: 'Quote text'
  }
}
```

#### Code

```javascript
{
  type: 'code',
  data: {
    language: 'javascript',
    content: 'console.log("Hello");'
  }
}
```

#### Divider

```javascript
{
  type: 'divider',
  data: {}
}
```

#### Callout

```javascript
{
  type: 'callout',
  data: {
    callout_type: 'info',  // 'info', 'warning', 'error', 'success'
    content: 'Callout content'
  }
}
```

#### Video

```javascript
{
  type: 'video',
  data: {
    url: 'https://youtube.com/embed/abc123'
  }
}
```

#### Audio

```javascript
{
  type: 'audio',
  data: {
    url: '/uploads/audio.mp3'
  }
}
```

### Keyboard Shortcuts

| Shortcut | Command |
|----------|---------|
| Ctrl+B | Bold |
| Ctrl+I | Italic |
| Ctrl+U | Underline |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+/ | Show Slash Commands |

### Slash Commands

| Command | Description |
|---------|-------------|
| /image | Insert image |
| /table | Insert table |
| /quote | Insert quote |
| /code | Insert code block |
| /divider | Insert divider |
| /gallery | Insert gallery |
| /video | Insert video embed |

### Styling

#### Dark Mode

```javascript
const editor = new ProContentEditor('#editor', {
  theme: 'dark'
});
```

#### Custom CSS

```css
.procontent-editor {
  font-family: 'Arial', sans-serif;
}

.procontent-toolbar {
  background: #f5f5f5;
}

.tool-btn:hover {
  background: #ddd;
}
```

### Content Persistence

#### Autosave

```javascript
const editor = new ProContentEditor('#editor', {
  autosave: true,
  autosaveInterval: 30000  // Every 30 seconds
});
```

#### Manual Save

```javascript
document.getElementById('save-btn').addEventListener('click', async () => {
  try {
    await editor.save();
    console.log('Saved successfully');
  } catch (error) {
    console.error('Save failed:', error);
  }
});
```

#### Validation

```javascript
const content = editor.getContent();

// Send to backend for validation
fetch('/api/editor/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(content)
})
.then(r => r.json())
.then(data => {
  if (data.success) {
    console.log('Content is valid');
  }
});
```

### Plugins

#### Creating a Custom Plugin

```javascript
window.ProContentPlugins = window.ProContentPlugins || {};

window.ProContentPlugins.myPlugin = function(editor) {
  console.log('My plugin initialized');
  
  // Add custom toolbar button
  const btn = document.createElement('button');
  btn.className = 'tool-btn';
  btn.innerHTML = '🎯';
  btn.addEventListener('click', () => {
    editor.addBlock({
      type: 'custom',
      data: {}
    });
  });
  
  editor.toolbarContainer.appendChild(btn);
};

// Use plugin
const editor = new ProContentEditor('#editor', {
  plugins: ['myPlugin']
});
```

### Advanced Usage

#### Custom Block Renderer

```javascript
editor.renderBlock = function(block) {
  if (block.type === 'custom') {
    return '<div class="custom-block">Custom Content</div>';
  }
  return this.constructor.prototype.renderBlock.call(this, block);
};
```

#### History Management

```javascript
console.log('Total history states:', editor.history.length);
console.log('Current position:', editor.historyIndex);

// Clear history
editor.history = [];
editor.historyIndex = -1;
```

## License

MIT
