import { adaptHotkey } from "siyuan";

import { DOCK_TYPE, ICON_NAME } from "./constants";
import { MarkmapRender } from "./markmap-render";
import type SiYuanMarkmapViewPlugin from "./index";

/**
 * 注册 markmap 的停靠栏面板（含刷新按钮）。
 */
export function registerMarkmapDock(plugin: SiYuanMarkmapViewPlugin) {
    const render = new MarkmapRender({ plugin });

    plugin.addDock({
        config: {
            position: "RightTop",
            size: { width: 400, height: 0 },
            icon: ICON_NAME,
            title: plugin.typedI18n.actionName,
        },
        data: {},
        type: DOCK_TYPE,
        resize() {
            // console.log(DOCK_TYPE + " resize");
        },
        update() {
            // console.log(DOCK_TYPE + " update");
        },
        init: (dock) => {
            dock.element.innerHTML = `<div class="fn__flex-1 fn__flex-column">
                    <div class="block__icons">
                        <div class="block__logo">
                            <svg class="block__logoicon"><use xlink:href="#${ICON_NAME}"></use></svg>
                            ${plugin.typedI18n.actionName}
                        </div>

                        <span class="fn__flex-1 fn__space"></span>
                        <span data-type="refresh" class="refresh_btn block__icon block__icon--show b3-tooltips b3-tooltips__sw" aria-label="${plugin.typedI18n.syncMdContent}">
                            <svg class=""><use xlink:href="#iconRefresh"></use></svg>
                        </span>
                        <span data-type="min" class="block__icon block__icon--show b3-tooltips b3-tooltips__sw" aria-label="Min ${adaptHotkey("⌘W")}">
                            <svg class="block__logoicon"><use xlink:href="#iconMin"></use></svg>
                        </span>
                    </div>
                    <div class="fn__flex-1 fn__flex-column markmap-view-container">
                        <svg class="markmap-view-svg fn__flex-1" />
                    </div>
                    </div>`;

            render.contextElement = dock.element as HTMLElement;
            const refreshBtn = dock.element.getElementsByClassName("refresh_btn")[0] as HTMLElement;
            refreshBtn.onclick = async () => {
                await render.init();
                await render.renderMarkmap();
            };
            setTimeout(refreshBtn.onclick, 1000);
        },
        destroy() {
            render.mm?.destroy();
        },
    });
}
