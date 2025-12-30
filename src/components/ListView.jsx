import { ArrowLeft, Trash2, MapPin, RefreshCw } from 'lucide-react';

export default function ListView({ visits, onDelete, onBack, onRefresh, isLoading }) {
    const getStatusColor = (status) => {
        switch (status) {
            case '契約': return 'var(--success)';
            case 'NG': return 'var(--danger)';
            case '不在': return 'var(--text-muted)';
            default: return 'var(--primary)';
        }
    };

    // Format date safely
    const formatDate = (timestamp) => {
        if (!timestamp) return '日付不明';
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return '日付不明';
        if (isNaN(date.getTime())) return '日付不明';
        return date.toLocaleDateString('ja-JP');
    };

    const getTimestamp = (visit) => {
        // Debug: Check keys if timestamp is missing
        if (!visit.timestamp && !visit.Timestamp) {
            console.log('Missing timestamp for:', visit);
        }
        return visit.timestamp || visit.Timestamp || visit.timestam || visit.date;
    };

    // Sanitize city name - filter out invalid values
    const sanitizeCity = (cityValue) => {
        // Check if it looks like a valid city name (not a timestamp, not empty)
        if (!cityValue) return 'その他';
        if (typeof cityValue !== 'string') return 'その他';
        // If it looks like an ISO date string, it's wrong data
        if (cityValue.includes('T') && cityValue.includes(':')) return 'その他';
        return cityValue;
    };

    // Group visits by city with sanitization
    const groupedVisits = (visits || []).reduce((acc, visit) => {
        if (!visit || !visit.id) return acc; // Skip invalid records
        const cityName = sanitizeCity(visit.city);
        if (!acc[cityName]) {
            acc[cityName] = [];
        }
        acc[cityName].push(visit);
        return acc;
    }, {});

    // Sort cities alphabetically, but put "その他" at the end
    const sortedCities = Object.keys(groupedVisits).sort((a, b) => {
        if (a === 'その他') return 1;
        if (b === 'その他') return -1;
        return a.localeCompare(b, 'ja');
    });

    return (
        <div style={{ padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="btn-icon" style={{ width: '2.5rem', height: '2.5rem', boxShadow: 'none', background: 'transparent' }} onClick={onBack}>
                        <ArrowLeft />
                    </button>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>訪問リスト ({visits.length}件)</h2>
                </div>

                <button
                    className="btn-icon"
                    style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        boxShadow: 'none',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)'
                    }}
                    onClick={onRefresh}
                    disabled={isLoading}
                >
                    <RefreshCw className={isLoading ? 'spin' : ''} size={20} />
                </button>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {visits.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
                        まだ記録がありません
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {sortedCities.map(cityName => (
                            <div key={cityName}>
                                {/* City Header */}
                                <div style={{
                                    background: 'var(--primary)',
                                    color: 'white',
                                    padding: '0.5rem 1rem',
                                    borderRadius: 'var(--radius)',
                                    marginBottom: '0.5rem',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <MapPin size={16} />
                                    {cityName} ({groupedVisits[cityName].length})
                                </div>

                                {/* Visits in this city */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {groupedVisits[cityName].map(visit => (
                                        <div key={visit.id} style={{
                                            background: 'var(--surface)',
                                            padding: '0.75rem',
                                            borderRadius: 'var(--radius)',
                                            border: '1px solid var(--border)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            marginLeft: '0.5rem'
                                        }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{visit.shopname || visit.shopName || '名称未設定'}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                    <span style={{
                                                        background: getStatusColor(visit.status),
                                                        color: 'white',
                                                        padding: '0.1rem 0.4rem',
                                                        borderRadius: '0.25rem',
                                                        fontSize: '0.75rem'
                                                    }}>
                                                        {visit.status}
                                                    </span>
                                                    <span style={{ color: 'var(--text-muted)' }}>{formatDate(getTimestamp(visit))}</span>
                                                    <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{visit.castname || visit.castName || visit.castName}</span>
                                                </div>
                                                {visit.note && (
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                                        {visit.note}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (confirm(`「${visit.shopname || visit.shopName || '名称未設定'}」の記録を削除しますか？`)) {
                                                        onDelete(visit.id);
                                                    }
                                                }}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'var(--text-muted)',
                                                    padding: '0.25rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
