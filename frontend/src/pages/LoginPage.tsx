import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-eaw-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="eaw-card">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-eaw-primary text-white text-lg font-bold rounded-lg mb-3">
              IR
            </div>
            <h1 className="text-xl font-bold text-eaw-font">Incident Tracker Lite</h1>
            <p className="text-sm text-eaw-muted mt-1">Sign in to your account</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 text-sm rounded bg-red-50 text-red-700 border border-red-200">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-eaw-font mb-1">Username</label>
              <input
                type="text"
                className="input-field"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-eaw-font mb-1">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-eaw-muted">
            <p className="font-medium mb-1">Demo Credentials</p>
            <p>Username: <span className="font-mono">admin</span> / Password: <span className="font-mono">admin123</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
