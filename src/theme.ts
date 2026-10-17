import { DARK_MODE_CLASS } from "./constants";

/**
 * 根据当前主题在 <html> 上切换 markmap 的暗色标记。
 */
export function applyDarkTheme() {
    if (document.documentElement.getAttribute("data-theme-mode") === "dark") {
        document.documentElement.classList.add(DARK_MODE_CLASS);
    } else {
        clearDarkTheme();
    }
}

export function clearDarkTheme() {
    document.documentElement.classList.remove(DARK_MODE_CLASS);
}
