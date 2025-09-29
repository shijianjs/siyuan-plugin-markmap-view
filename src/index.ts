import {
    Plugin,
    showMessage,
    Dialog,
    getAllEditor
} from "siyuan";
import {Markmap} from 'markmap-view';
import {Toolbar} from 'markmap-toolbar';
import {Transformer} from 'markmap-lib';

import "./index.scss";

import {client} from "@/client";
import {getProtyle} from "@/SiyuanUtils";

const transformer = new Transformer();

const ICON_NAME = "icon-park-outline--mindmap-map";

export default class SiYuanMarkmapViewPlugin extends Plugin {

    async onload() {
        // 图标的制作参见帮助文档
        this.addIcons(`
            <symbol id="icon-park-outline--mindmap-map" viewBox="0 0 48 48"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M26 24h16M26 38h16M26 10h16M18 24H6h4m8 14c-6-2-2-14-8-14m8-14c-6 2-2 14-8 14"/></symbol>
            `);
    }

    onLayoutReady() {
        console.log("Markmap 插件已加载");
        this.addTopBar({
            icon: ICON_NAME,                    // 按钮图标
            title: "Markmap思维导图",         // 提示文字
            position: "right",             // 可选：left / right
            callback: async () => {

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
                let markdown = `
# ${title?.trim() ?? ''}

${mdContent}
`;
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
                const containerDiv = dialog.element.querySelector(".markmap-view-container");
                const markmapSvg = dialog.element.querySelector(".markmap-view-svg");
                const {root} = transformer.transform(markdown);
                const mm = Markmap.create(markmapSvg);
                await mm.setData(root);
                await mm.fit();
                let toolbar = Toolbar.create(mm);
                containerDiv.append(toolbar.el);
            },
        });
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
