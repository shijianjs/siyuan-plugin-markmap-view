// 插件内共享的常量：图标、停靠栏类型、设置项 key。

export const ICON_NAME = "icon-park-outline--mindmap-map";
export const DOCK_TYPE = "markmap_dock";
export const DARK_MODE_CLASS = "markmap-dark";

// 设置项 key
export const MARKDOWN_SOURCE_MODE = "markdownSourceMode";
export const COLOR_FREEZE_LEVEL = "colorFreezeLevel";
export const DURATION = "duration";
export const MAX_WIDTH = "maxWidth";
export const INITIAL_EXPAND_LEVEL = "initialExpandLevel";
export const ZOOM = "zoom";
export const PAN = "pan";
export const SPACING_HORIZONTAL = "spacingHorizontal";
export const SPACING_VERTICAL = "spacingVertical";

// 文档内容来源
export enum MarkdownSourceMode {
    getDoc = "getDoc",
    exportMdContent = "exportMdContent",
}
