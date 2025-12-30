/**
 * Blue Bird Ad Sales Tracker - Sheets API Helper
 */

import { APPS_SCRIPT_URL, isConfigured } from './config';

// ==================== 団員リスト ====================

export async function fetchCastList() {
    if (!isConfigured()) {
        console.warn('Apps Script URL not configured, using mock data');
        // Fallback to mock data
        const mockData = await import('./data/mock_cast.json');
        return mockData.default;
    }

    try {
        const res = await fetch(`${APPS_SCRIPT_URL}?action=getCast`);
        const data = await res.json();

        if (data.error) {
            console.error('API Error:', data.error);
            return [];
        }

        return data;
    } catch (e) {
        console.error('Failed to fetch cast list:', e);
        return [];
    }
}

// ==================== 訪問記録 ====================

// Only load from localStorage - spreadsheet is write-only
export async function fetchVisits() {
    if (!isConfigured()) {
        console.warn('Apps Script URL not configured, using local storage');
        const saved = localStorage.getItem('blue-bird-visits');
        return saved ? JSON.parse(saved) : [];
    }

    try {
        const res = await fetch(`${APPS_SCRIPT_URL}?action=getVisits`);
        const data = await res.json();

        if (data.error) {
            console.error('API Error:', data.error);
            // Fallback to local
            const saved = localStorage.getItem('blue-bird-visits');
            return saved ? JSON.parse(saved) : [];
        }

        // Filter out empty or invalid rows
        return data.filter(item => {
            const hasId = item && item.id && String(item.id).trim() !== '';
            // Status MUST be one of the valid options
            const validStatus = ['契約', 'パンフのみ', '不在', 'NG'].includes(item.status);

            // Should potentially also check shopName, but status is the strongest indicator of app-generated data
            return hasId && validStatus;
        });
    } catch (e) {
        console.error('Failed to fetch visits:', e);
        // Fallback to local
        const saved = localStorage.getItem('blue-bird-visits');
        return saved ? JSON.parse(saved) : [];
    }
}

export async function saveVisit(visitData) {
    if (!isConfigured()) {
        console.warn('Apps Script URL not configured, saving to localStorage only');
        return { success: true, local: true };
    }

    try {
        // Use text/plain to avoid CORS preflight (OPTIONS) request which GAS doesn't handle
        const res = await fetch(`${APPS_SCRIPT_URL}?action=addVisit`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(visitData)
        });
        const data = await res.json();
        return data;
    } catch (e) {
        console.error('Failed to save visit:', e);
        return { error: e.message };
    }
}

export async function deleteVisitFromSheet(id) {
    if (!isConfigured()) {
        console.warn('Apps Script URL not configured');
        return { success: true, local: true };
    }

    try {
        const res = await fetch(`${APPS_SCRIPT_URL}?action=deleteVisit`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ id })
        });
        const data = await res.json();
        return data;
    } catch (e) {
        console.error('Failed to delete visit:', e);
        return { error: e.message };
    }
}
