/**
 * 代码参考来源：
 *
 * - 作者：wilsons
 * - 链接：https://pipe.b3log.org/blogs/wilsons/%E6%80%9D%E6%BA%90/%E6%8F%92%E4%BB%B6%E5%BC%80%E5%8F%91/%E8%8E%B7%E5%8F%96%E5%BD%93%E5%89%8D%E6%96%87%E6%A1%A3%E5%AF%B9%E8%B1%A1
 * - 来源：Pipe
 * - 著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。
 */
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
