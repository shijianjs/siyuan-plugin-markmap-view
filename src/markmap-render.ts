import { IProtyle } from "siyuan";
import { deriveOptions, Markmap } from "markmap-view";
import { Toolbar } from "markmap-toolbar";
import { Transformer } from "markmap-lib";

import { client } from "@/client";
import { SettingUtils } from "@/libs/setting-utils";
import { removeUntilFirstH1, truncateAtFootnote1 } from "@/SiyuanUtils";

import {
    COLOR_FREEZE_LEVEL,
    DURATION,
    INITIAL_EXPAND_LEVEL,
    MARKDOWN_SOURCE_MODE,
    MarkdownSourceMode,
    PAN,
    SPACING_HORIZONTAL,
    SPACING_VERTICAL,
    ZOOM,
} from "./constants";
import { applyDarkTheme } from "./theme";
import type SiYuanMarkmapViewPlugin from "./index";

const transformer = new Transformer();

/**
 * 负责抓取当前文档的 markdown、转换并渲染 markmap。
 */
export class MarkmapRender {
    plugin: SiYuanMarkmapViewPlugin;
    settingUtils: SettingUtils;

    contextElement: HTMLElement;

    protyle: IProtyle;
    docId: string;
    markdown: string;
    title: string;

    mm: Markmap;

    constructor(props?: Partial<MarkmapRender>) {
        Object.assign(this, props);
    }

    async init() {
        applyDarkTheme();
        this.settingUtils = this.plugin.settingUtils;

        let protyle: IProtyle = this.plugin.getEditor().protyle;
        this.protyle = protyle;
        const docId = protyle.block.rootID;
        this.docId = docId;
        const docInfoResp = await client.getDocInfo({ id: docId });
        this.title = docInfoResp.data.name;

        let mode = this.settingUtils.get(MARKDOWN_SOURCE_MODE);
        let markdown: string;
        if (mode === MarkdownSourceMode.getDoc) {
            const docResp = await client.getDoc({ id: docId });
            let docHtmlContent = docResp.data.content;
            markdown = protyle.lute.BlockDOM2StdMd(docHtmlContent);
        } else {
            const mdResp = await client.exportMdContent({ id: docId });
            markdown = truncateAtFootnote1(mdResp.data.content);
            markdown = removeUntilFirstH1(markdown);
        }
        this.markdown = markdown;
    }

    async renderMarkmap() {
        const containerDiv: HTMLElement = this.contextElement.querySelector(".markmap-view-container");
        const markmapSvg = this.contextElement.querySelector(".markmap-view-svg");
        // 重新渲染前先销毁旧实例并清空 svg，否则 markmap 节点会不断累积
        this.mm?.destroy();
        this.mm = undefined;
        markmapSvg.innerHTML = "";
        let transformResult = transformer.transform(this.markdown);
        const mm: Markmap = Markmap.create(markmapSvg, deriveOptions({
            colorFreezeLevel: this.settingUtils.get(COLOR_FREEZE_LEVEL),
            duration: this.settingUtils.get(DURATION),
            maxWidth: this.plugin.maxWidth,
            initialExpandLevel: this.settingUtils.get(INITIAL_EXPAND_LEVEL),
            zoom: this.settingUtils.get(ZOOM),
            pan: this.settingUtils.get(PAN),
            spacingHorizontal: this.settingUtils.get(SPACING_HORIZONTAL),
            spacingVertical: this.settingUtils.get(SPACING_VERTICAL),
        }));
        transformResult.root.content = this.title;
        await mm.setData(transformResult.root, deriveOptions(transformResult.frontmatter?.markmap ?? {}));
        await mm.fit();
        let toolbar = Toolbar.create(mm);
        for (let elementsByClassNameElement of containerDiv.getElementsByClassName("mm-toolbar")) {
            elementsByClassNameElement.remove();
        }
        containerDiv.append(toolbar.el);
        toolbar.el.appendChild(this.createDownloadBtn(mm, this.title));
        this.mm = mm;
        return mm;
    }

    private createDownloadBtn(mm: Markmap, title: string) {
        let downloadSvgBtn = document.createElement("div");
        downloadSvgBtn.title = this.plugin.typedI18n.exportSvgImage;
        downloadSvgBtn.innerHTML = "🖼️";
        downloadSvgBtn.classList.add("mm-toolbar-item");
        downloadSvgBtn.addEventListener("click", () => {
            let svg = new XMLSerializer().serializeToString(mm.svg.node());
            let blob = new Blob([svg], { type: "image/svg+xml" });
            let url = URL.createObjectURL(blob);
            let a = document.createElement("a");
            a.href = url;
            a.download = title + ".markmap.svg";
            a.click();
            URL.revokeObjectURL(url);
        });
        return downloadSvgBtn;
    }
}
