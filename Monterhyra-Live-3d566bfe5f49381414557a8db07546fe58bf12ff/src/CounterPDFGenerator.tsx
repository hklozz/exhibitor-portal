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

// Typ-definitioner för disk design
export interface CounterDesign {
  counterId: string; // Unik ID för denna disk
  counterType: string; // '1m disk', '1,5m disk', etc.
  widthMeters: number;
  depthMeters: number;
  heightMeters: number; // Höjd på disk panel
  widthMM: number;
  depthMM: number;
  heightMM: number;
  backgroundColor: string; // CMYK format: "C:0 M:0 Y:0 K:0"
  backgroundColorRGB: string; // RGB hex för preview
  backgroundImage?: string; // Helbild som täcker hela framsidan
  logo?: {
    imageData: string; // base64
    x: number; // position i mm från vänster
    y: number; // position i mm från topp
    width: number; // bredd i mm
    height: number; // höjd i mm
  };
  printType: 'vepa' | 'forex'; // Vilken typ av tryck
}

interface CounterPDFGeneratorProps {
  counters: Array<{ id: number; type: string; position: { x: number; z: number }; rotation: number }>;
  onClose: () => void;
  onApplyDesigns?: (designs: CounterDesign[], printType: 'vepa' | 'forex') => void;
  existingDesigns?: CounterDesign[];
  existingPrintType?: 'vepa' | 'forex';
}

// Mappning av disk-typer till dimensioner
const COUNTER_DIMENSIONS: Record<string, { width: number; depth: number; height: number }> = {
  'Ingen disk': { width: 0, depth: 0, height: 0 },
  '1m disk': { width: 1, depth: 0.5, height: 1.0 },
  '1,5m disk': { width: 1.5, depth: 0.5, height: 1.0 },
  '2m disk': { width: 2, depth: 0.5, height: 1.0 },
  '2,5m disk': { width: 2.5, depth: 0.5, height: 1.0 },
  '3m disk': { width: 3, depth: 0.5, height: 1.0 },
  '3,5m disk': { width: 3.5, depth: 0.5, height: 1.0 },
  '4m disk': { width: 4, depth: 0.5, height: 1.0 },
  'L-disk (1,5m + 1m)': { width: 1.5, depth: 0.5, height: 1.0 },
  'L-disk spegelvänd (1,5m + 1m)': { width: 1.5, depth: 0.5, height: 1.0 }
};

export default function CounterPDFGenerator({
  counters,
  onClose,
  onApplyDesigns,
  existingDesigns,
  existingPrintType
}: CounterPDFGeneratorProps) {
  const [printType, setPrintType] = useState<'vepa' | 'forex'>(existingPrintType || 'vepa');
  const [designs, setDesigns] = useState<CounterDesign[]>(() => {
    // Om vi har tidigare designs, använd dem
    if (existingDesigns && existingDesigns.length > 0) {
      console.log('📂 Laddar tidigare disk-designs:', existingDesigns);
      return existingDesigns;
    }
    
    // Annars initiera nya design-objekt för alla diskar
    console.log('🆕 Skapar nya disk-designs');
    const initialDesigns: CounterDesign[] = [];
    
    for (const counter of counters) {
      const dims = COUNTER_DIMENSIONS[counter.type];
      if (!dims || dims.width === 0) continue; // Hoppa över "Ingen disk"
      
      const widthMM = metersToBeMatrixDimensions(dims.width).mm;
      const depthMM = metersToBeMatrixDimensions(dims.depth).mm;
      const heightMM = metersToBeMatrixDimensions(dims.height).mm;
      
      initialDesigns.push({
        counterId: `counter_${counter.id}`,
        counterType: counter.type,
        widthMeters: dims.width,
        depthMeters: dims.depth,
        heightMeters: dims.height,
        widthMM,
        depthMM,
        heightMM,
        backgroundColor: 'C:0 M:0 Y:0 K:0',
        backgroundColorRGB: '#FFFFFF',
        printType
      });
    }
    
    return initialDesigns;
  });
  
  const [currentDesignIndex, setCurrentDesignIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const currentDesign = designs[currentDesignIndex];
  
  // Auto-applicera design vid ändringar
  useEffect(() => {
    if (onApplyDesigns && designs.length > 0) {
      onApplyDesigns(designs, printType);
      console.log('🎨 Auto-applicerar disk-design på 3D-modellen');
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
        const imageAspectRatio = img.width / img.height;
        
        let logoWidth: number;
        let logoHeight: number;
        
        // Anpassa bilden så den passar inom diskpanelen (max 80% av bredden)
        const maxWidth = currentDesign.widthMM * 0.8;
        const maxHeight = currentDesign.heightMM * 0.8;
        
        if (imageAspectRatio > (maxWidth / maxHeight)) {
          logoWidth = maxWidth;
          logoHeight = maxWidth / imageAspectRatio;
        } else {
          logoHeight = maxHeight;
          logoWidth = maxHeight * imageAspectRatio;
        }
        
        // Centrera logon
        const logoX = (currentDesign.widthMM - logoWidth) / 2;
        const logoY = (currentDesign.heightMM - logoHeight) / 2;
        
        setDesigns(prev => prev.map((d, i) => 
          i === currentDesignIndex 
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
      i === currentDesignIndex 
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
        i === currentDesignIndex 
          ? { ...d, backgroundImage }
          : d
      ));
    };
    reader.readAsDataURL(file);
  };
  
  // Ta bort bakgrundsbild
  const removeBackground = () => {
    setDesigns(prev => prev.map((d, i) => 
      i === currentDesignIndex 
        ? { ...d, backgroundImage: undefined }
        : d
    ));
  };
  
  // Uppdatera bakgrundsfärg
  const updateBackgroundColor = (rgb: string, cmyk: string) => {
    setDesigns(prev => prev.map((d, i) => 
      i === currentDesignIndex 
        ? { ...d, backgroundColorRGB: rgb, backgroundColor: cmyk }
        : d
    ));
  };
  
  // Generera PDF för alla diskar
  const generateAllPDFs = async () => {
    if (designs.length === 0) {
      alert('❌ Inga diskar att generera PDF för');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const bleedMM = printType === 'vepa' ? 30 : 3; // 30mm för VEPA, 3mm för Forex
      for (const design of designs) {
        const pdf = await generateCounterPDF(design, bleedMM, printType);
        const pdfBlob = pdf.output('blob');
        const fileName = `Disk_${design.counterType.replace(/\s+/g, '_')}_${design.widthMM}x${design.heightMM}mm.pdf`;
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
  
  // Generera PDF för en disk
  async function generateCounterPDF(design: CounterDesign, bleedMM: number, type: 'vepa' | 'forex'): Promise<jsPDF> {
    const totalWidth = design.widthMM + 2 * bleedMM;
    const totalHeight = design.heightMM + 2 * bleedMM;
    
    const pdf = new jsPDF({
      orientation: totalWidth > totalHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [totalWidth, totalHeight],
      compress: true
    });
    
    // Parse CMYK background color
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
      title: `Disk ${design.counterType} - ${type.toUpperCase()} Tryck`,
      subject: `${design.widthMM}mm x ${design.heightMM}mm (${design.widthMeters}m x ${design.heightMeters}m)`,
      author: 'Monterhyra PDF Generator',
      keywords: `${type}, disk, tryck, beMatrix, ${bleedMM}mm bleed`,
      creator: 'Monterhyra System'
    });
    
    return pdf;
  }
  
  if (!currentDesign) {
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
          maxWidth: 500,
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>❌ Inga diskar</h2>
          <p style={{ marginBottom: 16 }}>Det finns inga placerade diskar att designa.</p>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600
            }}
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
          marginBottom: 24
        }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>🍽️ Disk Designer</h2>
          <button
            onClick={onClose}
            style={{
              fontSize: 24,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ✕
          </button>
        </div>
        
        {/* Val av trycktyp */}
        <div style={{
          marginBottom: 24,
          padding: 16,
          backgroundColor: '#f3f4f6',
          borderRadius: 8
        }}>
          <label style={{ fontWeight: 700, marginRight: 16, display: 'block', marginBottom: 8 }}>
            Trycktyp:
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="radio"
                value="vepa"
                checked={printType === 'vepa'}
                onChange={(e) => setPrintType(e.target.value as 'vepa' | 'forex')}
              />
              VEPA (Etikett)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="radio"
                value="forex"
                checked={printType === 'forex'}
                onChange={(e) => setPrintType(e.target.value as 'vepa' | 'forex')}
              />
              Forex (Hårt material)
            </label>
          </div>
        </div>
        
        {/* Välja mellan diskar */}
        {designs.length > 1 && (
          <div style={{
            marginBottom: 24,
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap'
          }}>
            {designs.map((design, index) => (
              <button
                key={design.counterId}
                onClick={() => setCurrentDesignIndex(index)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: index === currentDesignIndex ? '#2563eb' : '#e5e7eb',
                  color: index === currentDesignIndex ? 'white' : '#374151',
                  fontWeight: 600
                }}
              >
                {design.counterType} ({design.widthMM}×{design.heightMM}mm)
              </button>
            ))}
          </div>
        )}
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Vänster panel: Redigeringsverktyg */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0, marginBottom: 12 }}>
                {currentDesign.counterType}
              </h3>
              <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
                Storlek: {currentDesign.widthMM}mm × {currentDesign.heightMM}mm ({currentDesign.widthMeters}m × {currentDesign.heightMeters}m)
              </p>
            </div>
            
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
                  const rgbParsed = parseHexToRgb(rgb);
                  if (rgbParsed) {
                    const [r, g, b] = rgbParsed;
                    const cmyk = `C:${Math.round((255-r)/2.55)} M:${Math.round((255-g)/2.55)} Y:${Math.round((255-b)/2.55)} K:0`;
                    updateBackgroundColor(rgb, cmyk);
                  }
                }}
                style={{ width: '100%', height: 40, border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
              />
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
              }}>Logotyp:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                style={{ width: '100%', fontSize: 14 }}
              />
              {currentDesign.logo && (
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
                  ❌ Ta bort logotyp
                </button>
              )}
            </div>
          </div>
          
          {/* Höger panel: Preview */}
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Förhandsgranskning:</h3>
            <div style={{
              backgroundColor: currentDesign.backgroundColorRGB,
              backgroundImage: currentDesign.backgroundImage ? `url(${currentDesign.backgroundImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              aspectRatio: `${currentDesign.widthMM} / ${currentDesign.heightMM}`,
              border: '2px solid #ddd',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
              marginBottom: 16,
              minHeight: 300
            }}>
              {currentDesign.logo && (
                <img
                  src={currentDesign.logo.imageData}
                  alt="Logo"
                  style={{
                    maxWidth: '80%',
                    maxHeight: '80%',
                    objectFit: 'contain'
                  }}
                />
              )}
              {!currentDesign.backgroundImage && !currentDesign.logo && (
                <p style={{ color: '#999', textAlign: 'center', padding: 16 }}>
                  Förhandsgranskning uppdateras när du lägger till bakgrund eller logotyp
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Knappar */}
        <div style={{
          marginTop: 24,
          display: 'flex',
          gap: 12,
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              backgroundColor: '#e5e7eb',
              color: '#374151',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            Stäng
          </button>
          <button
            onClick={generateAllPDFs}
            disabled={isGenerating}
            style={{
              padding: '12px 24px',
              backgroundColor: isGenerating ? '#9ca3af' : '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            {isGenerating ? '⏳ Genererar...' : '🖨️ Generera PDF-filer'}
          </button>
        </div>
      </div>
    </div>
  );
}
