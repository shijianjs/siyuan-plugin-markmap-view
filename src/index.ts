import {Dialog, getAllEditor, IProtyle, Plugin, showMessage} from "siyuan";
import {deriveOptions, Markmap} from 'markmap-view';
import {Toolbar} from 'markmap-toolbar';
import {Transformer} from 'markmap-lib';

import type zh_CN from '../public/i18n/zh_CN.json'

import "./index.scss";
import "markmap-toolbar/dist/style.css"

import {client} from "@/client";
import {getProtyle, removeUntilFirstH1, truncateAtFootnote1} from "@/SiyuanUtils";
import {SettingUtils} from "@/libs/setting-utils";


const transformer = new Transformer();

const ICON_NAME = "icon-park-outline--mindmap-map";

const darkModeClassName = "markmap-dark";

const markdownSourceModeName = "markdownSourceMode";

const colorName = "color";
const colorFreezeLevelName = "colorFreezeLevel";
const durationName = "duration";
const maxWidthName = "maxWidth";
const initialExpandLevelName = "initialExpandLevel";
const extraJsName = "extraJs";
const extraCssName = "extraCss";
const zoomName = "zoom";
const panName = "pan";
const htmlParserName = "htmlParser";
const spacingHorizontalName = "spacingHorizontal";
const spacingVerticalName = "spacingVertical";
const activeNodeName = "activeNode";
const lineWidthName = "lineWidth";

enum ActiveNode {
    visible = "visible",
    center = "center"
}

// type ConvertMode = "getDoc" | "exportMdContent"
enum MarkdownSourceMode {
    getDoc = "getDoc",
    exportMdContent = "exportMdContent"
}

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
            key: markdownSourceModeName,
            value: MarkdownSourceMode.exportMdContent,
            type: "select",
            title: this.typedI18n.markdownSourceMode.title,
            description: this.typedI18n.markdownSourceMode.description,
            options: {
                [MarkdownSourceMode.exportMdContent]: this.typedI18n.markdownSourceMode.exportMdContent,
                [MarkdownSourceMode.getDoc]: this.typedI18n.markdownSourceMode.getDoc,
            }
        });

        // settings for markmap options

        // this.settingUtils.addItem({
        //     key: colorName,
        //     value: "",
        //     type: "",
        //     title: this.typedI18n.color.title,
        //     description: this.typedI18n.color.description,
        // });
        this.settingUtils.addItem({
            key: colorFreezeLevelName,
            value: 2,
            type: "number",
            title: this.typedI18n.colorFreezeLevel.title,
            description: this.typedI18n.colorFreezeLevel.description,
        });
        this.settingUtils.addItem({
            key: durationName,
            value: 500,
            type: "number",
            title: this.typedI18n.duration.title,
            description: this.typedI18n.duration.description,
        });
        this.settingUtils.addItem({
            key: maxWidthName,
            value: 600,
            type: "number",
            title: this.typedI18n.maxWidth.title,
            description: this.typedI18n.maxWidth.description,
        });
        this.settingUtils.addItem({
            key: initialExpandLevelName,
            value: 4,
            type: "number",
            title: this.typedI18n.initialExpandLevel.title,
            description: this.typedI18n.initialExpandLevel.description,
        });
        // this.settingUtils.addItem({
        //     key: extraJsName,
        //     value: "",
        //     type: "textarea",
        //     title: this.typedI18n.extraJs.title,
        //     description: this.typedI18n.extraJs.description,
        //     placeholder: `// Example:\nconsole.log("Hello Markmap!");`,
        // });
        // this.settingUtils.addItem({
        //     key: extraCssName,
        //     value: "",
        //     type: "textarea",
        //     title: this.typedI18n.extraCss.title,
        //     description: this.typedI18n.extraCss.description,
        //     placeholder: `/* Example: */\n.markmap-node { fill: red; }`,
        // });
        this.settingUtils.addItem({
            key: zoomName,
            value: true,
            type: "checkbox",
            title: this.typedI18n.zoom.title,
            description: this.typedI18n.zoom.description,
        });
        this.settingUtils.addItem({
            key: panName,
            value: true,
            type: "checkbox",
            title: this.typedI18n.pan.title,
            description: this.typedI18n.pan.description,
        });
        // this.settingUtils.addItem({
        //     key: htmlParserName,
        //     value: "",
        //     type: "",
        //     title: this.typedI18n.htmlParser.title,
        //     description: this.typedI18n.htmlParser.description,
        // });
        this.settingUtils.addItem({
            key: spacingHorizontalName,
            value: 80,
            type: "number",
            title: this.typedI18n.spacingHorizontal.title,
            description: this.typedI18n.spacingHorizontal.description,
        });
        this.settingUtils.addItem({
            key: spacingVerticalName,
            value: 5,
            type: "number",
            title: this.typedI18n.spacingVertical.title,
            description: this.typedI18n.spacingVertical.description,
        });
        // this.settingUtils.addItem({
        //     key: activeNodeName,
        //     value: ActiveNode.visible,
        //     type: "select",
        //     title: this.typedI18n.activeNode.title,
        //     description: this.typedI18n.activeNode.description,
        //     options: {
        //         [ActiveNode.visible]: ActiveNode.visible,
        //         [ActiveNode.center]: ActiveNode.center,
        //     }
        // });
        // 线宽不太好设置，就用默认的了，默认也是递减的
        // this.settingUtils.addItem({
        //     key: lineWidthName,
        //     value: 1,
        //     type: "number",
        //     title: this.typedI18n.lineWidth.title,
        //     description: this.typedI18n.lineWidth.description,
        // });
        await this.settingUtils.load(); //导入配置并合并
    }

    get maxWidth() {
        return this.settingUtils.get(maxWidthName) ?? 600;
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
        this.initDarkTheme();

        let protyle: IProtyle = this.getEditor().protyle;
        const docId = protyle.block.rootID;
        const docInfoResp = await client.getDocInfo({id: docId})
        let title: string = docInfoResp.data.name;

        let mode = this.settingUtils.get(markdownSourceModeName);
        let markdown:string;
        if (mode === MarkdownSourceMode.getDoc) {
            const docResp = await client.getDoc({id: docId})
            let docHtmlContent = docResp.data.content;
            markdown = protyle.lute.BlockDOM2StdMd(docHtmlContent)
        } else {
            const mdResp = await client.exportMdContent({id: docId})
            markdown = truncateAtFootnote1(mdResp.data.content);
            markdown = removeUntilFirstH1(markdown);
            console.log("markdown", markdown)
        }

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
        const mm = Markmap.create(markmapSvg, deriveOptions({
            colorFreezeLevel: this.settingUtils.get(colorFreezeLevelName),
            duration: this.settingUtils.get(durationName),
            maxWidth: this.maxWidth,
            initialExpandLevel: this.settingUtils.get(initialExpandLevelName),
            zoom: this.settingUtils.get(zoomName),
            pan: this.settingUtils.get(panName),
            spacingHorizontal: this.settingUtils.get(spacingHorizontalName),
            spacingVertical: this.settingUtils.get(spacingVerticalName),
            
            // 不太好设置，就用默认的了，默认也是递减的
            // lineWidth: (node)=>{
            //     let depth = node.state.depth;
            //     let w = 4- depth;
            //     w = Math.max(w, 1);
            //     return w;
            // },
        }));
        transformResult.root.content = title
        await mm.setData(transformResult.root, deriveOptions(transformResult.frontmatter?.markmap ?? {}));
        await mm.fit();
        let toolbar = Toolbar.create(mm);
        containerDiv.append(toolbar.el);
        // toolbar.el.classList.add('button-panel');
        let downloadSvgBtn = this.createDownloadBtn(mm, title);
        toolbar.el.appendChild(downloadSvgBtn)
        // 自动聚焦，意义不大
        // setTimeout(() => {
        //     let dialogContainer= containerDiv
        //     dialogContainer.tabIndex = -1; // 使其可聚焦
        //     dialogContainer.focus({ preventScroll: true });
        // }, 100);
    }

    get colorFreezeLevel() {
        return this.settingUtils.get(colorFreezeLevelName);
    }

    get duration() {
        return this.settingUtils.get(durationName);
    }

    get initialExpandLevel() {
        return this.settingUtils.get(initialExpandLevelName);
    }

    get spacingHorizontal() {
        return this.settingUtils.get(spacingHorizontalName);
    }

    get spacingVertical() {
        return this.settingUtils.get(spacingVerticalName);
    }

    get zoom() {
        return this.settingUtils.get(zoomName);
    }

    get pan() {
        return this.settingUtils.get(panName);
    }

    private createDownloadBtn(mm: Markmap, title: string) {
        let downloadSvgBtn = document.createElement("div");
        downloadSvgBtn.title = this.typedI18n.exportSvgImage
        downloadSvgBtn.innerHTML = '🖼️'
        downloadSvgBtn.classList.add('mm-toolbar-item')
        downloadSvgBtn.addEventListener("click", () => {
            let svg = new XMLSerializer().serializeToString(mm.svg.node());
            let blob = new Blob([svg], {type: "image/svg+xml"});
            let url = URL.createObjectURL(blob);
            let a = document.createElement("a");
            a.href = url;
            a.download = title + ".markmap.svg";
            a.click();
            URL.revokeObjectURL(url);
        })
        return downloadSvgBtn;
    }

    async onunload() {
        console.log("onunload");
        this.cleanDarkModeClass();
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

    private initDarkTheme() {
        let html = document.documentElement;
        if (html.getAttribute('data-theme-mode') === "dark") {
            html.classList.add(darkModeClassName);
        } else {
            this.cleanDarkModeClass();
        }
    }

    private cleanDarkModeClass() {
        document.documentElement.classList.remove(darkModeClassName);
    }
}
