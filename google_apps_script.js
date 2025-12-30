/**
 * Blue Bird Ad Sales Tracker - Google Apps Script
 * 
 * このスクリプトをスプレッドシートにコピペし、
 * 「デプロイ」→「ウェブアプリとしてデプロイ」してください。
 * 
 * スプレッドシートに必要なシート:
 * 1. 「団員リスト」 - 列: id, name
 * 2. 「訪問記録」 - 列: id, shopName, city, status, note, lat, lng, castName, timestamp
 */

// ==================== 設定 ====================
// 特に変更不要（シート名はそのまま使えます）

const CAST_SHEET_NAME = '団員リスト';
const VISITS_SHEET_NAME = '訪問記録';

// ==================== メイン処理 ====================

function doGet(e) {
    const action = e.parameter.action;

    let result;

    if (action === 'getCast') {
        result = getCastList();
    } else if (action === 'getVisits') {
        result = getVisits();
    } else if (action === 'convertToKanji') {
        // ひらがな→漢字変換（プロキシ）
        const text = e.parameter.text || '';
        result = convertHiraganaToKanji(text);
    } else if (action === 'searchPlaces') {
        // 場所検索（プロキシ）
        const query = e.parameter.q || '';
        const city = e.parameter.city || '';
        result = searchPlaces(query, city);
    } else {
        result = { error: 'Unknown action' };
    }

    return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
    const action = e.parameter.action;

    let result;

    if (action === 'addVisit') {
        const data = JSON.parse(e.postData.contents);
        result = addVisit(data);
    } else if (action === 'deleteVisit') {
        const data = JSON.parse(e.postData.contents);
        result = deleteVisit(data.id);
    } else {
        result = { error: 'Unknown action' };
    }

    return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
}

// ==================== 団員リスト ====================

function getCastList() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CAST_SHEET_NAME);
    if (!sheet) {
        return { error: 'Sheet not found: ' + CAST_SHEET_NAME };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const result = [];

    for (let i = 1; i < data.length; i++) {
        const row = {};
        for (let j = 0; j < headers.length; j++) {
            row[headers[j]] = data[i][j];
        }
        // IDを文字列に変換（アプリ側との互換性のため）
        row.id = String(row.id);
        result.push(row);
    }

    return result;
}

// ==================== 訪問記録 ====================

function getVisits() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(VISITS_SHEET_NAME);
    if (!sheet) {
        return { error: 'Sheet not found: ' + VISITS_SHEET_NAME };
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
        return []; // ヘッダーのみ
    }

    const headers = data[0];
    const result = [];

    for (let i = 1; i < data.length; i++) {
        const row = {};
        for (let j = 0; j < headers.length; j++) {
            row[headers[j]] = data[i][j];
        }
        result.push(row);
    }

    return result;
}

function addVisit(visitData) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(VISITS_SHEET_NAME);
    if (!sheet) {
        return { error: 'Sheet not found: ' + VISITS_SHEET_NAME };
    }

    // ヘッダー行を取得
    const lastCol = sheet.getLastColumn() || 9;
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

    // もしヘッダーがなければ作成
    if (headers.length === 0 || headers[0] === '') {
        const defaultHeaders = ['id', 'shopName', 'city', 'status', 'note', 'lat', 'lng', 'castName', 'timestamp'];
        sheet.getRange(1, 1, 1, defaultHeaders.length).setValues([defaultHeaders]);
        headers.length = 0;
        headers.push(...defaultHeaders);
    }

    // A列のデータを取得して、最初の空行を探す
    const lastRow = sheet.getLastRow();
    let targetRow = lastRow + 1; // デフォルトは最後の行の次

    if (lastRow >= 2) {
        const columnA = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let i = 0; i < columnA.length; i++) {
            if (columnA[i][0] === '' || columnA[i][0] === null || columnA[i][0] === undefined) {
                targetRow = i + 2; // 2-indexed (header is row 1)
                break;
            }
        }
    }

    // データ行を作成
    const newRow = headers.map(header => visitData[header] || '');
    sheet.getRange(targetRow, 1, 1, newRow.length).setValues([newRow]);

    return { success: true, id: visitData.id, row: targetRow };
}

function deleteVisit(id) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(VISITS_SHEET_NAME);
    if (!sheet) {
        return { error: 'Sheet not found: ' + VISITS_SHEET_NAME };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('id');

    if (idIndex === -1) {
        return { error: 'ID column not found' };
    }

    // IDが一致する行を探して削除
    for (let i = data.length - 1; i >= 1; i--) {
        if (String(data[i][idIndex]) === String(id)) {
            sheet.deleteRow(i + 1); // 1-indexed
            return { success: true };
        }
    }

    return { error: 'Visit not found' };
}
// ==================== 検索プロキシ ====================

// ひらがな→漢字変換（Google Transliterate API経由）
function convertHiraganaToKanji(text) {
    if (!text) return { converted: '' };

    try {
        const url = 'https://www.google.com/transliterate?langpair=ja-Hira|ja&text=' + encodeURIComponent(text);
        const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
        if (response.getResponseCode() !== 200) {
            return { converted: text, original: text };
        }
        const data = JSON.parse(response.getContentText());

        if (data && data.length > 0) {
            const converted = data.map(segment => segment[1][0] || segment[0]).join('');
            return { converted: converted, original: text };
        }
    } catch (e) {
        Logger.log('Conversion error: ' + e);
    }

    return { converted: text, original: text };
}

// 場所検索（Nominatim経由 + 電話番号対応）
function searchPlaces(query, city) {
    if (!query) return [];

    const results = [];

    // 電話番号パターンをチェック
    const isPhoneNumber = /^[\d\-]+$/.test(query.replace(/\s/g, ''));

    if (isPhoneNumber) {
        const phoneClean = query.replace(/[\s\-]/g, '');

        // 1. iタウンページで検索
        try {
            const url = 'https://itp.ne.jp/result/?kw=' + encodeURIComponent(phoneClean);
            const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

            if (response.getResponseCode() === 200) {
                const html = response.getContentText();
                let nameMatch = html.match(/<h2[^>]*class="[^"]*shop-name[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/);
                if (!nameMatch) {
                    nameMatch = html.match(/<h2[^>]*class="[^"]*shop-name[^"]*"[^>]*>([^<]+)<\/h2>/);
                }

                if (nameMatch) {
                    results.push({
                        name: nameMatch[1].trim(),
                        display_name: nameMatch[1].trim(),
                        lat: null,
                        lon: null,
                        source: 'iタウンページ'
                    });
                }
            }
        } catch (e) {
            Logger.log('iTownPage search error: ' + e);
        }

        // 2. Telnaviで検索 (iタウンページで見つからなかった場合)
        if (results.length === 0) {
            try {
                const url = 'https://telnavi.jp/phone/' + encodeURIComponent(phoneClean);
                const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

                if (response.getResponseCode() === 200) {
                    const html = response.getContentText();
                    const titleMatch = html.match(/<title>.*?【(.*?)】.*?<\/title>/);

                    if (titleMatch && titleMatch[1]) {
                        results.push({
                            name: titleMatch[1].trim(),
                            display_name: titleMatch[1].trim(),
                            lat: null,
                            lon: null,
                            source: 'Telnavi'
                        });
                    }
                }
            } catch (e) {
                Logger.log('Telnavi search error: ' + e);
            }
        }
    }

    // 通常のNominatim検索
    try {
        // ひらがなを漢字に変換
        let searchQuery = query;
        if (!isPhoneNumber && /[\u3041-\u3096]/.test(query)) {
            const converted = convertHiraganaToKanji(query);
            if (converted.converted && converted.converted !== query) {
                searchQuery = converted.converted;
            }
        }

        // 市町村名を追加して検索
        const fullQuery = city && city !== 'その他' && !isPhoneNumber ? searchQuery + ' ' + city : searchQuery;

        const nominatimUrl = 'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(fullQuery) +
            '&format=json&accept-language=ja&limit=10';

        const response = UrlFetchApp.fetch(nominatimUrl, {
            headers: { 'User-Agent': 'BlueBirdTracker/1.0' },
            muteHttpExceptions: true
        });

        if (response.getResponseCode() === 200) {
            const data = JSON.parse(response.getContentText());
            if (Array.isArray(data)) {
                data.forEach(item => {
                    results.push({
                        name: item.name || item.display_name.split(',')[0],
                        display_name: item.display_name,
                        lat: item.lat,
                        lon: item.lon,
                        source: 'OpenStreetMap'
                    });
                });
            }
        }
    } catch (e) {
        Logger.log('Nominatim search error: ' + e);
    }

    return results;
}

function testGetCast() {
    Logger.log(getCastList());
}

function testGetVisits() {
    Logger.log(getVisits());
}

function testSearch() {
    Logger.log(searchPlaces('ぶんかのいえ', '長久手市'));
}
