
# Siyuan markmap view plugin

[中文版](./README_zh_CN.md)


## Operations
- Install the plugin
- An icon will appear in the top right toolbar
- Open a document
- Click the icon to pop up the markmap view
    - Or use the shortcut key `Ctrl + Alt + M`

## Configuration

### Global Configuration
- Operation
    - Click the plugin's configuration button
- Currently supported configuration items:
    - Default Expand Level
        - How many levels markmap expands by default, levels after this will be collapsed, -1 means no collapse;
        - The configuration item for individual documents is `initialExpandLevel`

### Document-level Configuration
Reference: https://markmap.js.org/docs/json-options
- That is, add two `---` at the beginning of the document, and fill in the configuration items between them, the syntax is `yaml`;
- The document's `Option List` is the list of supported configuration items;

Example:
```markdown
---
markmap:
  initialExpandLevel: 4
---

SiYuan note markdown content

```

## Credits

- [markmap](https://markmap.js.org/)
- [siyuan](https://github.com/siyuan-note/siyuan)