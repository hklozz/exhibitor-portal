import { useState } from 'react';
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

// Forex ramstorlekar (i mm)
const FULL_FRAME_WIDTH = 992;
const HALF_FRAME_WIDTH = 496;
const STANDARD_HEIGHT_2_5M = 2480;
const STANDARD_HEIGHT_3M = 2976;
const FOREX_BLEED = 3; // 3mm bleed för Forex

// Konvertera meter till beMatrix-anpassade mm (62mm-system)
function metersToBeMatrixDimensions(meters: number) {
  const modules = Math.round((meters * 1000) / 62);
  const mm = modules * 62;
  return { modules, mm };
}

// Beräkna vilka ramar som behövs för en bredd
function calculateFramesForWidth(widthMM: number): { fullFrames: number; halfFrames: number; frames: number[] } {
  const fullFrames = Math.floor(widthMM / FULL_FRAME_WIDTH);
  const remainder = widthMM - (fullFrames * FULL_FRAME_WIDTH);
  
  // Om resten är större än 0, behöver vi en halvram
  const halfFrames = remainder > 0 ? 1 : 0;
  
  // Skapa array med rambredder från vänster till höger
  const frames: number[] = [];
  for (let i = 0; i < fullFrames; i++) {
    frames.push(FULL_FRAME_WIDTH);
  }
  if (halfFrames > 0) {
    frames.push(HALF_FRAME_WIDTH);
  }
  
  return { fullFrames, halfFrames, frames };
}

// Beräkna ramhöjder baserat på vägghöjd
function calculateFrameHeights(heightMM: number): { heights: number[]; hasTopRow: boolean } {
  if (heightMM <= STANDARD_HEIGHT_2_5M) {
    return { heights: [STANDARD_HEIGHT_2_5M], hasTopRow: false };
  } else if (heightMM <= STANDARD_HEIGHT_3M) {
    return { heights: [STANDARD_HEIGHT_3M], hasTopRow: false };
  } else {
    // Två rader: undre 2480mm, övre 992mm (landscape)
    return { heights: [STANDARD_HEIGHT_2_5M, 992], hasTopRow: true };
  }
}

interface ForexFrame {
  width: number;
  height: number;
  x: number;
  y: number;
  row: number;
  col: number;
}

interface WallDesign {
  wallId: string;
  wallLabel: string;
  widthMeters: number;
  heightMeters: number;
  widthMM: number;
  heightMM: number;
  frames: ForexFrame[];
  backgroundColor: string;
  backgroundColorRGB: string;
  backgroundImage?: string;
  logo?: {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
    imageData: string;
  };
}

interface ForexPDFGeneratorProps {
  wallShape: 'straight' | 'l' | 'u';
  wallWidth: number;
  wallDepth: number;
  wallHeight: number;
  onClose: () => void;
  onApplyDesigns: (designs: WallDesign[]) => void;
  existingDesigns?: WallDesign[];
}

export default function ForexPDFGenerator({
  wallShape,
  wallWidth,
  wallDepth,
  wallHeight,
  onClose,
  onApplyDesigns,
  existingDesigns
}: ForexPDFGeneratorProps) {
  const [designs, setDesigns] = useState<WallDesign[]>(() => {
    if (existingDesigns && existingDesigns.length > 0) {
      console.log('📂 Laddar tidigare Forex designs:', existingDesigns);
      return existingDesigns;
    }
    
    console.log('🆕 Skapar nya Forex designs');
    const initialDesigns: WallDesign[] = [];
    
    const createFramesForWall = (widthMM: number, heightMM: number): ForexFrame[] => {
      const frames: ForexFrame[] = [];
      const { frames: frameWidths } = calculateFramesForWidth(widthMM);
      const { heights, hasTopRow } = calculateFrameHeights(heightMM);
      
      let xPos = 0;
      frameWidths.forEach((frameWidth, col) => {
        frames.push({
          width: frameWidth,
          height: heights[0],
          x: xPos,
          y: 0,
          row: 0,
          col
        });
        xPos += frameWidth;
      });
      
      if (hasTopRow) {
        xPos = 0;
        frameWidths.forEach((frameWidth, col) => {
          frames.push({
            width: frameWidth,
            height: heights[1],
            x: xPos,
            y: heights[0],
            row: 1,
            col
          });
          xPos += frameWidth;
        });
      }
      
      return frames;
    };
    
    const backDimensions = metersToBeMatrixDimensions(wallWidth);
    const heightDimensions = metersToBeMatrixDimensions(wallHeight);
    const backFrames = createFramesForWall(backDimensions.mm, heightDimensions.mm);
    
    initialDesigns.push({
      wallId: 'back',
      wallLabel: 'Bakvägg',
      widthMeters: wallWidth,
      heightMeters: wallHeight,
      widthMM: backDimensions.mm,
      heightMM: heightDimensions.mm,
      frames: backFrames,
      backgroundColor: 'C:0 M:0 Y:0 K:0',
      backgroundColorRGB: '#FFFFFF'
    });
    
    if (wallShape === 'l' || wallShape === 'u') {
      const leftDimensions = metersToBeMatrixDimensions(wallDepth);
      const leftFrames = createFramesForWall(leftDimensions.mm, heightDimensions.mm);
      
      initialDesigns.push({
        wallId: 'left',
        wallLabel: 'Vänster vägg',
        widthMeters: wallDepth,
        heightMeters: wallHeight,
        widthMM: leftDimensions.mm,
        heightMM: heightDimensions.mm,
        frames: leftFrames,
        backgroundColor: 'C:0 M:0 Y:0 K:0',
        backgroundColorRGB: '#FFFFFF'
      });
    }
    
    if (wallShape === 'u') {
      const rightDimensions = metersToBeMatrixDimensions(wallDepth);
      const rightFrames = createFramesForWall(rightDimensions.mm, heightDimensions.mm);
      
      initialDesigns.push({
        wallId: 'right',
        wallLabel: 'Höger vägg',
        widthMeters: wallDepth,
        heightMeters: wallHeight,
        widthMM: rightDimensions.mm,
        heightMM: heightDimensions.mm,
        frames: rightFrames,
        backgroundColor: 'C:0 M:0 Y:0 K:0',
        backgroundColorRGB: '#FFFFFF'
      });
    }
    
    return initialDesigns;
  });
  
  const [currentWallIndex, setCurrentWallIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isResizingLogo, setIsResizingLogo] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  
  const currentDesign = designs[currentWallIndex];
  
  // Färgpresets
  const colorPresets = [
    { name: 'Vit', cmyk: 'C:0 M:0 Y:0 K:0', hex: '#FFFFFF' },
    { name: 'Svart', cmyk: 'C:0 M:0 Y:0 K:100', hex: '#000000' },
    { name: 'Röd', cmyk: 'C:0 M:100 Y:100 K:0', hex: '#FF0000' },
    { name: 'Blå', cmyk: 'C:100 M:100 Y:0 K:0', hex: '#0000FF' },
    { name: 'Grön', cmyk: 'C:100 M:0 Y:100 K:0', hex: '#00FF00' },
    { name: 'Gul', cmyk: 'C:0 M:0 Y:100 K:0', hex: '#FFFF00' },
    { name: 'Orange', cmyk: 'C:0 M:50 Y:100 K:0', hex: '#FF8000' },
    { name: 'Lila', cmyk: 'C:50 M:100 Y:0 K:0', hex: '#8000FF' }
  ];
  
  const handleColorChange = (cmyk: string, hex: string) => {
    const updatedDesigns = [...designs];
    updatedDesigns[currentWallIndex] = {
      ...currentDesign,
      backgroundColor: cmyk,
      backgroundColorRGB: hex
    };
    setDesigns(updatedDesigns);
  };
  
  const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const updatedDesigns = [...designs];
      updatedDesigns[currentWallIndex] = {
        ...currentDesign,
        backgroundImage: event.target?.result as string
      };
      setDesigns(updatedDesigns);
    };
    reader.readAsDataURL(file);
  };
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const logoHeightMM = 300;
        const logoWidthMM = logoHeightMM * aspectRatio;
        
        const centerX = (currentDesign.widthMM - logoWidthMM) / 2;
        const centerY = (currentDesign.heightMM - logoHeightMM) / 2;
        
        const updatedDesigns = [...designs];
        updatedDesigns[currentWallIndex] = {
          ...currentDesign,
          logo: {
            x: centerX,
            y: centerY,
            width: logoWidthMM,
            height: logoHeightMM,
            scale: 1,
            imageData: event.target?.result as string
          }
        };
        setDesigns(updatedDesigns);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };
  
  // PDF-generering med skärstreck
  const generateWallPDF = async (design: WallDesign): Promise<Blob> => {
    const pdfWidth = (design.widthMM + 2 * FOREX_BLEED) / 25.4 * 72;
    const pdfHeight = (design.heightMM + 2 * FOREX_BLEED) / 25.4 * 72;
    
    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'pt',
      format: [pdfWidth, pdfHeight]
    });
    
    // Bakgrundsfärg: försök CMYK först, annars fallback till backgroundColorRGB (hex)
    const cmykMatch = (design.backgroundColor || '').match(/C:(\d+)\s+M:(\d+)\s+Y:(\d+)\s+K:(\d+)/);
    if (cmykMatch) {
      const [, c, m, y, k] = cmykMatch.map(Number);
      pdf.setFillColor(c, m, y, k);
      pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
    } else if (design.backgroundColorRGB) {
      const rgb = parseHexToRgb(design.backgroundColorRGB);
      if (rgb) {
        pdf.setFillColor(...rgb);
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
      }
    }
    
    // Bakgrundsbild
    if (design.backgroundImage) {
      try {
        const bleedPt = (FOREX_BLEED / 25.4) * 72;
        pdf.addImage(
          design.backgroundImage,
          'JPEG',
          bleedPt,
          bleedPt,
          (design.widthMM / 25.4) * 72,
          (design.heightMM / 25.4) * 72,
          undefined,
          'FAST'
        );
      } catch (error) {
        console.error('Kunde inte lägga till bakgrundsbild:', error);
      }
    }
    
    // Logotyp
    if (design.logo) {
      try {
        const logoX = ((design.logo.x + FOREX_BLEED) / 25.4) * 72;
        const logoY = ((design.logo.y + FOREX_BLEED) / 25.4) * 72;
        const logoW = (design.logo.width / 25.4) * 72;
        const logoH = (design.logo.height / 25.4) * 72;
        
        pdf.addImage(
          design.logo.imageData,
          'PNG',
          logoX,
          logoY,
          logoW,
          logoH,
          undefined,
          'FAST'
        );
      } catch (error) {
        console.error('Kunde inte lägga till logotyp:', error);
      }
    }
    
    // Rita skärstreck (röda streckade linjer vid ramgränser)
    pdf.setDrawColor(255, 0, 0);
    // @ts-ignore - setLineDash finns i jsPDF men TypeScript känner inte till den
    pdf.setLineDash([5, 3], 0);
    pdf.setLineWidth(0.5);
    
    const bleedPt = (FOREX_BLEED / 25.4) * 72;
    
    // Vertikala skärstreck (mellan ramar)
    let xPos = 0;
    design.frames.filter(f => f.row === 0).forEach((frame, index) => {
      if (index > 0) {
        const lineX = bleedPt + (xPos / 25.4) * 72;
        pdf.line(lineX, 0, lineX, pdfHeight);
      }
      xPos += frame.width;
    });
    
    // Horisontellt skärstreck (om det finns två rader)
    const hasTopRow = design.frames.some(f => f.row === 1);
    if (hasTopRow) {
      const rowHeight = design.frames.find(f => f.row === 0)?.height || STANDARD_HEIGHT_2_5M;
      const lineY = bleedPt + (rowHeight / 25.4) * 72;
      pdf.line(0, lineY, pdfWidth, lineY);
    }
    
    // Metadata
    // @ts-ignore - setLineDash finns i jsPDF men TypeScript känner inte till den
    pdf.setLineDash([], 0);
    pdf.setDrawColor(0, 0, 0);
    pdf.setFontSize(8);
    pdf.setTextColor(100);
    pdf.text(`${design.wallLabel}`, 10, pdfHeight - 10);
    pdf.text(`Storlek: ${design.widthMM}mm × ${design.heightMM}mm`, 10, pdfHeight - 20);
    pdf.text(`Bleed: ${FOREX_BLEED}mm`, 10, pdfHeight - 30);
    pdf.text(`Ramar: ${design.frames.filter(f => f.width === FULL_FRAME_WIDTH).length}×992mm + ${design.frames.filter(f => f.width === HALF_FRAME_WIDTH).length}×496mm`, 10, pdfHeight - 40);
    pdf.text(`Material: Forex`, 10, pdfHeight - 50);
    
    return pdf.output('blob');
  };
  
  const handleGeneratePDFs = async () => {
    setIsGenerating(true);
    
    try {
      for (const design of designs) {
        const pdfBlob = await generateWallPDF(design);
        const fileName = `FOREX_${design.wallLabel.replace(' ', '_')}_${design.widthMM}x${design.heightMM}mm.pdf`;
        // Spara i adminpanelen
        try {
          const { OrderManager } = await import('./OrderManager');
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
  
  // Preview canvas mouse handlers
  const handlePreviewMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentDesign.logo) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = 400 / currentDesign.widthMM;
    const clickX = (e.clientX - rect.left) / scale;
    const clickY = (e.clientY - rect.top) / scale;
    
    const logo = currentDesign.logo;
    const handleSize = 10 / scale;
    
    // Check resize handles
    const handles = [
      { name: 'nw', x: logo.x, y: logo.y },
      { name: 'ne', x: logo.x + logo.width, y: logo.y },
      { name: 'sw', x: logo.x, y: logo.y + logo.height },
      { name: 'se', x: logo.x + logo.width, y: logo.y + logo.height },
      { name: 'n', x: logo.x + logo.width / 2, y: logo.y },
      { name: 's', x: logo.x + logo.width / 2, y: logo.y + logo.height },
      { name: 'w', x: logo.x, y: logo.y + logo.height / 2 },
      { name: 'e', x: logo.x + logo.width, y: logo.y + logo.height / 2 }
    ];
    
    for (const handle of handles) {
      if (Math.abs(clickX - handle.x) < handleSize && Math.abs(clickY - handle.y) < handleSize) {
        setIsResizingLogo(true);
        setResizeHandle(handle.name);
        setDragStart({ x: clickX, y: clickY });
        return;
      }
    }
    
    // Check if clicking inside logo
    if (clickX >= logo.x && clickX <= logo.x + logo.width &&
        clickY >= logo.y && clickY <= logo.y + logo.height) {
      setIsDraggingLogo(true);
      setDragStart({ x: clickX - logo.x, y: clickY - logo.y });
    }
  };
  
  const handlePreviewMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentDesign.logo || (!isDraggingLogo && !isResizingLogo)) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = 400 / currentDesign.widthMM;
    const mouseX = (e.clientX - rect.left) / scale;
    const mouseY = (e.clientY - rect.top) / scale;
    
    const updatedDesigns = [...designs];
    const logo = { ...currentDesign.logo };
    
    if (isDraggingLogo && dragStart) {
      logo.x = Math.max(0, Math.min(currentDesign.widthMM - logo.width, mouseX - dragStart.x));
      logo.y = Math.max(0, Math.min(currentDesign.heightMM - logo.height, mouseY - dragStart.y));
    } else if (isResizingLogo && dragStart && resizeHandle) {
      const aspectRatio = logo.width / logo.height;
      const shiftKey = e.shiftKey;
      
      let newWidth = logo.width;
      let newHeight = logo.height;
      let newX = logo.x;
      let newY = logo.y;
      
      if (resizeHandle.includes('e')) {
        newWidth = Math.max(50, mouseX - logo.x);
      } else if (resizeHandle.includes('w')) {
        const oldRight = logo.x + logo.width;
        newX = Math.min(mouseX, oldRight - 50);
        newWidth = oldRight - newX;
      }
      
      if (resizeHandle.includes('s')) {
        newHeight = Math.max(50, mouseY - logo.y);
      } else if (resizeHandle.includes('n')) {
        const oldBottom = logo.y + logo.height;
        newY = Math.min(mouseY, oldBottom - 50);
        newHeight = oldBottom - newY;
      }
      
      if (shiftKey) {
        if (resizeHandle.includes('e') || resizeHandle.includes('w')) {
          newHeight = newWidth / aspectRatio;
        } else {
          newWidth = newHeight * aspectRatio;
        }
      }
      
      logo.width = Math.min(newWidth, currentDesign.widthMM - newX);
      logo.height = Math.min(newHeight, currentDesign.heightMM - newY);
      logo.x = newX;
      logo.y = newY;
    }
    
    updatedDesigns[currentWallIndex] = { ...currentDesign, logo };
    setDesigns(updatedDesigns);
  };
  
  const handlePreviewMouseUp = () => {
    setIsDraggingLogo(false);
    setIsResizingLogo(false);
    setResizeHandle(null);
    setDragStart(null);
  };
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: 20
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        maxWidth: 1400,
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        padding: 32
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24
        }}>
          <div>
            <h2 style={{ margin: 0, marginBottom: 8 }}>🖼️ Forex Tryckfiler</h2>
            <p style={{ color: '#666', fontSize: 14, margin: 0 }}>
              Skapa tryckklara filer för Forex-skyltar. 3mm bleed, automatisk ramindelning.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 32,
              cursor: 'pointer',
              color: '#666',
              padding: 0
            }}
          >
            ×
          </button>
        </div>
        
        {/* Väggflikar */}
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
                backgroundColor: currentWallIndex === index ? '#FF9800' : '#f0f0f0',
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
          backgroundColor: '#fff3e0',
          padding: 16,
          borderRadius: 8,
          marginBottom: 24,
          border: '1px solid #ffb74d'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 16 }}>
            {currentDesign.wallLabel} - {currentDesign.widthMeters}m × {currentDesign.heightMeters}m
          </h3>
          <p style={{ margin: '0 0 8px 0', fontSize: 14, color: '#666' }}>
            <strong>Exakt storlek:</strong> {currentDesign.widthMM}mm × {currentDesign.heightMM}mm
          </p>
          <p style={{ margin: 0, fontSize: 14, color: '#666' }}>
            <strong>Ramar:</strong> {currentDesign.frames.length} st 
            ({currentDesign.frames.filter(f => f.width === FULL_FRAME_WIDTH).length} helramar à 992mm, 
            {currentDesign.frames.filter(f => f.width === HALF_FRAME_WIDTH).length} halvramar à 496mm)
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 32 }}>
          {/* Vänster sida - Kontroller */}
          <div>
            {/* Bakgrundsbild */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                🖼️ Ladda upp bild (bakgrund):
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
            
            {/* Logotyp */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                📷 Ladda upp logotyp:
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
                    fontStyle: 'italic'
                  }}>
                    💡 Dra logotypen i förhandsgranskningen för att placera den
                  </div>
                </>
              )}
            </div>
            
            {/* Bakgrundsfärg */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
                🎨 Bakgrundsfärg:
              </label>
              
              {/* Color picker */}
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
                      const r = parseInt(hexColor.slice(1, 3), 16);
                      const g = parseInt(hexColor.slice(3, 5), 16);
                      const b = parseInt(hexColor.slice(5, 7), 16);
                      
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
              
              {/* Preset colors */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handleColorChange(preset.cmyk, preset.hex)}
                    style={{
                      padding: '12px 8px',
                      backgroundColor: preset.hex,
                      border: currentDesign.backgroundColorRGB === preset.hex ? '3px solid #FF9800' : '2px solid #ddd',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 600,
                      color: preset.hex === '#FFFFFF' ? '#333' : '#fff',
                      textShadow: preset.hex === '#FFFFFF' ? 'none' : '0 1px 2px rgba(0,0,0,0.3)'
                    }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Höger sida - Preview */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
              👁️ Förhandsgranskning:
            </label>
            <div
              onMouseDown={handlePreviewMouseDown}
              onMouseMove={handlePreviewMouseMove}
              onMouseUp={handlePreviewMouseUp}
              onMouseLeave={handlePreviewMouseUp}
              style={{
                width: 400,
                height: 400 * (currentDesign.heightMM / currentDesign.widthMM),
                maxHeight: 500,
                backgroundColor: currentDesign.backgroundColorRGB,
                border: '2px solid #ddd',
                borderRadius: 8,
                position: 'relative',
                overflow: 'hidden',
                cursor: isDraggingLogo || isResizingLogo ? 'move' : 'default',
                backgroundImage: currentDesign.backgroundImage ? `url(${currentDesign.backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Rita skärstreck i preview */}
              {(() => {
                const scale = 400 / currentDesign.widthMM;
                
                // Vertikala linjer
                let xPos = 0;
                const verticalLines = currentDesign.frames.filter(f => f.row === 0).map((frame, index) => {
                  if (index === 0) {
                    xPos += frame.width;
                    return null;
                  }
                  const lineX = xPos * scale;
                  xPos += frame.width;
                  return (
                    <div
                      key={`v-${index}`}
                      style={{
                        position: 'absolute',
                        left: lineX,
                        top: 0,
                        bottom: 0,
                        width: 2,
                        backgroundColor: 'rgba(255,0,0,0.5)',
                        borderLeft: '1px dashed red'
                      }}
                    />
                  );
                });
                
                // Horisontell linje
                const hasTopRow = currentDesign.frames.some(f => f.row === 1);
                const horizontalLine = hasTopRow ? (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: (currentDesign.frames.find(f => f.row === 0)?.height || 0) * scale,
                      height: 2,
                      backgroundColor: 'rgba(255,0,0,0.5)',
                      borderTop: '1px dashed red'
                    }}
                  />
                ) : null;
                
                return (
                  <>
                    {verticalLines}
                    {horizontalLine}
                  </>
                );
              })()}
              
              {/* Logotyp */}
              {currentDesign.logo && (() => {
                const scale = 400 / currentDesign.widthMM;
                const logoStyle = {
                  position: 'absolute' as const,
                  left: currentDesign.logo.x * scale,
                  top: currentDesign.logo.y * scale,
                  width: currentDesign.logo.width * scale,
                  height: currentDesign.logo.height * scale,
                  cursor: 'move',
                  border: '2px solid #FF9800',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                };
                
                return (
                  <div style={logoStyle}>
                    <img
                      src={currentDesign.logo.imageData}
                      alt="Logo"
                      style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                      draggable={false}
                    />
                    {/* Resize handles */}
                    {['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'].map((handle) => (
                      <div
                        key={handle}
                        style={{
                          position: 'absolute',
                          width: 10,
                          height: 10,
                          backgroundColor: '#FF9800',
                          border: '2px solid #fff',
                          borderRadius: '50%',
                          ...(handle === 'nw' && { top: -5, left: -5, cursor: 'nw-resize' }),
                          ...(handle === 'ne' && { top: -5, right: -5, cursor: 'ne-resize' }),
                          ...(handle === 'sw' && { bottom: -5, left: -5, cursor: 'sw-resize' }),
                          ...(handle === 'se' && { bottom: -5, right: -5, cursor: 'se-resize' }),
                          ...(handle === 'n' && { top: -5, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' }),
                          ...(handle === 's' && { bottom: -5, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' }),
                          ...(handle === 'w' && { left: -5, top: '50%', transform: 'translateY(-50%)', cursor: 'w-resize' }),
                          ...(handle === 'e' && { right: -5, top: '50%', transform: 'translateY(-50%)', cursor: 'e-resize' })
                        }}
                      />
                    ))}
                  </div>
                );
              })()}
              
              {!currentDesign.backgroundImage && !currentDesign.logo && (
                <div style={{
                  color: '#999',
                  fontSize: 14,
                  textAlign: 'center',
                  padding: 20,
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🖼️</div>
                  <div>Ladda upp bild eller logotyp</div>
                </div>
              )}
            </div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 8, textAlign: 'center' }}>
              💡 Röda linjer visar skärstreck mellan ramar
            </div>
          </div>
        </div>
        
        {/* Knappar */}
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'space-between',
          marginTop: 32,
          paddingTop: 24,
          borderTop: '1px solid #e0e0e0'
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
            <button
              onClick={() => {
                onApplyDesigns(designs);
                alert('✅ Designen har applicerats på väggen!\n\nDu kan nu:\n• Stänga detta fönster för att se designen på montern\n• Eller fortsätta redigera och applicera igen');
              }}
              disabled={isGenerating}
              style={{
                padding: '12px 24px',
                backgroundColor: isGenerating ? '#ccc' : '#FF9800',
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
            
            <button
              onClick={handleGeneratePDFs}
              disabled={isGenerating}
              style={{
                padding: '12px 24px',
                backgroundColor: isGenerating ? '#ccc' : '#FF9800',
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
