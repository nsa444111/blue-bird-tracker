import { Map, List, LogOut } from 'lucide-react';

export default function MainMenu({ onNavigate, onLogout, currentUser }) {
    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '2rem', background: 'var(--bg)' }}>
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>青い鳥 広告営業</h1>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>ようこそ、{currentUser?.name || `ID: ${currentUser?.id}`} さん</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                <button
                    className="btn-primary"
                    style={{ height: '8rem', fontSize: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    onClick={() => onNavigate('map')}
                >
                    <Map size={32} />
                    地図で登録
                </button>

                <button
                    className="btn-primary"
                    style={{ height: '6rem', fontSize: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
                    onClick={() => onNavigate('list')}
                >
                    <List size={28} />
                    リスト一覧
                </button>
            </div>

            <button
                style={{
                    marginTop: 'auto',
                    padding: '1rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer'
                }}
                onClick={onLogout}
            >
                <LogOut size={20} />
                ログアウト
            </button>
        </div>
    );
}
