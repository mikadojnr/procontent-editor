/**
 * ProContent Editor - Core Engine
 * Manages the editor state, document model, and block management
 */

class ProContentEditor {
  constructor(selector, options = {}) {
    this.selector = selector;
    this.container = document.querySelector(selector);
    
    if (!this.container) {
      throw new Error(`Container "${selector}" not found`);
    }

    // Configuration
    this.config = {
      height: options.height || 600,
      minHeight: options.minHeight || 300,
      plugins: options.plugins || [],
      theme: options.theme || 'light',
      autosave: options.autosave || false,
      autosaveInterval: options.autosaveInterval || 30000,
      spellcheck: options.spellcheck !== false,
      readOnly: options.readOnly || false,
      ...options
    };

    // State
    this.blocks = [];
    this.selectedBlock = null;
    this.history = [];
    this.historyIndex = -1;
    this.isDirty = false;

    // Initialize
    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
    this.loadPlugins();
    if (this.config.autosave) {
      this.startAutosave();
    }
  }

  render() {
    this.container.classList.add('procontent-editor', `theme-${this.config.theme}`);
    this.container.style.minHeight = `${this.config.height}px`;

    // Create structure
    this.container.innerHTML = `
      <div class="procontent-toolbar"></div>
      <div class="procontent-editor-container">
        <div class="procontent-blocks"></div>
      </div>
    `;

    this.editorContainer = this.container.querySelector('.procontent-blocks');
    this.toolbarContainer = this.container.querySelector('.procontent-toolbar');

    // Render toolbar
    this.renderToolbar();
  }

  renderToolbar() {
    const toolbar = this.toolbarContainer;
    toolbar.innerHTML = `
      <div class="toolbar-group">
        <button class="tool-btn" data-tool="bold" title="Bold (Ctrl+B)">
          <svg viewBox="0 0 24 24"><path d="M6 4h8a4 4 0 010 8H6V4zm0 9h9a4 4 0 010 8H6v-8z"/></svg>
        </button>
        <button class="tool-btn" data-tool="italic" title="Italic (Ctrl+I)">
          <svg viewBox="0 0 24 24"><path d="M10 5v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V5z"/></svg>
        </button>
        <button class="tool-btn" data-tool="underline" title="Underline (Ctrl+U)">
          <svg viewBox="0 0 24 24"><path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3m-1 16H7"/></svg>
        </button>
        <button class="tool-btn" data-tool="strikethrough" title="Strikethrough">
          <svg viewBox="0 0 24 24"><path d="M3 12h18M6 6h12a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z"/></svg>
        </button>
      </div>

      <div class="toolbar-group">
        <select class="toolbar-select" data-tool="heading" title="Heading">
          <option value="">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="h5">Heading 5</option>
          <option value="h6">Heading 6</option>
        </select>
      </div>

      <div class="toolbar-group">
        <button class="tool-btn" data-tool="align-left" title="Align Left">
          <svg viewBox="0 0 24 24"><path d="M3 6h18M3 12h12M3 18h18"/></svg>
        </button>
        <button class="tool-btn" data-tool="align-center" title="Align Center">
          <svg viewBox="0 0 24 24"><path d="M6 6h12M3 12h18M6 18h12"/></svg>
        </button>
        <button class="tool-btn" data-tool="align-right" title="Align Right">
          <svg viewBox="0 0 24 24"><path d="M3 6h18M9 12h12M3 18h18"/></svg>
        </button>
      </div>

      <div class="toolbar-group">
        <button class="tool-btn" data-tool="image" title="Insert Image">
          <svg viewBox="0 0 24 24"><path d="M21 19V5c0-1-1-2-2-2H5c-1 0-2 1-2 2v14c0 1 1 2 2 2h14c1 0 2-1 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
        </button>
        <button class="tool-btn" data-tool="table" title="Insert Table">
          <svg viewBox="0 0 24 24"><path d="M10 10.5H3.5v3H10v-3zm6.5 0H10v3h6.5v-3zm6.5 0h-6.5v3H23v-3zM3.5 4v3H10V4H3.5zm6.5 0v3h6.5V4H10zm6.5 0v3H23V4h-6.5zM3.5 17h6.5v-3H3.5v3zm6.5 0h6.5v-3H10v3zm6.5 0H23v-3h-6.5v3z"/></svg>
        </button>
        <button class="tool-btn" data-tool="link" title="Insert Link">
          <svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/></svg>
        </button>
      </div>

      <div class="toolbar-group">
        <button class="tool-btn" data-tool="undo" title="Undo (Ctrl+Z)">
          <svg viewBox="0 0 24 24"><path d="M3 7v6h6M21 17a7 7 0 01-7 7 7 7 0 01-7-7"/></svg>
        </button>
        <button class="tool-btn" data-tool="redo" title="Redo (Ctrl+Y)">
          <svg viewBox="0 0 24 24"><path d="M21 7v6h-6M3 17a7 7 0 007 7 7 7 0 007-7"/></svg>
        </button>
      </div>

      <div class="toolbar-group">
        <button class="tool-btn" data-tool="clear" title="Clear Formatting">
          <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6l1-3h6l1 3M6 9h12l-1 12H7L6 9z"/></svg>
        </button>
      </div>
    `;

    // Attach toolbar listeners
    toolbar.addEventListener('click', (e) => this.handleToolbarClick(e));
    toolbar.addEventListener('change', (e) => this.handleToolbarChange(e));
  }

  handleToolbarClick(e) {
    const btn = e.target.closest('.tool-btn');
    if (!btn) return;

    const tool = btn.dataset.tool;
    this.executeCommand(tool);
  }

  handleToolbarChange(e) {
    const select = e.target.closest('.toolbar-select');
    if (!select) return;

    const tool = select.dataset.tool;
    const value = select.value;
    this.executeCommand(tool, value);
  }

  executeCommand(command, value = null) {
    switch (command) {
      case 'bold':
        document.execCommand('bold');
        break;
      case 'italic':
        document.execCommand('italic');
        break;
      case 'underline':
        document.execCommand('underline');
        break;
      case 'strikethrough':
        document.execCommand('strikethrough');
        break;
      case 'heading':
        if (value) {
          document.execCommand('formatBlock', false, `<${value}>`);
        } else {
          document.execCommand('formatBlock', false, '<p>');
        }
        break;
      case 'align-left':
        document.execCommand('justifyLeft');
        break;
      case 'align-center':
        document.execCommand('justifyCenter');
        break;
      case 'align-right':
        document.execCommand('justifyRight');
        break;
      case 'image':
        this.insertImageBlock();
        break;
      case 'table':
        this.insertTableBlock();
        break;
      case 'link':
        this.insertLink();
        break;
      case 'undo':
        this.undo();
        break;
      case 'redo':
        this.redo();
        break;
      case 'clear':
        document.execCommand('removeFormat');
        break;
    }
  }

  insertImageBlock() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.uploadImage(file);
      }
    });
  }

  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/editor/upload-image', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        this.addBlock({
          type: 'image',
          image_id: data.image_id,
          src: data.url,
          alt: file.name,
          width: null,
          height: null
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }

  insertTableBlock() {
    const rows = prompt('Enter number of rows:', '3');
    const cols = prompt('Enter number of columns:', '3');

    if (rows && cols) {
      const table = [];
      for (let i = 0; i < parseInt(rows); i++) {
        const row = [];
        for (let j = 0; j < parseInt(cols); j++) {
          row.push('');
        }
        table.push(row);
      }

      this.addBlock({
        type: 'table',
        rows: table
      });
    }
  }

  insertLink() {
    const url = prompt('Enter URL:');
    if (url) {
      document.execCommand('createLink', false, url);
    }
  }

  addBlock(blockData) {
    const block = {
      id: this.generateId(),
      type: blockData.type,
      data: blockData,
      timestamp: Date.now()
    };

    this.blocks.push(block);
    this.renderBlock(block);
    this.saveHistory();
    this.isDirty = true;
  }

  renderBlock(block) {
    const blockEl = document.createElement('div');
    blockEl.className = `procontent-block block-${block.type}`;
    blockEl.dataset.blockId = block.id;

    switch (block.type) {
      case 'image':
        blockEl.innerHTML = `
          <div class="block-image">
            <img src="${block.data.src}" alt="${block.data.alt}" />
            <div class="image-controls">
              <button class="img-resize">Resize</button>
              <button class="img-delete">Delete</button>
            </div>
          </div>
        `;
        break;
      case 'table':
        blockEl.innerHTML = this.renderTable(block.data.rows);
        break;
      default:
        blockEl.innerHTML = `<p>${block.data.content || ''}</p>`;
    }

    this.editorContainer.appendChild(blockEl);
  }

  renderTable(rows) {
    const table = document.createElement('table');
    rows.forEach(row => {
      const tr = document.createElement('tr');
      row.forEach(cell => {
        const td = document.createElement('td');
        td.textContent = cell;
        td.contentEditable = true;
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });
    return table.outerHTML;
  }

  attachEventListeners() {
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeydown(e));

    // Block selection
    this.editorContainer.addEventListener('click', (e) => {
      const block = e.target.closest('.procontent-block');
      if (block) {
        this.selectBlock(block.dataset.blockId);
      }
    });
  }

  handleKeydown(e) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'z':
          e.preventDefault();
          this.undo();
          break;
        case 'y':
          e.preventDefault();
          this.redo();
          break;
        case 'b':
          e.preventDefault();
          document.execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          document.execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          document.execCommand('underline');
          break;
        case '/':
          e.preventDefault();
          this.showSlashCommands();
          break;
      }
    }
  }

  showSlashCommands() {
    const menu = document.createElement('div');
    menu.className = 'slash-menu';
    menu.innerHTML = `
      <div class="slash-item" data-command="image">/image - Insert image</div>
      <div class="slash-item" data-command="table">/table - Insert table</div>
      <div class="slash-item" data-command="quote">/quote - Insert quote</div>
      <div class="slash-item" data-command="code">/code - Insert code</div>
      <div class="slash-item" data-command="divider">/divider - Insert divider</div>
    `;

    menu.addEventListener('click', (e) => {
      const item = e.target.closest('.slash-item');
      if (item) {
        this.executeCommand(item.dataset.command);
        menu.remove();
      }
    });

    this.editorContainer.appendChild(menu);
  }

  selectBlock(blockId) {
    if (this.selectedBlock) {
      document.querySelector(`[data-block-id="${this.selectedBlock}"]`)?.classList.remove('selected');
    }
    this.selectedBlock = blockId;
    document.querySelector(`[data-block-id="${blockId}"]`)?.classList.add('selected');
  }

  saveHistory() {
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(JSON.parse(JSON.stringify(this.blocks)));
    this.historyIndex++;
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.blocks = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.render();
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.blocks = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.render();
    }
  }

  getContent() {
    return {
      blocks: this.blocks,
      timestamp: Date.now()
    };
  }

  setContent(content) {
    this.blocks = content.blocks || [];
    this.blocks.forEach(block => this.renderBlock(block));
    this.saveHistory();
  }

  startAutosave() {
    setInterval(() => {
      if (this.isDirty) {
        this.save();
        this.isDirty = false;
      }
    }, this.config.autosaveInterval);
  }

  async save() {
    try {
      await fetch('/api/editor/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.getContent())
      });
    } catch (error) {
      console.error('Save failed:', error);
    }
  }

  loadPlugins() {
    this.config.plugins.forEach(plugin => {
      if (typeof window.ProContentPlugins !== 'undefined' && window.ProContentPlugins[plugin]) {
        window.ProContentPlugins[plugin](this);
      }
    });
  }

  generateId() {
    return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  destroy() {
    this.container.innerHTML = '';
    document.removeEventListener('keydown', this.handleKeydown);
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProContentEditor;
}
