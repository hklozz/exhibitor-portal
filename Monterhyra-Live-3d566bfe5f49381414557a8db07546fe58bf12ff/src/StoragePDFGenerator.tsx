import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';

// Hjälpare: konvertera hex-färg (#rrggbb eller #rgb) till [r,g,b]
function parseHexToRgb(hex?: string): [number, number, number] | null {
  if (!hex || typeof hex !== 'string') return null;
  const h = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]+$/.test(h)) return null;
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    return [r, g, b];
  }
  if (h.length === 6) {
    const int = parseInt(h, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return [r, g, b];
  }
  return null;
}

// beMatrix dimensioner: 62mm x 62mm moduler
const BEMATRIX_MODULE_SIZE = 62; // mm

// Konvertera meter till beMatrix dimensioner
export function metersToBeMatrixDimensions(meters: number): { mm: number; modules: number } {
  const modules = Math.round((meters * 1000) / BEMATRIX_MODULE_SIZE);
  const mm = modules * BEMATRIX_MODULE_SIZE;
  return { mm, modules };
}

// Typ-definitioner för förrådsvägg design
export interface StorageWallDesign {
  wallId: string; // 'back', 'left', 'right', 'front'
  wallLabel: string; // 'Bakvägg', 'Vänster', 'Höger', 'Framsida'
  widthMeters: number;
  heightMeters: number;
  widthMM: number;
  heightMM: number;
  backgroundColor: string; // CMYK format: "C:0 M:0 Y:0 K:0"
  backgroundColorRGB: string; // RGB hex för preview
  backgroundImage?: string; // Helbild som täcker hela väggen
  logo?: {
    imageData: string; // base64
    x: number; // position i mm från vänster
    y: number; // position i mm från topp
    width: number; // bredd i mm
    height: number; // höjd i mm
  };
  printType: 'vepa' | 'forex'; // Vilken typ av tryck
  isFree: boolean; // Om denna sida är fri (inte mot montervägg)
}

interface StoragePDFGeneratorProps {
  storageWidth: number; // meter (bredd)
  storageDepth: number; // meter (djup)
  storageHeight: number; // meter (höjd)
  freeWalls: {
    back: boolean;
    left: boolean;
    right: boolean;
    front: boolean;
  }; // Vilka väggar som är fria (inte mot montervägg)
  onClose: () => void;
  onApplyDesigns?: (designs: StorageWallDesign[], printType: 'vepa' | 'forex') => void;
  existingDesigns?: StorageWallDesign[];
  existingPrintType?: 'vepa' | 'forex';
}

export default function StoragePDFGenerator({
  storageWidth,
  storageDepth,
  storageHeight,
  freeWalls,
  onClose,
  onApplyDesigns,
  existingDesigns,
  existingPrintType
}: StoragePDFGeneratorProps) {
  const [printType, setPrintType] = useState<'vepa' | 'forex'>(existingPrintType || 'vepa');
  const [designs, setDesigns] = useState<StorageWallDesign[]>(() => {
    // Om vi har tidigare designs, använd dem
    if (existingDesigns && existingDesigns.length > 0) {
      console.log('📂 Laddar tidigare förråds-designs:', existingDesigns);
      return existingDesigns;
    }
    
    // Annars initiera nya design-objekt för alla väggar
    console.log('🆕 Skapar nya förråds-designs');
    const initialDesigns: StorageWallDesign[] = [];
    const heightDimensions = metersToBeMatrixDimensions(storageHeight);
    
    // Bakvägg (bredd = storageWidth)
    if (freeWalls.back) {
      const backDimensions = metersToBeMatrixDimensions(storageWidth);
      initialDesigns.push({
        wallId: 'back',
        wallLabel: 'Bakvägg',
        widthMeters: storageWidth,
        heightMeters: storageHeight,
        widthMM: backDimensions.mm,
        heightMM: heightDimensions.mm,
        backgroundColor: 'C:0 M:0 Y:0 K:0',
        backgroundColorRGB: '#FFFFFF',
        printType,
        isFree: true
      });
    }
    
    // Vänster vägg (bredd = storageDepth)
    if (freeWalls.left) {
      const leftDimensions = metersToBeMatrixDimensions(storageDepth);
      initialDesigns.push({
        wallId: 'left',
        wallLabel: 'Vänster vägg',
        widthMeters: storageDepth,
        heightMeters: storageHeight,
        widthMM: leftDimensions.mm,
        heightMM: heightDimensions.mm,
        backgroundColor: 'C:0 M:0 Y:0 K:0',
        backgroundColorRGB: '#FFFFFF',
        printType,
        isFree: true
      });
    }
    
    // Höger vägg (bredd = storageDepth)
    if (freeWalls.right) {
      const rightDimensions = metersToBeMatrixDimensions(storageDepth);
      initialDesigns.push({
        wallId: 'right',
        wallLabel: 'Höger vägg',
        widthMeters: storageDepth,
        heightMeters: storageHeight,
        widthMM: rightDimensions.mm,
        heightMM: heightDimensions.mm,
        backgroundColor: 'C:0 M:0 Y:0 K:0',
        backgroundColorRGB: '#FFFFFF',
        printType,
        isFree: true
      });
    }
    
    // Framsida (bredd = storageWidth)
    if (freeWalls.front) {
      const frontDimensions = metersToBeMatrixDimensions(storageWidth);
      initialDesigns.push({
        wallId: 'front',
        wallLabel: 'Framsida',
        widthMeters: storageWidth,
        heightMeters: storageHeight,
        widthMM: frontDimensions.mm,
        heightMM: heightDimensions.mm,
        backgroundColor: 'C:0 M:0 Y:0 K:0',
        backgroundColorRGB: '#FFFFFF',
        printType,
        isFree: true
      });
    }
    
    return initialDesigns;
  });
  
  const [currentWallIndex, setCurrentWallIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const currentDesign = designs[currentWallIndex];
  
  // Auto-applicera design vid ändringar
  useEffect(() => {
    if (onApplyDesigns && designs.length > 0) {
      onApplyDesigns(designs, printType);
      console.log('🎨 Auto-applicerar design på 3D-modellen');
    }
  }, [designs, printType, onApplyDesigns]);
  
  // Ladda upp logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      
      // Ladda bilden för att få dess faktiska dimensioner
      const img = new Image();
      img.onload = () => {
        // Beräkna bildens proportioner
        const imageAspectRatio = img.width / img.height;
        
        let logoWidth: number;
        let logoHeight: number;
        
        // Anpassa bilden så den passar inom väggen (max 80% av väggen för att ha marginal)
        const maxWidth = currentDesign.widthMM * 0.8;
        const maxHeight = currentDesign.heightMM * 0.8;
        
        if (imageAspectRatio > (maxWidth / maxHeight)) {
          // Bilden är bredare än väggen - begränsa till maxWidth
          logoWidth = maxWidth;
          logoHeight = maxWidth / imageAspectRatio;
        } else {
          // Bilden är högre än väggen - begränsa till maxHeight
          logoHeight = maxHeight;
          logoWidth = maxHeight * imageAspectRatio;
        }
        
        // Centrera logon
        const logoX = (currentDesign.widthMM - logoWidth) / 2;
        const logoY = (currentDesign.heightMM - logoHeight) / 2;
        
        setDesigns(prev => prev.map((d, i) => 
          i === currentWallIndex 
            ? { ...d, logo: { imageData, x: logoX, y: logoY, width: logoWidth, height: logoHeight } }
            : d
        ));
      };
      img.src = imageData;
    };
    reader.readAsDataURL(file);
  };
  
  // Ta bort logo
  const removeLogo = () => {
    setDesigns(prev => prev.map((d, i) => 
      i === currentWallIndex 
        ? { ...d, logo: undefined }
        : d
    ));
  };
  
  // Ladda upp bakgrundsbild
  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const backgroundImage = event.target?.result as string;
      setDesigns(prev => prev.map((d, i) => 
        i === currentWallIndex 
          ? { ...d, backgroundImage }
          : d
      ));
    };
    reader.readAsDataURL(file);
  };
  
  // Ta bort bakgrundsbild
  const removeBackground = () => {
    setDesigns(prev => prev.map((d, i) => 
      i === currentWallIndex 
        ? { ...d, backgroundImage: undefined }
        : d
    ));
  };
  
  // Uppdatera bakgrundsfärg
  const updateBackgroundColor = (rgb: string, cmyk: string) => {
    setDesigns(prev => prev.map((d, i) => 
      i === currentWallIndex 
        ? { ...d, backgroundColorRGB: rgb, backgroundColor: cmyk }
        : d
    ));
  };
  
  // Generera PDF för alla fria väggar
  const generateAllPDFs = async () => {
    if (designs.length === 0) {
      alert('❌ Inga fria väggar att generera PDF för');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const bleedMM = printType === 'vepa' ? 30 : 3; // 30mm för VEPA, 3mm för Forex
      for (const design of designs) {
        const pdf = await generateWallPDF(design, bleedMM, printType);
        const pdfBlob = pdf.output('blob');
        const fileName = `Forrad_${design.wallLabel.replace(/\s+/g, '_')}_${design.widthMM}x${design.heightMM}mm.pdf`;
        // Spara i adminpanelen
        try {
          const { OrderManager } = await import('./OrderManager');
          await OrderManager.savePrintPDF(fileName, pdfBlob);
        } catch (err) {
          console.warn('Kunde ej spara PDF i adminpanelen:', err);
        }
        // Ladda ner lokalt
        const a = document.createElement('a');
        a.href = URL.createObjectURL(pdfBlob);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      alert(`✅ PDF-filer nedladdade och sparade i admin! Du kan nu:\n• Fortsätta redigera designen\n• Skicka PDF-filerna till tryckeriet\n• Applicera designen på 3D-modellen`);
    } catch (error) {
      console.error('❌ Fel vid PDF-generering:', error);
      alert('❌ Kunde inte generera PDF-filer');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Generera PDF för en vägg
  async function generateWallPDF(design: StorageWallDesign, bleedMM: number, type: 'vepa' | 'forex'): Promise<jsPDF> {
    const totalWidth = design.widthMM + 2 * bleedMM;
    const totalHeight = design.heightMM + 2 * bleedMM;
    
    const pdf = new jsPDF({
      orientation: totalWidth > totalHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [totalWidth, totalHeight],
      compress: true
    });
    
    // Parse CMYK background color, annars fallback till backgroundColorRGB (hex)
    const cmykMatch = (design.backgroundColor || '').match(/C:(\d+)\s+M:(\d+)\s+Y:(\d+)\s+K:(\d+)/);
    if (cmykMatch) {
      const [, c, m, y, k] = cmykMatch.map(Number);
      pdf.setFillColor(c, m, y, k);
      pdf.rect(0, 0, totalWidth, totalHeight, 'F');
    } else if (design.backgroundColorRGB) {
      const rgb = parseHexToRgb(design.backgroundColorRGB);
      if (rgb) {
        pdf.setFillColor(...rgb);
        pdf.rect(0, 0, totalWidth, totalHeight, 'F');
      }
    }
    
    // Rita bakgrundsbild om den finns
    if (design.backgroundImage) {
      try {
        pdf.addImage(design.backgroundImage, 'JPEG', bleedMM, bleedMM, design.widthMM, design.heightMM, undefined, 'FAST');
      } catch (error) {
        console.error('Kunde inte lägga till bakgrundsbild:', error);
      }
    }
    
    // Rita logo om den finns
    if (design.logo) {
      try {
        pdf.addImage(
          design.logo.imageData,
          'PNG',
          design.logo.x + bleedMM,
          design.logo.y + bleedMM,
          design.logo.width,
          design.logo.height,
          undefined,
          'FAST'
        );
      } catch (error) {
        console.error('Kunde inte lägga till logo:', error);
      }
    }
    
    // Rita skärlinjer (cutlines)
    pdf.setDrawColor(255, 0, 0);
    pdf.setLineWidth(0.1);
    pdf.rect(bleedMM, bleedMM, design.widthMM, design.heightMM);
    
    // Rita hörn markeringar
    const cornerSize = 10;
    // Övre vänster
    pdf.line(bleedMM, bleedMM - cornerSize, bleedMM, bleedMM + cornerSize);
    pdf.line(bleedMM - cornerSize, bleedMM, bleedMM + cornerSize, bleedMM);
    // Övre höger
    pdf.line(bleedMM + design.widthMM, bleedMM - cornerSize, bleedMM + design.widthMM, bleedMM + cornerSize);
    pdf.line(bleedMM + design.widthMM - cornerSize, bleedMM, bleedMM + design.widthMM + cornerSize, bleedMM);
    // Nedre vänster
    pdf.line(bleedMM, bleedMM + design.heightMM - cornerSize, bleedMM, bleedMM + design.heightMM + cornerSize);
    pdf.line(bleedMM - cornerSize, bleedMM + design.heightMM, bleedMM + cornerSize, bleedMM + design.heightMM);
    // Nedre höger
    pdf.line(bleedMM + design.widthMM, bleedMM + design.heightMM - cornerSize, bleedMM + design.widthMM, bleedMM + design.heightMM + cornerSize);
    pdf.line(bleedMM + design.widthMM - cornerSize, bleedMM + design.heightMM, bleedMM + design.widthMM + cornerSize, bleedMM + design.heightMM);
    
    // Lägg till metadata
    pdf.setProperties({
      title: `Förråd ${design.wallLabel} - ${type.toUpperCase()} Tryck`,
      subject: `${design.widthMM}mm x ${design.heightMM}mm (${design.widthMeters}m x ${design.heightMeters}m)`,
      author: 'Monterhyra PDF Generator',
      keywords: `${type}, förråd, tryck, beMatrix, ${bleedMM}mm bleed`,
      creator: 'Monterhyra System'
    });
    
    return pdf;
  }
  
  if (!currentDesign) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{zIndex: 10000}}>
        <div className="bg-white rounded-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">❌ Inga fria väggar</h2>
          <p className="mb-4">Detta förråd har inga fria väggar som behöver grafik.</p>
          <button
            onClick={onClose}
            className="w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
          >
            Stäng
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        maxWidth: 900,
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        width: '90%'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          borderBottom: '2px solid #e0e0e0',
          paddingBottom: 16
        }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
            🎨 Förråd {printType.toUpperCase()} Designer
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 28,
              cursor: 'pointer',
              color: '#666',
              padding: 4,
              borderRadius: 4
            }}
          >
            ×
          </button>
        </div>
        
        
        {/* Trycktyp väljare */}
        <div style={{
          marginBottom: 24,
          padding: 16,
          backgroundColor: '#eff6ff',
          borderRadius: 8
        }}>
          <label style={{ 
            display: 'block',
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 8
          }}>Välj trycktyp:</label>
          <div style={{ display: 'flex', gap: 16 }}>
            <button
              onClick={() => {
                setPrintType('vepa');
                setDesigns(prev => prev.map(d => ({ ...d, printType: 'vepa' })));
              }}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: printType === 'vepa' ? '#2563eb' : '#e5e7eb',
                color: printType === 'vepa' ? 'white' : '#374151'
              }}
            >
              VEPA (Fabric - 30mm bleed)
            </button>
            <button
              onClick={() => {
                setPrintType('forex');
                setDesigns(prev => prev.map(d => ({ ...d, printType: 'forex' })));
              }}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: printType === 'forex' ? '#ea580c' : '#e5e7eb',
                color: printType === 'forex' ? 'white' : '#374151'
              }}>
              FOREX (Rigid - 3mm bleed)
            </button>
          </div>
        </div>        
        {/* Väggväljare */}
        <div style={{ marginBottom: 24 }}>
          <label style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 8
          }}>Välj vägg att designa ({designs.length} fria väggar):</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {designs.map((design, index) => (
              <button
                key={design.wallId}
                onClick={() => setCurrentWallIndex(index)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: index === currentWallIndex ? '#2563eb' : '#e5e7eb',
                  color: index === currentWallIndex ? 'white' : '#374151',
                  fontWeight: 600
                }}
              >
                {design.wallLabel} ({design.widthMeters}m × {design.heightMeters}m)
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Vänster panel: Redigeringsverktyg */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{currentDesign.wallLabel}</h3>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
              Storlek: {currentDesign.widthMM}mm × {currentDesign.heightMM}mm 
              ({currentDesign.widthMeters}m × {currentDesign.heightMeters}m)
            </p>
            
            {/* Bakgrundsfärg */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 700,
                marginBottom: 8
              }}>Bakgrundsfärg:</label>
              <input
                type="color"
                value={currentDesign.backgroundColorRGB}
                onChange={(e) => {
                  const rgb = e.target.value;
                  // Enkel RGB till CMYK konvertering (approximation)
                  const r = parseInt(rgb.slice(1, 3), 16) / 255;
                  const g = parseInt(rgb.slice(3, 5), 16) / 255;
                  const b = parseInt(rgb.slice(5, 7), 16) / 255;
                  
                  const k = 1 - Math.max(r, g, b);
                  const c = (1 - r - k) / (1 - k) || 0;
                  const m = (1 - g - k) / (1 - k) || 0;
                  const y = (1 - b - k) / (1 - k) || 0;
                  
                  const cmyk = `C:${Math.round(c * 100)} M:${Math.round(m * 100)} Y:${Math.round(y * 100)} K:${Math.round(k * 100)}`;
                  updateBackgroundColor(rgb, cmyk);
                }}
                style={{
                  width: '100%',
                  height: 48,
                  borderRadius: 6,
                  cursor: 'pointer',
                  border: '1px solid #d1d5db'
                }}
              />
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>CMYK: {currentDesign.backgroundColor}</p>
            </div>
            
            {/* Bakgrundsbild */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 700,
                marginBottom: 8
              }}>Bakgrundsbild (heltäckande):</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleBackgroundUpload}
                style={{ width: '100%', fontSize: 14 }}
              />
              {currentDesign.backgroundImage && (
                <button
                  onClick={removeBackground}
                  style={{
                    marginTop: 8,
                    color: '#dc2626',
                    fontSize: 14,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  ❌ Ta bort bakgrundsbild
                </button>
              )}
            </div>
            
            {/* Logo */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 700,
                marginBottom: 8
              }}>Logo / Bild:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                style={{ width: '100%', fontSize: 14 }}
              />
              {currentDesign.logo && (
                <div style={{ marginTop: 8 }}>
                  <p style={{ fontSize: 14, color: '#6b7280' }}>
                    Position: {Math.round(currentDesign.logo.x)}mm, {Math.round(currentDesign.logo.y)}mm<br />
                    Storlek: {Math.round(currentDesign.logo.width)}mm × {Math.round(currentDesign.logo.height)}mm
                  </p>
                  <button
                    onClick={removeLogo}
                    style={{
                      marginTop: 8,
                      color: '#dc2626',
                      fontSize: 14,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    ❌ Ta bort logo
                  </button>
                </div>
              )}
            </div>
            
            {/* Actionknappar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 16 }}>
              <button
                onClick={generateAllPDFs}
                disabled={isGenerating}
                style={{
                  width: '100%',
                  backgroundColor: isGenerating ? '#9ca3af' : '#10b981',
                  color: 'white',
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: 8,
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontSize: 16
                }}
              >
                {isGenerating ? '⏳ Genererar PDFs...' : '📄 Ladda ner alla PDF-filer (.zip)'}
              </button>
              <button
                onClick={onClose}
                style={{
                  width: '100%',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 16
                }}
              >
                ✅ Spara och stäng
              </button>
              <div style={{
                backgroundColor: '#eff6ff',
                border: '2px solid #bfdbfe',
                borderRadius: 8,
                padding: 12,
                textAlign: 'center',
                fontSize: 14,
                color: '#1e40af'
              }}>
                💡 Designen appliceras automatiskt på 3D-modellen
              </div>
            </div>
          </div>
          
          {/* Höger panel: Preview */}
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Preview (förhandsvisning):</h3>
            <div 
              style={{
                border: '4px solid #d1d5db',
                borderRadius: 8,
                position: 'relative',
                overflow: 'hidden',
                aspectRatio: `${currentDesign.widthMM} / ${currentDesign.heightMM}`,
                backgroundColor: currentDesign.backgroundColorRGB,
                backgroundImage: currentDesign.backgroundImage ? `url(${currentDesign.backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {currentDesign.logo && (
                <img
                  src={currentDesign.logo.imageData}
                  alt="Logo"
                  style={{
                    position: 'absolute',
                    left: `${(currentDesign.logo.x / currentDesign.widthMM) * 100}%`,
                    top: `${(currentDesign.logo.y / currentDesign.heightMM) * 100}%`,
                    width: `${(currentDesign.logo.width / currentDesign.widthMM) * 100}%`,
                    height: `${(currentDesign.logo.height / currentDesign.heightMM) * 100}%`,
                  }}
                />
              )}
            </div>
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8, textAlign: 'center' }}>
              {printType === 'vepa' ? '30mm' : '3mm'} bleed kommer läggas till runt om i PDF:en
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
