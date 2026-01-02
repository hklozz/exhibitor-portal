import React from 'react';
import type { Exhibitor } from './ExhibitorManager';

interface ExhibitorDesignModeProps {
  exhibitor: Exhibitor;
  onSaveDesign: (designData: any) => void;
  onLogout: () => void;
}

/**
 * ExhibitorDesignMode - Visa samma designverktyg som App.tsx men med låst montersize
 * Detta är en wrapper som låser montersize baserat på exhibitor-profilen
 */
const ExhibitorDesignMode: React.FC<ExhibitorDesignModeProps> = ({ 
  exhibitor, 
  onSaveDesign, 
  onLogout 
}) => {
  const iframeKey = 0; // Unique key for iframe
  // Skapa en speciell URL med query-parametrar för designern
  const designerUrl = `/?exhibitor=${exhibitor.id}&width=${exhibitor.monterDimensions.width}&depth=${exhibitor.monterDimensions.depth}&height=${exhibitor.monterDimensions.height}&mode=exhibitor`;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Header med exhibitor-info och logout */}
      <div style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 100
      }}>
        <div>
          <h2 style={{ margin: '0', fontSize: '18px' }}>Designa din monter</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
            {exhibitor.companyName} | {exhibitor.monterDimensions.width}m × {exhibitor.monterDimensions.depth}m × {exhibitor.monterDimensions.height}m
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => {
              // Spara current design
              const designData = localStorage.getItem('exhibitorDesign_' + exhibitor.id);
              if (designData) {
                onSaveDesign(JSON.parse(designData));
              }
              alert('✅ Design sparad!');
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            💾 Spara design
          </button>
          <button
            onClick={onLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Logga ut
          </button>
        </div>
      </div>

      {/* Info banner om låst montersize */}
      <div style={{
        backgroundColor: '#e8f4f8',
        color: '#2c3e50',
        padding: '12px 20px',
        borderBottom: '1px solid #b3e5fc',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        🔒 Din montersize är låst av mässarrangören och kan inte ändras
      </div>

      {/* Designer-iframe eller embed */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        position: 'relative'
      }}>
        <iframe
          key={iframeKey}
          src={designerUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block'
          }}
          title="Monterhyra Designer"
        />
        
        {/* Fallback: Om iframe inte fungerar, visa instruktion */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          maxWidth: '400px',
          display: 'none' // Dölj tills iframe misslyckas
        }}>
          <h3>Designverktyget laddar...</h3>
          <p>Montersize: {exhibitor.monterDimensions.width}m × {exhibitor.monterDimensions.depth}m × {exhibitor.monterDimensions.height}m</p>
        </div>
      </div>

      {/* Footer med tips */}
      <div style={{
        backgroundColor: 'white',
        padding: '12px 20px',
        borderTop: '1px solid #ddd',
        fontSize: '12px',
        color: '#666'
      }}>
        💡 Tips: Designa din monter, lägg till möbler, växter och grafik. Klicka "Spara design" när du är klar.
      </div>
    </div>
  );
};

export default ExhibitorDesignMode;
