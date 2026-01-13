import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-3 bg-blue-600 rounded-xl">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">GovtWeb</h1>
            <p className="text-sm text-slate-500">Admin Portal</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-200 
                focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-200 
                focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg
              hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed transition-all
              flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-8 p-4 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-500 text-center mb-2">Demo Credentials</p>
          <p className="text-sm text-slate-600 text-center">
            <span className="font-medium">Admin:</span> admin@example.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
