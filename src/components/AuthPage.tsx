import { useState } from 'react';
import { LogIn, UserPlus, Lock, Mail, User, AlertCircle, Loader2 } from 'lucide-react';
import { signIn, signUp } from '../lib/authService';

export interface AuthSuccessPayload {
  id: string;
  name: string;
  email: string;
}

interface AuthPageProps {
  onAuthSuccess: (user: AuthSuccessPayload) => void;
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let user: AuthSuccessPayload;
      if (isLogin) {
        user = await signIn(email, password);
      } else {
        user = await signUp(name, email, password);
      }
      onAuthSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-main)',
      backgroundImage: 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15), transparent 50%), radial-gradient(ellipse at bottom, rgba(236, 72, 153, 0.15), transparent 50%)',
      padding: '2rem'
    }}>
      <div className="glass-card animate-fade-in" style={{ 
        maxWidth: '420px', 
        width: '100%', 
        padding: '3rem 2.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(236, 72, 153, 0.2))',
            border: '1px solid rgba(255,255,255,0.1)',
            marginBottom: '1.25rem'
          }}>
            {isLogin ? <LogIn size={28} className="text-info" /> : <UserPlus size={28} className="text-info" />}
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: '#fff', letterSpacing: '-0.5px' }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {isLogin ? 'Sign in to access your leave dashboard' : 'Join us and start tracking your leaves'}
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '0.875rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {!isLogin && (
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                style={{ paddingLeft: '2.75rem', height: '3rem', fontSize: '1rem' }}
                className="form-control"
              />
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              style={{ paddingLeft: '2.75rem', height: '3rem', fontSize: '1rem' }}
              className="form-control"
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              style={{ paddingLeft: '2.75rem', height: '3rem', fontSize: '1rem' }}
              className="form-control"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ 
              marginTop: '1rem', 
              height: '3rem', 
              fontSize: '1rem', 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #6366f1, #ec4899)',
              border: 'none',
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
            }}
          >
            {loading ? (
              <Loader2 size={20} className="spin-icon" />
            ) : isLogin ? (
              'Sign In'
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
          </span>
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
              textDecoration: 'underline',
              textDecorationColor: 'rgba(255,255,255,0.3)',
              textUnderlineOffset: '4px'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#ec4899'}
            onMouseOut={(e) => e.currentTarget.style.color = '#fff'}
          >
            {isLogin ? "Create one" : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
