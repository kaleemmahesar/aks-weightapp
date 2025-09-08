import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Error details:', errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div 
          className="d-flex align-items-center justify-content-center vh-100"
          style={{ 
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
          }}
        >
          <div 
            className="card shadow-lg p-4"
            style={{ 
              maxWidth: "600px",
              borderRadius: "20px",
              border: "none"
            }}
          >
            <div className="text-center mb-4">
              <div 
                className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                style={{
                  width: "80px",
                  height: "80px",
                  background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
                  color: "white"
                }}
              >
                <i className="fas fa-exclamation-triangle fa-2x"></i>
              </div>
              <h3 className="fw-bold text-danger">Something Went Wrong</h3>
              <p className="text-muted">
                The application encountered an unexpected error. Please refresh the page or contact support if the issue persists.
              </p>
            </div>
            
            <div className="d-flex justify-content-center gap-3">
              <button 
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                <i className="fas fa-redo me-2"></i>
                Refresh Page
              </button>
              <button 
                className="btn btn-outline-secondary"
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              >
                <i className="fas fa-arrow-left me-2"></i>
                Try Again
              </button>
            </div>
            
            {/* Debug information - only show in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-4">
                <details className="text-muted small">
                  <summary style={{ cursor: 'pointer' }}>
                    <strong>Error Details (Development Only)</strong>
                  </summary>
                  <div className="mt-2">
                    <strong>Error:</strong>
                    <pre className="bg-light p-2 rounded small">
                      {this.state.error.toString()}
                    </pre>
                    <strong>Component Stack:</strong>
                    <pre className="bg-light p-2 rounded small">
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
