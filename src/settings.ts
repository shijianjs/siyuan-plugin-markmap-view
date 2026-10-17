import type { Plugin } from "siyuan";
import type zh_CN from "../public/i18n/zh_CN.json";

import { SettingUtils } from "@/libs/setting-utils";
import {
    COLOR_FREEZE_LEVEL,
    DURATION,
    INITIAL_EXPAND_LEVEL,
    MARKDOWN_SOURCE_MODE,
    MarkdownSourceMode,
    MAX_WIDTH,
    PAN,
    SPACING_HORIZONTAL,
    SPACING_VERTICAL,
    ZOOM,
} from "./constants";

/**
 * 注册并加载插件设置项，返回可读写的 SettingUtils 实例。
 */
export async function initSettings(plugin: Plugin, i18n: typeof zh_CN): Promise<SettingUtils> {
    const settingUtils = new SettingUtils({ plugin });

    settingUtils.addItem({
        key: MARKDOWN_SOURCE_MODE,
        value: MarkdownSourceMode.exportMdContent,
        type: "select",
        title: i18n.markdownSourceMode.title,
        description: i18n.markdownSourceMode.description,
        options: {
            [MarkdownSourceMode.exportMdContent]: i18n.markdownSourceMode.exportMdContent,
            [MarkdownSourceMode.getDoc]: i18n.markdownSourceMode.getDoc,
        },
    });

    settingUtils.addItem({
        key: COLOR_FREEZE_LEVEL,
        value: 2,
        type: "number",
        title: i18n.colorFreezeLevel.title,
        description: i18n.colorFreezeLevel.description,
    });
    settingUtils.addItem({
        key: DURATION,
        value: 500,
        type: "number",
        title: i18n.duration.title,
        description: i18n.duration.description,
    });
    settingUtils.addItem({
        key: MAX_WIDTH,
        value: 600,
        type: "number",
        title: i18n.maxWidth.title,
        description: i18n.maxWidth.description,
    });
    settingUtils.addItem({
        key: INITIAL_EXPAND_LEVEL,
        value: 4,
        type: "number",
        title: i18n.initialExpandLevel.title,
        description: i18n.initialExpandLevel.description,
    });
    settingUtils.addItem({
        key: ZOOM,
        value: true,
        type: "checkbox",
        title: i18n.zoom.title,
        description: i18n.zoom.description,
    });
    settingUtils.addItem({
        key: PAN,
        value: true,
        type: "checkbox",
        title: i18n.pan.title,
        description: i18n.pan.description,
    });
    settingUtils.addItem({
        key: SPACING_HORIZONTAL,
        value: 80,
        type: "number",
        title: i18n.spacingHorizontal.title,
        description: i18n.spacingHorizontal.description,
    });
    settingUtils.addItem({
        key: SPACING_VERTICAL,
        value: 5,
        type: "number",
        title: i18n.spacingVertical.title,
        description: i18n.spacingVertical.description,
    });

    await settingUtils.load(); // 导入配置并合并
    return settingUtils;
}
