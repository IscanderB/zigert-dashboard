import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tkbblfqrfphooernmwbj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYmJsZnFyZnBob29lcm5td2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5OTkwNzIsImV4cCI6MjA3NTU3NTA3Mn0.IEOGqHgW2oKsiSoOfQI05G979qslqcGmjglMKpiIJkQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleResetPassword(e) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage('Passwords do not match!');
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters!');
      return;
    }

    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
      setLoading(false);
    } else {
      setMessage('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }
  }

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#F2F2F7',
      padding: '20px'
    }}>
      <style>{`
        :root {
          --primary: #007AFF;
          --success: #34C759;
          --danger: #FF3B30;
          --warning: #FF9500;
          --gray-1: #8E8E93;
          --text-tertiary: #48484A;
          --separator: rgba(60, 60, 67, 0.12);
          --shadow: 0 0 20px rgba(0, 0, 0, 0.05);
        }
      `}</style>

      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '20px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: 'var(--shadow)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img 
            src="/zigert-logo.png"
            alt="Zigert Logo"
            style={{ width: '200px', height: 'auto', marginBottom: '16px' }}
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <h2 style={{ 
            margin: 0, 
            fontSize: '24px', 
            fontWeight: '600',
            color: '#000000'
          }}>
            Reset Your Password
          </h2>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '14px',
            color: 'var(--text-tertiary)'
          }}>
            Enter your new password below
          </p>
        </div>
        
        {message && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            background: message.includes('Error') || message.includes('not match') 
              ? 'var(--danger)' 
              : message.includes('successfully') 
                ? 'var(--success)' 
                : 'var(--warning)',
            color: 'white',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: '500',
            animation: 'slideIn 0.3s ease-out'
          }}>
            {message.includes('successfully') ? '✓ ' : message.includes('Error') ? '✗ ' : '⚠️ '}
            {message}
          </div>
        )}

        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '4px', 
              fontSize: '14px', 
              color: 'var(--text-tertiary)'
            }}>
              New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                style={{
                  width: 'calc(100% - 24px)',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '0.5px solid var(--separator)',
                  fontSize: '16px',
                  outline: 'none',
                  background: 'white'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--gray-1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '4px', 
              fontSize: '14px', 
              color: 'var(--text-tertiary)'
            }}>
              Confirm New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                style={{
                  width: 'calc(100% - 24px)',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '0.5px solid var(--separator)',
                  fontSize: '16px',
                  outline: 'none',
                  background: 'white'
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--gray-1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showConfirmPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '10px',
              background: loading ? '#C7C7CC' : 'var(--primary)',
              color: 'white',
              border: 'none',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              marginTop: '8px'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.background = '#0056CC';
                e.target.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.background = 'var(--primary)';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            {loading ? 'Updating Password...' : 'Reset Password'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <a 
            href="/" 
            style={{ 
              color: 'var(--primary)', 
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;