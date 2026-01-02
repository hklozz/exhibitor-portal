import React, { useState } from 'react';
import type { Exhibitor } from './ExhibitorManager';

interface ExhibitorDashboardProps {
  exhibitor: Exhibitor;
  onLogout: () => void;
}

const ExhibitorDashboard: React.FC<ExhibitorDashboardProps> = ({ exhibitor, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'design' | 'order' | 'info'>('design');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px' }}>Monterhyra Mässdesigner</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
              {exhibitor.companyName}
            </p>
          </div>
          <button
            onClick={onLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Logga ut
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        padding: '20px',
        display: 'flex',
        gap: '20px'
      }}>
        {/* Sidebar */}
        <div style={{
          width: '300px',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          height: 'fit-content'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2c3e50' }}>
            Mina Monteruppgifter
          </h3>

          {/* Monterinfo */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '16px',
            borderRadius: '6px',
            marginBottom: '20px',
            border: '2px solid #3498db'
          }}>
            <h4 style={{ marginTop: 0, marginBottom: '12px', color: '#2c3e50' }}>
              📏 Din Montersize
            </h4>
            <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
              <p style={{ margin: '8px 0' }}>
                <strong>Bredd:</strong> {exhibitor.monterDimensions.width}m
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong>Djup:</strong> {exhibitor.monterDimensions.depth}m
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong>Höjd:</strong> {exhibitor.monterDimensions.height}m
              </p>
            </div>
            <div style={{
              fontSize: '12px',
              color: '#666',
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid #ddd'
            }}>
              ⚠️ Din montersize är låst av mässarrangören
            </div>
          </div>

          {/* Navigation */}
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => setActiveTab('design')}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '8px',
                backgroundColor: activeTab === 'design' ? '#3498db' : '#ecf0f1',
                color: activeTab === 'design' ? 'white' : '#2c3e50',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s'
              }}
            >
              🎨 Designa Monter
            </button>
            <button
              onClick={() => setActiveTab('order')}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '8px',
                backgroundColor: activeTab === 'order' ? '#3498db' : '#ecf0f1',
                color: activeTab === 'order' ? 'white' : '#2c3e50',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s'
              }}
            >
              📦 Beställning
            </button>
            <button
              onClick={() => setActiveTab('info')}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: activeTab === 'info' ? '#3498db' : '#ecf0f1',
                color: activeTab === 'info' ? 'white' : '#2c3e50',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s'
              }}
            >
              ℹ️ Mina Uppgifter
            </button>
          </div>

          {/* Contact Info */}
          <div style={{
            backgroundColor: '#ecf0f1',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#666'
          }}>
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>Kontakt:</strong>
            </p>
            <p style={{ margin: '4px 0' }}>�� {exhibitor.email}</p>
            <p style={{ margin: '4px 0' }}>📞 {exhibitor.phone}</p>
          </div>
        </div>

        {/* Main Panel */}
        <div style={{
          flex: 1,
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {activeTab === 'design' && (
            <div style={{ height: '100%', minHeight: 'calc(100vh - 300px)' }}>
              <h2 style={{ marginTop: 0, marginBottom: '12px', color: '#2c3e50' }}>🎨 Designa Din Monter</h2>
              <div style={{
                backgroundColor: '#e8f4f8',
                color: '#2c3e50',
                padding: '8px 12px',
                borderRadius: '4px',
                marginBottom: '12px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid #b3e5fc'
              }}>
                🔒 Din montersize är låst: {exhibitor.monterDimensions.width}m × {exhibitor.monterDimensions.depth}m × {exhibitor.monterDimensions.height}m
              </div>
              
              <iframe
                src={`/?exhibitor=${exhibitor.id}&width=${exhibitor.monterDimensions.width}&depth=${exhibitor.monterDimensions.depth}&height=${exhibitor.monterDimensions.height}&mode=exhibitor`}
                style={{
                  width: '100%',
                  height: 'calc(100% - 40px)',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  display: 'block'
                }}
                title="Monterhyra Designer"
              />
            </div>
          )}

          {activeTab === 'order' && (
            <div>
              <h2 style={{ marginTop: 0, color: '#2c3e50' }}>📦 Din Beställning</h2>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Här ser du en sammanfattning av din design och kan skicka in din beställning.
              </p>
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '40px',
                borderRadius: '6px',
                textAlign: 'center',
                color: '#999',
                minHeight: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div>
                  <p style={{ fontSize: '48px', margin: '0' }}>📋</p>
                  <p style={{ fontSize: '16px', margin: '16px 0 0 0' }}>
                    Ingen design ännu
                  </p>
                  <p style={{ fontSize: '12px', color: '#bbb', margin: '8px 0 0 0' }}>
                    Börja designa din monter för att se en förhandsvisning här
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'info' && (
            <div>
              <h2 style={{ marginTop: 0, color: '#2c3e50' }}>ℹ️ Mina Uppgifter</h2>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Här kan du uppdatera dina kontaktuppgifter.
              </p>
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '6px',
                maxWidth: '500px'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>
                    Företagsnamn
                  </label>
                  <input
                    type="text"
                    value={exhibitor.companyName}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: '#eee',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>
                    Kontaktperson
                  </label>
                  <input
                    type="text"
                    value={exhibitor.contactPerson}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: '#eee',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>
                    E-post
                  </label>
                  <input
                    type="email"
                    value={exhibitor.email}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: '#eee',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={exhibitor.phone}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: '#eee',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <p style={{
                  fontSize: '12px',
                  color: '#999',
                  marginTop: '16px'
                }}>
                  ℹ️ Kontakta mässarrangören om du behöver uppdatera dina uppgifter
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExhibitorDashboard;
