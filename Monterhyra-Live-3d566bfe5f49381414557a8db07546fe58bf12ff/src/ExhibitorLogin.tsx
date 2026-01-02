import React, { useState, useEffect } from 'react';
import { ExhibitorManager } from './ExhibitorManager';
import type { Exhibitor, MonterSize } from './ExhibitorManager';

interface ExhibitorLoginProps {
  onLogin: (exhibitor: Exhibitor) => void;
  token?: string;
  monterSize?: MonterSize | null;
  monterDimensions?: { width: number; depth: number; height: number } | null;
}

const ExhibitorLogin: React.FC<ExhibitorLoginProps> = ({ onLogin, token: initialToken, monterSize, monterDimensions }) => {
  const [token, setToken] = useState(initialToken || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialToken) {
      handleLogin(initialToken);
    }
  }, [initialToken]);

  const handleLogin = (tokenToUse: string) => {
    setLoading(true);
    setError('');
    
    try {
      const manager = ExhibitorManager;
      const exhibitor = manager.getExhibitorByToken(tokenToUse);
      
      if (exhibitor) {
        // Om monterSize kommer från URL och skiljer sig från sparad, uppdatera
        if (monterSize && exhibitor.monterSize !== monterSize) {
          exhibitor.monterSize = monterSize;
          manager.updateExhibitor(exhibitor.id, { monterSize });
        }
        // Om monterDimensions kommer från URL, uppdatera
        if (monterDimensions) {
          exhibitor.monterDimensions = monterDimensions;
          manager.updateExhibitor(exhibitor.id, { monterDimensions });
        }
        onLogin(exhibitor);
      } else {
        setError('Ogiltig inbjudningslänk. Kontrollera länken och försök igen.');
      }
    } catch (err) {
      setError('Ett fel uppstod vid inloggning. Försök igen senare.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      handleLogin(token);
    }
  };

  // Montersize-display
  const monterSizeDisplay = {
    small: { label: 'Liten', desc: '1-2 kvm', icon: '📦' },
    medium: { label: 'Mellan', desc: '3-6 kvm', icon: '📦' },
    large: { label: 'Stor', desc: '7+ kvm', icon: '📦' }
  };

  const sizeInfo = monterSize ? monterSizeDisplay[monterSize] : null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      padding: '20px',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        {/* Montersize info box */}
        {sizeInfo && (
          <div style={{
            backgroundColor: '#e8f4f8',
            border: '2px solid #2196F3',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '30px',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 10px 0', color: '#1976d2', fontSize: '14px', fontWeight: '600' }}>
              Din montersize
            </p>
            <p style={{ margin: '0', color: '#1565c0', fontSize: '24px', fontWeight: 'bold' }}>
              {sizeInfo.label}
            </p>
            <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '13px' }}>
              {sizeInfo.desc}
            </p>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#333',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              Inbjudningskod
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Klistra in din kod"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
              disabled={loading}
            />
          </div>

          {error && (
            <div style={{
              color: '#d32f2f',
              backgroundColor: '#ffebee',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              border: '1px solid #ef5350',
              fontSize: '13px'
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#ccc' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit'
            }}
          >
            {loading ? 'Loggar in...' : 'Logga in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ExhibitorLogin;
