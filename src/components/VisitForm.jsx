import { useState, useEffect } from 'react';
import { X, MapPin, Search, AlertTriangle, Loader } from 'lucide-react';

export default function VisitForm({ isOpen, onClose, onSave, currentUser, initialLocation, onFlyTo, visits = [] }) {
    const [shopName, setShopName] = useState('');
    const [status, setStatus] = useState('契約');
    const [note, setNote] = useState('');
    const [city, setCity] = useState('長久手市');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [activeLocation, setActiveLocation] = useState(initialLocation);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [duplicateVisit, setDuplicateVisit] = useState(null);
    const [manualMode, setManualMode] = useState(false);

    // Predefined cities for the dropdown with coordinates
    const cityData = {
        '長久手市': { lat: 35.1833, lng: 137.0500 },
        '名古屋市': { lat: 35.1815, lng: 136.9066 },
        '日進市': { lat: 35.1328, lng: 137.0392 },
        '尾張旭市': { lat: 35.2167, lng: 137.0333 },
        '瀬戸市': { lat: 35.2236, lng: 137.0836 },
        '豊田市': { lat: 35.0833, lng: 137.1500 },
        'その他': { lat: 35.1833, lng: 137.0500 } // Default to 長久手
    };
    const cities = Object.keys(cityData);

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setShopName('');
            setStatus('契約');
            setNote('');
            setCity('長久手市');
            setSearchResults([]);
            setActiveLocation(initialLocation);
            setSelectedAddress('');
            setDuplicateVisit(null);
            setManualMode(false);
        }
    }, [isOpen, initialLocation]);

    // Duplicate Check Effect - checks both name AND address/location
    useEffect(() => {
        if (!shopName || shopName.length < 2) {
            setDuplicateVisit(null);
            return;
        }

        // Improved normalization: handles full-width/half-width and spaces
        const normalize = (str) => {
            return String(str || '')
                .replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
                    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
                })
                .toLowerCase()
                .replace(/[\s\u3000]/g, ''); // Remove spaces (including full-width)
        };

        const targetName = normalize(shopName);
        const targetAddress = normalize(selectedAddress);

        // Find duplicate: same name AND (same address OR same location)
        const found = visits.find(v => {
            const vName = normalize(v.shopname || v.shopName);

            // Name must match first
            if (vName !== targetName) return false;

            // Check location coordinates if both exist
            if (activeLocation && v.lat && v.lng) {
                const latDiff = Math.abs(parseFloat(v.lat) - parseFloat(activeLocation.lat));
                const lngDiff = Math.abs(parseFloat(v.lng) - parseFloat(activeLocation.lng));
                // If more than ~100m away (roughly 0.001 degrees), definitely NOT a duplicate
                if (latDiff > 0.001 || lngDiff > 0.001) {
                    return false; // Different location = different store
                }
                // If within 100m, it's the same location = duplicate
                return true;
            }

            // If no coordinate data, check address from notes
            if (selectedAddress && selectedAddress.length > 5 && (v.note || v.notes)) {
                const vNote = String(v.note || v.notes || '');
                const addressMatch = vNote.match(/\(住所:\s*([^)]+)\)/);
                if (addressMatch) {
                    const vAddress = normalize(addressMatch[1]);
                    // If addresses match, it's a duplicate
                    if (vAddress === targetAddress) {
                        return true;
                    }
                    // If addresses are clearly different, NOT a duplicate
                    return false;
                }
            }

            // If we can't determine location/address difference, be conservative
            // Only flag as duplicate if user hasn't selected any location yet
            return !selectedAddress && !activeLocation;
        });

        setDuplicateVisit(found || null);
    }, [shopName, selectedAddress, activeLocation, visits]);

    // Debounced Search Effect
    useEffect(() => {
        if (manualMode) return; // Skip search in manual mode

        if (!shopName || shopName.length < 1) {
            if (!shopName) setSearchResults([]);
            setIsSearching(false);
            return;
        }

        // Show searching state IMMEDIATELY while typing/waiting
        setIsSearching(true);

        const timer = setTimeout(async () => {
            try {
                // Use Apps Script proxy for search (handles hiragana→kanji and phone number)
                const { APPS_SCRIPT_URL, isConfigured } = await import('../config');

                if (isConfigured()) {
                    // Use Apps Script proxy
                    try {
                        const url = `${APPS_SCRIPT_URL}?action=searchPlaces&q=${encodeURIComponent(shopName)}&city=${encodeURIComponent(city)}`;
                        const res = await fetch(url);
                        const data = await res.json();

                        if (data && data.length > 0 && !data.error) {
                            setSearchResults(data);
                            return; // Success, skip fallback
                        }
                    } catch (proxyError) {
                        console.warn("Proxy search failed, falling back to direct search", proxyError);
                    }
                }

                // Fallback to direct Nominatim search (Client-side)
                // This runs if:
                // 1. Not configured
                // 2. Proxy search returned no results
                // 3. Proxy search failed
                const cityCoords = cityData[city] || cityData['長久手市'];
                const searchQuery = city !== 'その他' && city ? `${shopName} ${city}` : shopName;
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&accept-language=ja&limit=10`);
                const data = await res.json();
                setSearchResults(data.map(item => ({
                    name: item.name || item.display_name.split(',')[0],
                    display_name: item.display_name,
                    lat: item.lat,
                    lon: item.lon
                })));
            } catch (e) {
                console.error("Search failed", e);
            } finally {
                setIsSearching(false);
            }
        }, 600);

        return () => clearTimeout(timer);
    }, [shopName, city]);

    const handleResultClick = (item) => {
        setShopName(item.name || item.display_name.split(',')[0]);
        // Strip the country name for cleaner display
        const cleanAddress = (item.display_name || '').replace(', 日本', '').replace(', Japan', '');
        setSelectedAddress(cleanAddress);
        setSearchResults([]);

        const newLoc = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
        setActiveLocation(newLoc);
        if (onFlyTo) {
            onFlyTo(newLoc);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            // Send BOTH lowercase and camelCase to match whatever headers are in the sheet
            shopname: shopName || '名称未設定',
            shopName: shopName || '名称未設定',
            status,
            note: (note ? note + '\n' : '') + (selectedAddress ? `(住所: ${selectedAddress})` : ''), // Append address to note
            city,
            castname: currentUser.name || currentUser.id,
            castName: currentUser.name || currentUser.id,
            lat: activeLocation ? parseFloat(activeLocation.lat) : 0,
            lng: activeLocation ? parseFloat(activeLocation.lng) : 0
        });
        onClose();
    };

    return (
        <div className={`bottom-sheet ${!isOpen ? 'hidden' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>訪問記録</h2>
                <button className="btn-icon" style={{ width: '2rem', height: '2rem', boxShadow: 'none', background: 'transparent' }} onClick={onClose}>
                    <X />
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Location Display */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    <MapPin size={16} />
                    <span>{activeLocation ? `${activeLocation.lat.toFixed(5)}, ${activeLocation.lng.toFixed(5)}周辺` : '位置情報なし'}</span>
                </div>

                {/* Shop Name with Search */}
                <div className="form-group" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                        <label className="form-label">店名・場所名</label>
                        <span style={{ fontSize: '0.7rem', color: '#ccc' }}>照合データ: {visits.length}件</span>
                    </div>

                    {/* Duplicate Warning Alert */}
                    {duplicateVisit && (
                        <div style={{
                            background: '#fff3cd',
                            color: '#856404',
                            padding: '0.75rem',
                            borderRadius: '0.25rem',
                            border: '1px solid #ffeeba',
                            marginBottom: '0.5rem',
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'start',
                            fontSize: '0.9rem'
                        }}>
                            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                                <strong>訪問済みです</strong><br />
                                担当: {duplicateVisit.castname || duplicateVisit.castName}<br />
                                日付: {duplicateVisit.timestamp || duplicateVisit.timestam || duplicateVisit.Timestamp || '不明'}<br />
                                <span style={{ fontSize: '0.8rem' }}>状況: {duplicateVisit.status}</span>
                            </div>
                        </div>
                    )}

                    {/* Input Container */}
                    <div style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <button
                                type="button"
                                className="btn-sm"
                                style={{
                                    flex: 1,
                                    padding: '0.6rem',
                                    borderRadius: '0.25rem',
                                    border: '1px solid var(--primary)',
                                    background: manualMode ? 'var(--primary)' : 'var(--surface)',
                                    color: manualMode ? 'white' : 'var(--primary)',
                                    fontWeight: 'bold',
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => {
                                    setSearchResults([]);
                                    setManualMode(!manualMode);
                                    document.getElementById('shop-name-input').focus();
                                }}
                            >
                                {manualMode ? '✓ 手入力モード (検索OFF)' : '＋ 新規登録 (手入力)'}
                            </button>
                        </div>

                        {/* Wrapper for Input and Loader to ensure correct positioning */}
                        <div style={{ position: 'relative' }}>
                            <input
                                id="shop-name-input"
                                type="text"
                                className="form-input"
                                placeholder="例: 長久手 セブン"
                                value={shopName}
                                onChange={(e) => {
                                    setShopName(e.target.value);
                                    if (!manualMode && e.target.value.length > 0) {
                                        setIsSearching(true);
                                    }
                                }}
                                required
                            />
                            <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 10 }}>
                                {isSearching ? (
                                    <Loader className="spin" size={18} style={{ color: 'var(--primary)' }} />
                                ) : (
                                    <Search size={18} />
                                )}
                                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
                            </div>
                        </div>

                        {/* Search Status Message - More Prominent */}
                        {isSearching && shopName && !manualMode && (
                            <div style={{
                                marginTop: '0.5rem',
                                padding: '0.5rem',
                                background: 'rgba(59, 130, 246, 0.1)',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: 'var(--primary)',
                                fontSize: '0.85rem'
                            }}>
                                <Loader className="spin" size={16} />
                                <span>候補を検索しています...</span>
                            </div>
                        )}
                    </div>

                    {/* Selected Address Display */}
                    {selectedAddress && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.25rem', paddingLeft: '0.25rem' }}>
                            📍 {selectedAddress}
                        </div>
                    )}

                    {/* Search Results Dropdown */}
                    {(searchResults.length > 0 || (shopName && !isSearching)) && (
                        <ul style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: 'white',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            listStyle: 'none',
                            padding: 0,
                            margin: '0.5rem 0 0',
                            zIndex: 10,
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}>
                            {searchResults.map((item, idx) => (
                                <li key={idx}
                                    onClick={() => handleResultClick(item)}
                                    style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: idx < searchResults.length - 1 ? '1px solid var(--border)' : 'none' }}
                                >
                                    <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.display_name}</div>
                                </li>
                            ))}

                            {/* Fallback Option */}
                            {shopName && !isSearching && (
                                <li
                                    onClick={() => setSearchResults([])}
                                    style={{ padding: '0.75rem', cursor: 'pointer', borderTop: searchResults.length > 0 ? '1px solid var(--border)' : 'none', background: '#f8f9fa' }}
                                >
                                    <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>＋ 「{shopName}」を新規登録</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>マップの現在位置で登録します</div>
                                </li>
                            )}
                        </ul>
                    )}
                </div>

                {/* City Selection */}
                <div className="form-group">
                    <label className="form-label">市町村</label>
                    <select
                        className="form-input"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                    >
                        {cities.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                {/* Status Selection */}
                <div className="form-group">
                    <label className="form-label">結果</label>
                    <div className="status-grid">
                        {['契約', 'パンフのみ', '不在', 'NG'].map(s => (
                            <div
                                key={s}
                                className={`status-btn ${status === s ? 'selected' : ''}`}
                                onClick={() => setStatus(s)}
                            >
                                {s}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Note */}
                <div className="form-group">
                    <label className="form-label">メモ (任意)</label>
                    <textarea
                        className="form-textarea"
                        rows="3"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    ></textarea>
                </div>

                {/* Cast Name */}
                <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                    記録者: {currentUser?.name}
                </div>

                <button
                    type="submit"
                    className="btn-primary"
                    style={{ opacity: duplicateVisit ? 0.5 : 1, cursor: duplicateVisit ? 'not-allowed' : 'pointer' }}
                    disabled={!!duplicateVisit}
                >
                    {duplicateVisit ? '重複のため登録不可' : '保存する'}
                </button>
            </form>
        </div>
    );
}
