import { useState, useEffect, useCallback } from 'react';
import { fetchCastList } from '../api';
import { User, Loader } from 'lucide-react';

export default function LoginScreen({ onLogin }) {
    const [input, setInput] = useState('');
    const [error, setError] = useState('');
    const [castList, setCastList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch cast list on mount
    useEffect(() => {
        const loadCast = async () => {
            setIsLoading(true);
            const data = await fetchCastList();
            setCastList(data);
            setIsLoading(false);
        };
        loadCast();
    }, []);

    const validateLogin = useCallback(() => {
        // Normalize input by removing leading zeros for comparison
        const normalizedInput = input.replace(/^0+/, '') || '0';
        console.log('Input:', input, '→ Normalized:', normalizedInput);
        console.log('Cast list sample:', castList.slice(0, 3).map(c => ({ id: c.id, normalized: String(c.id).replace(/^0+/, '') || '0' })));

        const user = castList.find(c => {
            const normalizedId = String(c.id).replace(/^0+/, '') || '0';
            return normalizedId === normalizedInput;
        });
        if (user) {
            console.log('Found user:', user);
            onLogin(user);
        } else {
            console.log('User not found');
            setError('該当する団員番号が見つかりません');
        }
    }, [input, onLogin, castList]);

    const handleKey = useCallback((key) => {
        if (key === 'C' || key === 'Backspace' || key === 'Delete') {
            setInput(prev => key === 'C' ? '' : prev.slice(0, -1));
            setError('');
        } else if (key === 'Enter') {
            validateLogin();
        } else {
            // Allow only numbers
            if (/^\d$/.test(key)) {
                setInput(prev => {
                    if (prev.length < 4) return prev + key;
                    return prev;
                });
                setError('');
            }
        }
    }, [validateLogin]);

    // Physical Keyboard Listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key;
            if (/^\d$/.test(key) || key === 'Enter' || key === 'Backspace' || key === 'Delete') {
                handleKey(key);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKey]);

    if (isLoading) {
        return (
            <div className="login-screen" style={{ justifyContent: 'center' }}>
                <Loader size={48} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>読み込み中...</p>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="login-screen">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                    background: '#eff6ff',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem'
                }}>
                    <User size={40} color="#3b82f6" />
                </div>
                <h1 style={{ fontSize: '1.5rem', margin: 0 }}>青い鳥 広告営業</h1>
                <p style={{ color: 'var(--text-muted)' }}>団員番号を入力してください</p>
                <div style={{ background: '#f0f9ff', padding: '0.5rem', borderRadius: '0.5rem', marginTop: '1rem', fontSize: '0.85rem', color: '#0369a1' }}>
                    {castList.length > 0
                        ? `登録団員: ${castList.length}名`
                        : 'オフラインモード（テスト用: 101, 102, 103）'
                    }
                </div>
            </div>

            <div style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                letterSpacing: '0.5rem',
                marginBottom: '0.5rem',
                minHeight: '3rem',
                borderBottom: '2px solid var(--primary)',
                width: '100%',
                textAlign: 'center'
            }}>
                {input}
            </div>

            {error && <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{error}</p>}

            <div className="keypad">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button key={num} className="key-btn" onClick={() => handleKey(num.toString())}>
                        {num}
                    </button>
                ))}
                <button className="key-btn" style={{ color: 'var(--danger)' }} onClick={() => handleKey('C')}>C</button>
                <button className="key-btn" onClick={() => handleKey('0')}>0</button>
                <button className="key-btn" style={{ background: 'var(--primary)', color: 'white' }} onClick={() => handleKey('Enter')}>GO</button>
            </div>
        </div>
    );
}
