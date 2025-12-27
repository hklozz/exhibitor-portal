import React, { useState, useEffect } from 'react';
import { ExhibitorManager } from './ExhibitorManager';
import type { Exhibitor } from './ExhibitorManager';

interface ExhibitorLoginProps {
  onLogin: (exhibitor: Exhibitor) => void;
  token?: string;
}

const ExhibitorLogin: React.FC<ExhibitorLoginProps> = ({ onLogin, token: initialToken }) => {
  const [token, setToken] = useState(initialToken || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [foundExhibitor, setFoundExhibitor] = useState<Exhibitor | null>(null);

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
        setFoundExhibitor(exhibitor);
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

  if (foundExhibitor) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Välkommen! 🎉</h2>
          <p style={{ color: '#666', marginBottom: '30px', fontSize: '16px' }}>
            Du är inloggad som <strong>{foundExhibitor.companyName}</strong>
          </p>
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '6px',
            marginBottom: '30px',
            textAlign: 'left'
          }}>
            <p><strong>Monterinfo:</strong></p>
            <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
              <li>Bredd: {foundExhibitor.monterSize.width}m</li>
              <li>Djup: {foundExhibitor.monterSize.depth}m</li>
              <li>Höjd: {foundExhibitor.monterSize.height}m</li>
            </ul>
          </div>
          <p style={{ color: '#999', fontSize: '14px', marginBottom: '20px' }}>
            Du kan nu börja designa din monter. Din montersize är låst för denna mässa.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h1 style={{
          fontSize: '28px',
          color: '#2c3e50',
          marginBottom: '10px',
          textAlign: 'center'
        }}>
          Monterhyra Mässdesigner
        </h1>
        
        <p style={{
          color: '#666',
          textAlign: 'center',
          marginBottom: '30px',
          fontSize: '14px'
        }}>
          Logga in med din inbjudningslänk för att designa din monter
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#2c3e50'
            }}>
              Inbjudningskod
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setError('');
              }}
              placeholder="Klistra in din inbjudningskod här"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fee',
              color: '#c33',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '20px',
              fontSize: '14px',
              border: '1px solid #fcc'
            }}>
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !token.trim()}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#ccc' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'default' : 'pointer',
              transition: 'background-color 0.3s'
            }}
          >
            {loading ? 'Loggar in...' : 'Logga in'}
          </button>
        </form>

        <div style={{
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '1px solid #eee',
          fontSize: '12px',
          color: '#999',
          textAlign: 'center'
        }}>
          <p>
            Du bör ha mottagit en länk via email från mässarrangören.
            <br />
            Den länken innehåller din personliga inbjudningskod.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExhibitorLogin;
