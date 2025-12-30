import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <h2>エラーが発生しました。</h2>
                    <details style={{ whiteSpace: 'pre-wrap', textAlign: 'left', background: '#f8d7da', padding: '1rem', borderRadius: '4px', marginTop: '1rem' }}>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                        ページを再読み込み
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
