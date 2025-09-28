
export function getProtyle() {
    try {
        if(document.getElementById("sidebar")) return window.siyuan.mobile.editor.protyle;
        const currDoc = window.siyuan?.layout?.centerLayout?.children.map(item=>item.children.find(item=>item.headElement?.classList.contains('item--focus') && (item.panelElement.closest('.layout__wnd--active')||item.panelElement.closest('[data-type="wnd"]')))).find(item=>item);
        return currDoc?.model.editor.protyle;
    } catch(e) {
        console.error(e);
        return null;
    }
}
