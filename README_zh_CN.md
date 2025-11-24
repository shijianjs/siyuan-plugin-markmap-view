# 思源 markmap 视图插件

[English](./README.md)

## 操作
- 安装插件
- 右上角工具栏会出现图标
- 打开一个文档
- 点击图标，弹出markmap视图
  - 或使用快捷键 `Ctrl + Alt + M`

## 配置

### 全局配置
- 操作
  - 点击插件的配置按钮
- 目前支持的配置项：
  - 默认展开层级
    - markmap默认展开多少层，这个层级后面折叠，-1表示不折叠；
    - 针对单个文档的配置项是`initialExpandLevel`
  - 最大宽度
    - 节点内容的最大宽度，默认是600，设置为0不限制
    - 针对单个文档的配置项是`maxWidth`

### 文档级配置
参考：https://markmap.js.org/docs/json-options
- 也就是在文档的开头添加两个 `---`，中间的内容填配置项，语法是`yaml`；
- 文档的`Option List`是支持的配置项列表；

示例：
```markdown
---
markmap:
  initialExpandLevel: 4
---

思源笔记markdown正文内容

```


## 感谢

- [markmap](https://markmap.js.org/)
- [siyuan](https://github.com/siyuan-note/siyuan)
