/**
 * Blue Bird Ad Sales Tracker - Configuration
 * 
 * ここにGoogle Apps ScriptのウェブアプリURLを設定してください。
 * 例: https://script.google.com/macros/s/XXXXXXX/exec
 */

// ==================== 設定 ====================

// TODO: ここにあなたのApps Script URLを貼り付けてください
export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxkc3dMyDS1cIRnp2b_0hsdvqSTcAaeSkvdPNN9b8ON6YssFKGMTz3JFyZsazsLtbQ/exec';

// ==================== ヘルパー ====================

export const isConfigured = () => {
    return APPS_SCRIPT_URL && APPS_SCRIPT_URL.length > 0;
};
