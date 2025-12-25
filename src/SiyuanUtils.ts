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

/**
 * 截取脚注
 */
export function truncateAtFootnote1(content: string): string {
    const regex = /^[ \t]*\[\^1\]:[\s\S]*$/m;
    return content.replace(regex, '');
}

/**
 * 移除 markdown 内容中第一个一级标题及之前的所有内容
 * @param markdownContent - 完整的 markdown 内容
 * @returns 移除头部后的内容，从第一个一级标题之后开始
 */
export function removeUntilFirstH1(markdownContent: string): string {
    const lines = markdownContent.split('\n');
    let firstH1Index = -1;

    // 查找第一个一级标题
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('# ')) {
            firstH1Index = i;
            break;
        }
    }

    // 如果没有找到一级标题，返回空字符串
    if (firstH1Index === -1) {
        return '';
    }

    // 返回从第一个一级标题之后的内容
    return lines.slice(firstH1Index + 1).join('\n').trimStart();
}
