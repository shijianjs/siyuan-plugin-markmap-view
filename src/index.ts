import {
    Plugin,
    showMessage,
    Dialog,
    getAllEditor
} from "siyuan";
import {Markmap, deriveOptions} from 'markmap-view';
import {Toolbar} from 'markmap-toolbar';
import {Transformer} from 'markmap-lib';

import type zh_CN from '../public/i18n/zh_CN.json'

import "./index.scss";

import {client} from "@/client";
import {getProtyle} from "@/SiyuanUtils";
import {SettingUtils} from "@/libs/setting-utils";


const transformer = new Transformer();

const ICON_NAME = "icon-park-outline--mindmap-map";

const initialExpandLevelName = "initialExpandLevel";

export default class SiYuanMarkmapViewPlugin extends Plugin {

    private settingUtils: SettingUtils;
    typedI18n: typeof zh_CN

    async onload() {
        this.typedI18n = this.i18n as any
        await this.initSettings();

        // 图标的制作参见帮助文档
        this.addIcons(`
            <symbol id="icon-park-outline--mindmap-map" viewBox="0 0 48 48"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M26 24h16M26 38h16M26 10h16M18 24H6h4m8 14c-6-2-2-14-8-14m8-14c-6 2-2 14-8 14"/></symbol>
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

    private async initSettings() {
        this.settingUtils = new SettingUtils({
            plugin: this
        });
        this.settingUtils.addItem({
            key: initialExpandLevelName,
            value: 4,
            type: "number",
            title: this.typedI18n.initialExpandLevel.title,
            description: this.typedI18n.initialExpandLevel.description,
        });
        await this.settingUtils.load(); //导入配置并合并
    }

    onLayoutReady() {
        console.log("Markmap 插件已加载");
        this.addTopBar({
            icon: ICON_NAME,                    // 按钮图标
            title: this.i18n.actionName,         // 提示文字
            position: "right",             // 可选：left / right
            callback: () => this.openMarkmapDialog(),
        });

    }

    async openMarkmapDialog() {
        let protyle = this.getEditor().protyle;
        const docId = protyle.block.rootID;
        const docInfoResp = await client.getDocInfo({id: docId})
        const docResp = await client.getDoc({id: docId})
        let title: string = docInfoResp.data.name;
        // console.log(protyle)
        // const mdResp = await client.exportMdContent({id: docId})
        // let markdown = mdResp.data.content;
        let docHtmlContent = docResp.data.content;
        let lute = window.Lute.New();
        let mdContent = lute.BlockDOM2StdMd(docHtmlContent);
        let markdown = mdContent
        // console.log("markdown", markdown)
        // console.log("点击了生成思维导图", this.name, docId, this.getEditor().protyle, doc, markdown);
        const dialog = new Dialog({
            title: `Markmap - ${title}`,
            content: `
                        <div class="markmap-view-container">
                            <svg class="markmap-view-svg" />
                        </div>
                        `,
            width: '95vw',
            height: '95vh',
            destroyCallback: () => {
                console.log("destroyCallback 关闭了");
                mm?.destroy()
            }
        });
        const containerDiv: HTMLElement = dialog.element.querySelector(".markmap-view-container");
        const markmapSvg = dialog.element.querySelector(".markmap-view-svg");
        let transformResult = transformer.transform(markdown);
        // console.log("transformResult", transformResult)
        const mm = Markmap.create(markmapSvg, {
            initialExpandLevel: this.settingUtils.get(initialExpandLevelName),
        });
        transformResult.root.content = title
        await mm.setData(transformResult.root, deriveOptions(transformResult.frontmatter?.markmap ?? {}));
        await mm.fit();
        let toolbar = Toolbar.create(mm);
        containerDiv.append(toolbar.el);
        // 自动聚焦，意义不大
        // setTimeout(() => {
        //     let dialogContainer= containerDiv
        //     dialogContainer.tabIndex = -1; // 使其可聚焦
        //     dialogContainer.focus({ preventScroll: true });
        // }, 100);
    }

    async onunload() {
        console.log("onunload");
    }

    uninstall() {
        console.log("uninstall");
    }


    private getEditor() {
        const editors = getAllEditor();
        if (editors.length === 0) {
            showMessage(`请先打开文档`, 6000, "error");
            return;
        }
        let protyle = getProtyle();
        return {protyle};
    }
}
