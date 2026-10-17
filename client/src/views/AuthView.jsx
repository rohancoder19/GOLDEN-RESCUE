import React, { useState } from 'react';
import { api } from '../services/api';
import { playTelemetryChirp, playAlertSiren } from '../services/audio';

export default function AuthView({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const switchMode = (newMode) => {
    playTelemetryChirp();
    setMode(newMode);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.login({ email: email.trim(), password });
      playTelemetryChirp();
      if (onAuthSuccess) {
        onAuthSuccess(res.user);
      }
    } catch (err) {
      playAlertSiren();
      setErrorMessage(err.message || 'Invalid email address or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter a secure password.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both password fields.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.register({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });
      playTelemetryChirp();
      setSuccessMessage('Account created successfully! Launching operational terminal...');
      setTimeout(() => {
        if (onAuthSuccess) {
          onAuthSuccess(res.user);
        }
      }, 600);
    } catch (err) {
      playAlertSiren();
      setErrorMessage(err.message || 'Registration failed. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (role) => {
    playTelemetryChirp();
    if (role === 'admin') {
      setEmail('admin@goldenrescue.org');
      setPassword('GoldenAdmin2026!');
    } else {
      setEmail('dispatcher@goldenrescue.org');
      setPassword('OperatorPass123!');
    }
    setMode('login');
    setErrorMessage('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at top, #0c1c33 0%, #050e1c 70%, #030811 100%)',
        padding: '20px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Tactical Background Grid Pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(0, 212, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(9, 19, 36, 0.94)',
          border: '1px solid var(--border-tactical, #1e3a5f)',
          borderRadius: '10px',
          boxShadow: '0 12px 48px rgba(0, 0, 0, 0.7), 0 0 24px rgba(0, 212, 255, 0.12)',
          padding: '32px 28px',
          position: 'relative',
          zIndex: 1,
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              background: 'rgba(0, 212, 255, 0.12)',
              border: '1px solid #00d4ff',
              color: '#00d4ff',
              marginBottom: '12px',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.35)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>
              emergency
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '22px',
              fontWeight: 800,
              color: '#f4f7fb',
              letterSpacing: '0.04em',
              margin: '0 0 4px 0',
              textTransform: 'uppercase',
            }}
          >
            GOLDEN RESCUE
          </h1>

          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              fontWeight: 600,
              color: '#00d4ff',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {mode === 'login' ? 'OPERATOR TERMINAL ACCESS' : 'NEW RESPONDER REGISTRATION'}
          </div>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div
            style={{
              marginBottom: '18px',
              padding: '10px 14px',
              borderRadius: '6px',
              background: 'rgba(255, 77, 90, 0.12)',
              border: '1px solid #ff4d5a',
              color: '#ff4d5a',
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              lineHeight: '1.4',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', flexShrink: 0 }}>
              error
            </span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Alert Banner */}
        {successMessage && (
          <div
            style={{
              marginBottom: '18px',
              padding: '10px 14px',
              borderRadius: '6px',
              background: 'rgba(74, 222, 128, 0.12)',
              border: '1px solid #4ade80',
              color: '#4ade80',
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', flexShrink: 0 }}>
              check_circle
            </span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#859398',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                }}
              >
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '18px',
                    color: '#859398',
                  }}
                >
                  alternate_email
                </span>
                <input
                  type="email"
                  required
                  placeholder="operator@goldenrescue.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 40px',
                    background: '#050e1c',
                    border: '1px solid #1e3a5f',
                    borderRadius: '6px',
                    color: '#f4f7fb',
                    fontSize: '13px',
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#00d4ff')}
                  onBlur={(e) => (e.target.style.borderColor = '#1e3a5f')}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#859398',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '18px',
                    color: '#859398',
                  }}
                >
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 40px',
                    background: '#050e1c',
                    border: '1px solid #1e3a5f',
                    borderRadius: '6px',
                    color: '#f4f7fb',
                    fontSize: '13px',
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#00d4ff')}
                  onBlur={(e) => (e.target.style.borderColor = '#1e3a5f')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#859398',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: '8px',
                padding: '12px 18px',
                background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
                border: 'none',
                borderRadius: '6px',
                color: '#050e1c',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'Space Grotesk, sans-serif',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 0 16px rgba(0, 212, 255, 0.4)',
                opacity: isLoading ? 0.7 : 1,
                transition: 'opacity 0.2s, transform 0.1s',
              }}
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', animation: 'spin 1s linear infinite' }}>
                    sync
                  </span>
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    login
                  </span>
                  <span>LOGIN TO DISPATCH TERMINAL</span>
                </>
              )}
            </button>

            {/* Switch to Register */}
            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '12.5px', color: '#859398' }}>
              Don't have an operator account?{' '}
              <button
                type="button"
                onClick={() => switchMode('register')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#00d4ff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '0 4px',
                  textDecoration: 'underline',
                }}
              >
                Register here
              </button>
            </div>
          </form>
        )}

        {/* Register Form */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#859398',
                  marginBottom: '5px',
                  textTransform: 'uppercase',
                }}
              >
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '18px',
                    color: '#859398',
                  }}
                >
                  person
                </span>
                <input
                  type="text"
                  required
                  placeholder="Officer Alex Mercer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 40px',
                    background: '#050e1c',
                    border: '1px solid #1e3a5f',
                    borderRadius: '6px',
                    color: '#f4f7fb',
                    fontSize: '13px',
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#859398',
                  marginBottom: '5px',
                  textTransform: 'uppercase',
                }}
              >
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '18px',
                    color: '#859398',
                  }}
                >
                  alternate_email
                </span>
                <input
                  type="email"
                  required
                  placeholder="alex.mercer@goldenrescue.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 40px',
                    background: '#050e1c',
                    border: '1px solid #1e3a5f',
                    borderRadius: '6px',
                    color: '#f4f7fb',
                    fontSize: '13px',
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#859398',
                  marginBottom: '5px',
                  textTransform: 'uppercase',
                }}
              >
                Password (Min 6 Characters)
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '18px',
                    color: '#859398',
                  }}
                >
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Create password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 40px',
                    background: '#050e1c',
                    border: '1px solid #1e3a5f',
                    borderRadius: '6px',
                    color: '#f4f7fb',
                    fontSize: '13px',
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#859398',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#859398',
                  marginBottom: '5px',
                  textTransform: 'uppercase',
                }}
              >
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '18px',
                    color: '#859398',
                  }}
                >
                  lock_reset
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 40px',
                    background: '#050e1c',
                    border: '1px solid #1e3a5f',
                    borderRadius: '6px',
                    color: '#f4f7fb',
                    fontSize: '13px',
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#859398',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: '8px',
                padding: '12px 18px',
                background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
                border: 'none',
                borderRadius: '6px',
                color: '#050e1c',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'Space Grotesk, sans-serif',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 0 16px rgba(0, 212, 255, 0.4)',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', animation: 'spin 1s linear infinite' }}>
                    sync
                  </span>
                  <span>CREATING ACCOUNT...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    person_add
                  </span>
                  <span>CREATE DISPATCHER ACCOUNT</span>
                </>
              )}
            </button>

            {/* Switch to Login */}
            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '12.5px', color: '#859398' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#00d4ff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '0 4px',
                  textDecoration: 'underline',
                }}
              >
                Log in here
              </button>
            </div>
          </form>
        )}

        {/* Quick Demo Credentials Assistant */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(30, 58, 95, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              color: '#859398',
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            QUICK EVALUATION PRESETS
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => fillDemoAccount('admin')}
              style={{
                background: 'rgba(255, 189, 88, 0.1)',
                border: '1px solid #ffbd58',
                borderRadius: '4px',
                padding: '6px 8px',
                color: '#ffbd58',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Demo Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('dispatcher')}
              style={{
                background: 'rgba(0, 212, 255, 0.1)',
                border: '1px solid #00d4ff',
                borderRadius: '4px',
                padding: '6px 8px',
                color: '#00d4ff',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Demo Dispatcher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
