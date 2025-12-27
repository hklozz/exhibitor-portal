import { useState } from 'react';
import jsPDF from 'jspdf';
import { OrderManager } from './OrderManager';

// beMatrix dimensioner: 62mm x 62mm moduler
const BEMATRIX_MODULE_SIZE = 62; // mm

// Konvertera meter till beMatrix dimensioner
export function metersToBeMatrixDimensions(meters: number): { mm: number; modules: number } {
  const modules = Math.round((meters * 1000) / BEMATRIX_MODULE_SIZE);
  const mm = modules * BEMATRIX_MODULE_SIZE;
  return { mm, modules };
}

// Typ-definitioner för väggdesign
export interface WallDesign {
  wallId: string; // 'back', 'left', 'right'
  wallLabel: string; // 'Bakvägg', 'Vänster', 'Höger'
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
    scale: number; // Skala 0.1 - 2.0 (används inte längre, width/height styr)
  };
  text?: {
    content: string;
    x: number;
    y: number;
    fontSize: number;
    fontFamily: string;
    color: string; // CMYK format
  }[];
}

interface VepaPDFGeneratorProps {
  wallShape: string; // 'straight', 'l', 'u'
  wallWidth: number; // meter (bredd)
  wallDepth: number; // meter (djup för sidoväggar)
  wallHeight: number; // meter
  onClose: () => void;
  onApplyDesigns?: (designs: WallDesign[]) => void; // Callback för att applicera design på väggarna
  existingDesigns?: WallDesign[]; // Ladda tidigare sparade designs
}

export default function VepaPDFGenerator({
  wallShape,
  wallWidth,
  wallDepth,
  wallHeight,
  onClose,
  onApplyDesigns,
  existingDesigns
}: VepaPDFGeneratorProps) {
  const [designs, setDesigns] = useState<WallDesign[]>(() => {
    // Om vi har tidigare designs, använd dem
    if (existingDesigns && existingDesigns.length > 0) {
      console.log('📂 Laddar tidigare VEPA designs:', existingDesigns);
      return existingDesigns;
    }
    
    // Annars initiera nya design-objekt baserat på wallShape
    console.log('🆕 Skapar nya VEPA designs');
    const initialDesigns: WallDesign[] = [];
    
    // Bakvägg - alltid
    const backDimensions = metersToBeMatrixDimensions(wallWidth);
    const heightDimensions = metersToBeMatrixDimensions(wallHeight);
    initialDesigns.push({
      wallId: 'back',
      wallLabel: 'Bakvägg',
      widthMeters: wallWidth,
      heightMeters: wallHeight,
      widthMM: backDimensions.mm,
      heightMM: heightDimensions.mm,
      backgroundColor: 'C:0 M:0 Y:0 K:0', // Vit
      backgroundColorRGB: '#FFFFFF',
      text: []
    });
    
    // Vänster vägg - för L och U
    if (wallShape === 'l' || wallShape === 'u') {
      const leftDimensions = metersToBeMatrixDimensions(wallDepth);
      initialDesigns.push({
        wallId: 'left',
        wallLabel: 'Vänster vägg',
        widthMeters: wallDepth,
        heightMeters: wallHeight,
        widthMM: leftDimensions.mm,
        heightMM: heightDimensions.mm,
        backgroundColor: 'C:0 M:0 Y:0 K:0',
        backgroundColorRGB: '#FFFFFF',
        text: []
      });
    }
    
    // Höger vägg - endast för U
    if (wallShape === 'u') {
      const rightDimensions = metersToBeMatrixDimensions(wallDepth);
      initialDesigns.push({
        wallId: 'right',
        wallLabel: 'Höger vägg',
        widthMeters: wallDepth,
        heightMeters: wallHeight,
        widthMM: rightDimensions.mm,
        heightMM: heightDimensions.mm,
        backgroundColor: 'C:0 M:0 Y:0 K:0',
        backgroundColorRGB: '#FFFFFF',
        text: []
      });
    }
    
    return initialDesigns;
  });
  
  const [currentWallIndex, setCurrentWallIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const currentDesign = designs[currentWallIndex];

  // Hjälpare för hex -> rgb
  const parseHexToRgb = (hex?: string): [number, number, number] | null => {
    if (!hex) return null;
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
  };
  
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
        const wallAspectRatio = currentDesign.widthMM / currentDesign.heightMM;
        
        let logoWidth: number;
        let logoHeight: number;
        
        // Anpassa bilden så den passar inom väggen (max 80% av väggen för att ha marginal)
        const maxWidth = currentDesign.widthMM * 0.8;
        const maxHeight = currentDesign.heightMM * 0.8;
        
        if (imageAspectRatio > wallAspectRatio) {
          // Bilden är bredare än väggen - anpassa efter bredd
          logoWidth = maxWidth;
          logoHeight = maxWidth / imageAspectRatio;
        } else {
          // Bilden är högre än väggen - anpassa efter höjd
          logoHeight = maxHeight;
          logoWidth = maxHeight * imageAspectRatio;
        }
        
        // Centrera bilden på väggen
        setDesigns(prev => prev.map((design, index) => 
          index === currentWallIndex 
            ? {
                ...design,
                logo: {
                  imageData,
                  x: (currentDesign.widthMM - logoWidth) / 2,
                  y: (currentDesign.heightMM - logoHeight) / 2,
                  width: logoWidth,
                  height: logoHeight,
                  scale: 1.0
                }
              }
            : design
        ));
      };
      img.src = imageData;
    };
    reader.readAsDataURL(file);
  };
  
  // Uppdatera bakgrundsfärg
  const handleColorChange = (color: string, rgb: string) => {
    setDesigns(prev => prev.map((design, index) => 
      index === currentWallIndex 
        ? { ...design, backgroundColor: color, backgroundColorRGB: rgb }
        : design
    ));
  };
  
  // Ladda upp bakgrundsbild
  const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setDesigns(prev => prev.map((design, index) => 
        index === currentWallIndex 
          ? { ...design, backgroundImage: imageData }
          : design
      ));
    };
    reader.readAsDataURL(file);
  };
  
  // Generera PDF för en enskild vägg
  const generateWallPDF = async (design: WallDesign): Promise<Blob> => {
    const VEPA_BLEED = 30; // mm bleed för tyg
    
    // PDF dimensioner inkl. bleed
    const pdfWidth = design.widthMM + (VEPA_BLEED * 2);
    const pdfHeight = design.heightMM + (VEPA_BLEED * 2);
    
    // Skapa PDF i mm
    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
      compress: false
    });
    
    // Rita bakgrundsfärg (hela ytan inkl. bleed)
    // Först försök med CMYK-strängen (backgroundColor), annars använd backgroundColorRGB (hex)
    const cmykMatch = design.backgroundColor && design.backgroundColor.match(/C:(\d+)\s+M:(\d+)\s+Y:(\d+)\s+K:(\d+)/);
    if (cmykMatch) {
      const [, c, m, y, k] = cmykMatch.map(Number);
      pdf.setFillColor(c, m, y, k);
      pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
    } else if (design.backgroundColorRGB) {
      const rgb = parseHexToRgb(design.backgroundColorRGB);
      if (rgb) {
        pdf.setFillColor(...rgb);
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
      } else {
        // fallback vitt
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
      }
    }
    
    // Rita bakgrundsbild om den finns
    if (design.backgroundImage) {
      try {
        pdf.addImage(
          design.backgroundImage,
          'PNG',
          VEPA_BLEED,
          VEPA_BLEED,
          design.widthMM,
          design.heightMM
        );
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
          design.logo.x + VEPA_BLEED,
          design.logo.y + VEPA_BLEED,
          design.logo.width,
          design.logo.height
        );
      } catch (error) {
        console.error('Kunde inte lägga till logo:', error);
      }
    }
    
    // Rita text om den finns
    design.text?.forEach(textItem => {
      pdf.setFontSize(textItem.fontSize);
      pdf.text(
        textItem.content,
        textItem.x + VEPA_BLEED,
        textItem.y + VEPA_BLEED
      );
    });
    
    // Rita beskärningsmarkeringar (bleed guides)
    pdf.setDrawColor(255, 0, 0);
    pdf.setLineWidth(0.1);
    
    // Yttre ram (bleed area)
    pdf.rect(0, 0, pdfWidth, pdfHeight);
    
    // Inre ram (trim area - där trycket ska slutas)
    pdf.rect(VEPA_BLEED, VEPA_BLEED, design.widthMM, design.heightMM);
    
    // Lägg till information i PDF metadata
    pdf.setProperties({
      title: `Monterhyra VEPA - ${design.wallLabel}`,
      subject: `Tryckfil för ${design.wallLabel}`,
      author: 'Monterhyra',
      keywords: 'VEPA, beMatrix, Tryck',
      creator: 'Monterhyra Konfigurator'
    });
    
    // Lägg till textinformation på PDF
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`${design.wallLabel}`, 10, pdfHeight - 10);
    pdf.text(`Storlek: ${design.widthMM}mm × ${design.heightMM}mm`, 10, pdfHeight - 15);
    pdf.text(`Bleed: ${VEPA_BLEED}mm`, 10, pdfHeight - 20);
    pdf.text(`Material: VEPA (tyg)`, 10, pdfHeight - 25);
    
    return pdf.output('blob');
  };
  
  // Generera alla PDFs och skapa ZIP
  const handleGeneratePDFs = async () => {
    setIsGenerating(true);
    
    try {
      // Generera och spara PDF för varje vägg
      for (const design of designs) {
        const pdfBlob = await generateWallPDF(design);
        const fileName = `${design.wallLabel.replace(' ', '_')}_${design.widthMM}x${design.heightMM}mm.pdf`;
        // Spara i adminpanelen
        try {
          await OrderManager.savePrintPDF(fileName, pdfBlob);
        } catch (err) {
          console.warn('Kunde ej spara PDF i adminpanelen:', err);
        }
        // Ladda ner lokalt
        const link = document.createElement('a');
        link.href = URL.createObjectURL(pdfBlob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      // Visa success-meddelande men stäng INTE popup
      alert('✅ PDF-filer nedladdade och sparade i admin!\n\nDu kan nu:\n• Fortsätta redigera designen\n• Applicera designen på väggen\n• Eller stänga fönstret');
    } catch (error) {
      console.error('Fel vid generering av PDFs:', error);
      alert('Ett fel uppstod vid generering av PDF-filer. Vänligen försök igen.');
    } finally {
      setIsGenerating(false);
    }
  };
  
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
            🎨 Skapa VEPA Tryckfiler
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 28,
              cursor: 'pointer',
              color: '#666',
              padding: 0,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
        
        {/* Vägg-navigering */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          borderBottom: '1px solid #e0e0e0',
          paddingBottom: 12
        }}>
          {designs.map((design, index) => (
            <button
              key={design.wallId}
              onClick={() => setCurrentWallIndex(index)}
              style={{
                padding: '8px 16px',
                backgroundColor: currentWallIndex === index ? '#2196F3' : '#f0f0f0',
                color: currentWallIndex === index ? '#fff' : '#333',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: currentWallIndex === index ? 600 : 400,
                fontSize: 14
              }}
            >
              {design.wallLabel}
            </button>
          ))}
        </div>
        
        {/* Vägg-information */}
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: 16,
          borderRadius: 8,
          marginBottom: 24
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 18, fontWeight: 600 }}>
            {currentDesign.wallLabel}
          </h3>
          <div style={{ fontSize: 14, color: '#666' }}>
            <div>📏 <strong>Storlek:</strong> {currentDesign.widthMeters.toFixed(1)}m × {currentDesign.heightMeters.toFixed(1)}m</div>
            <div>📐 <strong>beMatrix:</strong> {currentDesign.widthMM}mm × {currentDesign.heightMM}mm</div>
            <div>🎯 <strong>Bleed:</strong> 30mm (tyg)</div>
          </div>
        </div>
        
        {/* Design-kontroller */}
        <div style={{ marginBottom: 24 }}>
          <label style={{
            display: 'block',
            fontWeight: 600,
            marginBottom: 8,
            fontSize: 14
          }}>
            �️ Ladda upp bild (bakgrund):
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleBackgroundImageUpload}
            style={{
              padding: 8,
              border: '2px solid #e0e0e0',
              borderRadius: 6,
              width: '100%',
              fontSize: 14
            }}
          />
          {currentDesign.backgroundImage && (
            <div style={{
              marginTop: 12,
              padding: 12,
              backgroundColor: '#e3f2fd',
              borderRadius: 6,
              fontSize: 13
            }}>
              ✅ Bakgrundsbild uppladdad
            </div>
          )}
        </div>
        
        <div style={{ marginBottom: 24 }}>
          <label style={{
            display: 'block',
            fontWeight: 600,
            marginBottom: 8,
            fontSize: 14
          }}>
            �📷 Ladda upp logotyp:
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            style={{
              padding: 8,
              border: '2px solid #e0e0e0',
              borderRadius: 6,
              width: '100%',
              fontSize: 14
            }}
          />
          {currentDesign.logo && (
            <>
              <div style={{
                marginTop: 12,
                padding: 12,
                backgroundColor: '#e3f2fd',
                borderRadius: 6,
                fontSize: 13
              }}>
                ✅ Logotyp uppladdad ({currentDesign.logo.width.toFixed(0)}mm × {currentDesign.logo.height.toFixed(0)}mm)
              </div>
              <div style={{
                marginTop: 8,
                fontSize: 11,
                color: '#666',
                fontStyle: 'italic',
                paddingLeft: 12
              }}>
                💡 Använd förhandsgranskningsrutan nedan för att dra och ändra storlek på logotypen
              </div>
            </>
          )}
        </div>
        
        <div style={{ marginBottom: 24 }}>
          <label style={{
            display: 'block',
            fontWeight: 600,
            marginBottom: 12,
            fontSize: 14
          }}>
            🎨 Bakgrundsfärg:
          </label>
          
          {/* Färgväljare (Color Picker) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: 16,
            backgroundColor: '#f8f9fa',
            borderRadius: 8,
            marginBottom: 16,
            border: '2px solid #e1e8ed'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#555' }}>
                Välj valfri färg:
              </label>
              <input
                type="color"
                value={currentDesign.backgroundColorRGB}
                onChange={(e) => {
                  const hexColor = e.target.value;
                  // Konvertera HEX till RGB för approximativ CMYK
                  const r = parseInt(hexColor.slice(1, 3), 16);
                  const g = parseInt(hexColor.slice(3, 5), 16);
                  const b = parseInt(hexColor.slice(5, 7), 16);
                  
                  // Enkel RGB till CMYK konvertering (approximation för förhandsgranskning)
                  const rNorm = r / 255;
                  const gNorm = g / 255;
                  const bNorm = b / 255;
                  const k = 1 - Math.max(rNorm, gNorm, bNorm);
                  const c = k === 1 ? 0 : (1 - rNorm - k) / (1 - k);
                  const m = k === 1 ? 0 : (1 - gNorm - k) / (1 - k);
                  const y = k === 1 ? 0 : (1 - bNorm - k) / (1 - k);
                  
                  const cmykString = `C:${Math.round(c * 100)} M:${Math.round(m * 100)} Y:${Math.round(y * 100)} K:${Math.round(k * 100)}`;
                  handleColorChange(cmykString, hexColor.toUpperCase());
                }}
                style={{
                  width: 80,
                  height: 80,
                  border: '3px solid #ddd',
                  borderRadius: 8,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                padding: 12,
                backgroundColor: currentDesign.backgroundColorRGB,
                border: '2px solid #ddd',
                borderRadius: 8,
                minHeight: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  padding: '8px 16px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#333',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {currentDesign.backgroundColor}
                </div>
              </div>
            </div>
          </div>
          
          {/* Snabbval av vanliga färger */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#666', marginBottom: 8, display: 'block' }}>
              Eller välj från snabbval:
            </label>
            <div style={{ 
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap'
            }}>
              {[
                // 8 vanliga färger för snabbval
                { name: 'Vit', cmyk: 'C:0 M:0 Y:0 K:0', rgb: '#FFFFFF' },
                { name: 'Svart', cmyk: 'C:0 M:0 Y:0 K:100', rgb: '#000000' },
                { name: 'Grå', cmyk: 'C:0 M:0 Y:0 K:50', rgb: '#808080' },
                { name: 'Röd', cmyk: 'C:0 M:100 Y:100 K:0', rgb: '#FF0000' },
                { name: 'Blå', cmyk: 'C:100 M:50 Y:0 K:0', rgb: '#0080FF' },
                { name: 'Grön', cmyk: 'C:100 M:0 Y:100 K:0', rgb: '#00FF00' },
                { name: 'Gul', cmyk: 'C:0 M:0 Y:100 K:0', rgb: '#FFFF00' },
                { name: 'Orange', cmyk: 'C:0 M:50 Y:100 K:0', rgb: '#FF8000' }
              ].map(color => (
                <button
                  key={color.name}
                  onClick={() => handleColorChange(color.cmyk, color.rgb)}
                  title={color.cmyk}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: color.rgb,
                    color: ['Vit', 'Gul'].includes(color.name) ? '#333' : '#fff',
                    border: currentDesign.backgroundColor === color.cmyk ? '3px solid #2196F3' : '2px solid #ddd',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: currentDesign.backgroundColor === color.cmyk ? 700 : 500,
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    boxShadow: currentDesign.backgroundColor === color.cmyk ? '0 2px 8px rgba(33,150,243,0.4)' : 'none',
                    minWidth: '60px'
                  }}
                  onMouseEnter={(e) => {
                    if (currentDesign.backgroundColor !== color.cmyk) {
                      e.currentTarget.style.transform = 'scale(1.08)';
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentDesign.backgroundColor !== color.cmyk) {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {color.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Preview med interaktiv logo-editor */}
        <div style={{
          border: '2px dashed #ccc',
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
          backgroundColor: '#fafafa'
        }}>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 12,
            color: '#666',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>📋 Förhandsgranskning (Dra & ändra storlek på logotyp)</span>
            <span style={{ fontSize: 12, fontWeight: 400, color: '#999' }}>
              {currentDesign.widthMM}mm × {currentDesign.heightMM}mm
            </span>
          </div>
          <div 
            style={{
              backgroundColor: currentDesign.backgroundColorRGB || '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: 4,
              padding: 0,
              minHeight: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              aspectRatio: `${currentDesign.widthMM} / ${currentDesign.heightMM}`,
              overflow: 'hidden'
            }}
            id={`preview-${currentDesign.wallId}`}
          >
            {/* Bakgrundsbild */}
            {currentDesign.backgroundImage && (
              <img
                src={currentDesign.backgroundImage}
                alt="Bakgrund"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  pointerEvents: 'none'
                }}
              />
            )}
            
            {/* Interaktiv Logotyp med PowerPoint-style controls */}
            {currentDesign.logo && (() => {
              const previewContainer = typeof document !== 'undefined' 
                ? document.getElementById(`preview-${currentDesign.wallId}`)
                : null;
              const containerWidth = previewContainer?.offsetWidth || 600;
              
              // Konvertera mm till pixels i preview
              const mmToPixel = containerWidth / currentDesign.widthMM;
              const logoXpx = currentDesign.logo.x * mmToPixel;
              const logoYpx = currentDesign.logo.y * mmToPixel;
              const logoWidthPx = currentDesign.logo.width * mmToPixel;
              const logoHeightPx = currentDesign.logo.height * mmToPixel;
              
              return (
                <div
                  style={{
                    position: 'absolute',
                    left: logoXpx,
                    top: logoYpx,
                    width: logoWidthPx,
                    height: logoHeightPx,
                    border: '2px solid #2196F3',
                    boxShadow: '0 0 0 1px rgba(33,150,243,0.3)',
                    cursor: 'move',
                    zIndex: 100
                  }}
                  onMouseDown={(e) => {
                    if ((e.target as HTMLElement).classList.contains('resize-handle')) return;
                    
                    e.preventDefault();
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startLogoX = currentDesign.logo!.x;
                    const startLogoY = currentDesign.logo!.y;
                    
                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      const deltaX = (moveEvent.clientX - startX) / mmToPixel;
                      const deltaY = (moveEvent.clientY - startY) / mmToPixel;
                      
                      const newX = Math.max(0, Math.min(currentDesign.widthMM - currentDesign.logo!.width, startLogoX + deltaX));
                      const newY = Math.max(0, Math.min(currentDesign.heightMM - currentDesign.logo!.height, startLogoY + deltaY));
                      
                      setDesigns(prev => prev.map(d => 
                        d.wallId === currentDesign.wallId && d.logo
                          ? { ...d, logo: { ...d.logo, x: newX, y: newY } }
                          : d
                      ));
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  <img
                    src={currentDesign.logo.imageData}
                    alt="Logo"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      pointerEvents: 'none'
                    }}
                  />
                  
                  {/* Resize handles (8 punkter som i PowerPoint) */}
                  {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(position => {
                    const handleStyle: React.CSSProperties = {
                      position: 'absolute',
                      width: 8,
                      height: 8,
                      backgroundColor: '#fff',
                      border: '2px solid #2196F3',
                      borderRadius: '50%',
                      zIndex: 101
                    };
                    
                    // Positionering av handtag
                    if (position.includes('n')) handleStyle.top = -4;
                    if (position.includes('s')) handleStyle.bottom = -4;
                    if (position.includes('w')) handleStyle.left = -4;
                    if (position.includes('e')) handleStyle.right = -4;
                    if (position === 'n' || position === 's') handleStyle.left = '50%';
                    if (position === 'e' || position === 'w') handleStyle.top = '50%';
                    if (position === 'n' || position === 's') handleStyle.transform = 'translateX(-50%)';
                    if (position === 'e' || position === 'w') handleStyle.transform = 'translateY(-50%)';
                    
                    // Cursor
                    const cursors: Record<string, string> = {
                      'nw': 'nw-resize', 'n': 'n-resize', 'ne': 'ne-resize',
                      'e': 'e-resize', 'se': 'se-resize', 's': 's-resize',
                      'sw': 'sw-resize', 'w': 'w-resize'
                    };
                    handleStyle.cursor = cursors[position];
                    
                    return (
                      <div
                        key={position}
                        className="resize-handle"
                        style={handleStyle}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          const startX = e.clientX;
                          const startY = e.clientY;
                          const startWidth = currentDesign.logo!.width;
                          const startHeight = currentDesign.logo!.height;
                          const startPosX = currentDesign.logo!.x;
                          const startPosY = currentDesign.logo!.y;
                          const aspectRatio = startWidth / startHeight;
                          
                          const handleMouseMove = (moveEvent: MouseEvent) => {
                            let deltaX = (moveEvent.clientX - startX) / mmToPixel;
                            let deltaY = (moveEvent.clientY - startY) / mmToPixel;
                            
                            let newWidth = startWidth;
                            let newHeight = startHeight;
                            let newX = startPosX;
                            let newY = startPosY;
                            
                            // Håll aspect ratio med Shift-tangent
                            const maintainAspectRatio = moveEvent.shiftKey;
                            
                            if (position.includes('e')) {
                              newWidth = Math.max(50, startWidth + deltaX);
                              if (maintainAspectRatio) newHeight = newWidth / aspectRatio;
                            }
                            if (position.includes('w')) {
                              newWidth = Math.max(50, startWidth - deltaX);
                              newX = startPosX + (startWidth - newWidth);
                              if (maintainAspectRatio) {
                                newHeight = newWidth / aspectRatio;
                                newY = startPosY + (startHeight - newHeight) / 2;
                              }
                            }
                            if (position.includes('s')) {
                              newHeight = Math.max(50, startHeight + deltaY);
                              if (maintainAspectRatio && !position.includes('e') && !position.includes('w')) {
                                newWidth = newHeight * aspectRatio;
                              }
                            }
                            if (position.includes('n')) {
                              newHeight = Math.max(50, startHeight - deltaY);
                              newY = startPosY + (startHeight - newHeight);
                              if (maintainAspectRatio && !position.includes('e') && !position.includes('w')) {
                                newWidth = newHeight * aspectRatio;
                                newX = startPosX + (startWidth - newWidth) / 2;
                              }
                            }
                            
                            // Begränsa till canvas
                            if (newX < 0) { newWidth += newX; newX = 0; }
                            if (newY < 0) { newHeight += newY; newY = 0; }
                            if (newX + newWidth > currentDesign.widthMM) newWidth = currentDesign.widthMM - newX;
                            if (newY + newHeight > currentDesign.heightMM) newHeight = currentDesign.heightMM - newY;
                            
                            setDesigns(prev => prev.map(d => 
                              d.wallId === currentDesign.wallId && d.logo
                                ? { ...d, logo: { ...d.logo, width: newWidth, height: newHeight, x: newX, y: newY } }
                                : d
                            ));
                          };
                          
                          const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                          };
                          
                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                      />
                    );
                  })}
                </div>
              );
            })()}
            
            {/* Visa dimension-guide */}
            {!currentDesign.backgroundImage && !currentDesign.logo && (
              <div style={{ 
                color: '#999', 
                fontSize: 14,
                textAlign: 'center',
                padding: 20
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🎨</div>
                <div>Ladda upp bild eller logotyp</div>
                <div style={{ fontSize: 12, marginTop: 8 }}>
                  Väggstorlek: {currentDesign.widthMeters.toFixed(1)}m × {currentDesign.heightMeters.toFixed(1)}m
                </div>
              </div>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#999', marginTop: 8, textAlign: 'center' }}>
            💡 Tips: Dra logotypen för att flytta, dra i hörnen för att ändra storlek. Håll Shift för att behålla proportioner.
          </div>
        </div>
        
        {/* Knappar */}
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'space-between'
        }}>
          <button
            onClick={onClose}
            disabled={isGenerating}
            style={{
              padding: '12px 24px',
              backgroundColor: '#f0f0f0',
              color: '#333',
              border: 'none',
              borderRadius: 6,
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: 14,
              opacity: isGenerating ? 0.5 : 1
            }}
          >
            Avbryt
          </button>
          
          <div style={{ display: 'flex', gap: 12 }}>
            {onApplyDesigns && (
              <button
                onClick={() => {
                  console.log('🎨 Applicerar designs på väggar:', designs);
                  designs.forEach((d, i) => {
                    console.log(`  Vägg ${i} (${d.wallId}):`, {
                      hasBackgroundImage: !!d.backgroundImage,
                      backgroundImageLength: d.backgroundImage?.length,
                      hasLogo: !!d.logo,
                      logoImageLength: d.logo?.imageData?.length,
                      backgroundColor: d.backgroundColorRGB
                    });
                  });
                  onApplyDesigns(designs);
                  
                  // Success popup
                  alert('✅ Designen har applicerats på väggen!\n\nDu kan nu:\n• Stänga detta fönster för att se designen på montern\n• Eller fortsätta redigera och applicera igen');
                }}
                disabled={isGenerating}
                style={{
                  padding: '12px 24px',
                  backgroundColor: isGenerating ? '#ccc' : '#2196F3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: 14
                }}
              >
                🎨 Applicera på vägg
              </button>
            )}
            
            <button
              onClick={handleGeneratePDFs}
              disabled={isGenerating}
              style={{
                padding: '12px 24px',
                backgroundColor: isGenerating ? '#ccc' : '#4CAF50',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: 14
              }}
            >
              {isGenerating ? '⏳ Genererar...' : '📥 Ladda ner PDF:er'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
