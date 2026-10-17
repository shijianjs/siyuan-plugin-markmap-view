import { Dialog, getAllEditor, IProtyle, Plugin, showMessage } from "siyuan";

import type zh_CN from "../public/i18n/zh_CN.json";

import "./index.scss";
import "markmap-toolbar/dist/style.css";

import { SettingUtils } from "@/libs/setting-utils";
import { getProtyle } from "@/SiyuanUtils";

import { ICON_NAME, MAX_WIDTH } from "./constants";
import { registerMarkmapDock } from "./dock";
import { MarkmapRender } from "./markmap-render";
import { initSettings } from "./settings";

export default class SiYuanMarkmapViewPlugin extends Plugin {
    settingUtils: SettingUtils;
    typedI18n: typeof zh_CN;

    async onload() {
        this.typedI18n = this.i18n as any;
        this.settingUtils = await initSettings(this, this.typedI18n);

        // 图标的制作参见帮助文档
        this.addIcons(`
            <symbol id="${ICON_NAME}" viewBox="0 0 48 48"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M26 24h16M26 38h16M26 10h16M18 24H6h4m8 14c-6-2-2-14-8-14m8-14c-6 2-2 14-8 14"/></symbol>
            `);
        // 添加快捷键
        this.addCommand({
            langKey: "openMarkmapDialog",
            langText: this.typedI18n.actionName,
            hotkey: "⌥⌘M", // Ctrl+Alt+M
            callback: () => this.openMarkmapDialog(),
            fileTreeCallback: () => this.openMarkmapDialog(),
            editorCallback: () => this.openMarkmapDialog(),
            dockCallback: () => this.openMarkmapDialog(),
        });
    }

    get maxWidth() {
        return this.settingUtils.get(MAX_WIDTH) ?? 600;
    }

    onLayoutReady() {
        this.addTopBar({
            icon: ICON_NAME,
            title: this.typedI18n.actionName,
            position: "right",
            callback: () => this.openMarkmapDialog(),
        });
        registerMarkmapDock(this);
    }

    async openMarkmapDialog() {
        const markmapRender = new MarkmapRender({ plugin: this });
        await markmapRender.init();

        const dialog = new Dialog({
            title: `Markmap - ${markmapRender.title}`,
            content: `
                        <div class="markmap-view-container">
                            <svg class="markmap-view-svg" />
                        </div>
                        `,
            width: "95vw",
            height: "95vh",
            destroyCallback: () => {
                markmapRender.mm?.destroy();
            },
        });
        markmapRender.contextElement = dialog.element;

        await markmapRender.renderMarkmap();
    }

    getEditor() {
        const editors = getAllEditor();
        if (editors.length === 0) {
            showMessage(`请先打开文档`, 6000, "error");
            return;
        }
        return { protyle: getProtyle() as IProtyle };
    }

    async onunload() {
        // 无需额外清理
    }

    uninstall() {
        // 无需额外清理
    }
}
