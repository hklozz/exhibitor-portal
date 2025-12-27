import { Edges } from '@react-three/drei';

// Hyllor på vägg
export function WallShelf({ position, rotation, width = 1.0 }: { 
  position: [number, number, number],
  rotation?: [number, number, number],
  width?: number
}) {
  const shelfDepth = 0.25;
  const shelfThickness = 0.03;
  const bracketWidth = 0.08;
  const bracketDepth = 0.15;

  return (
    <group position={position} rotation={rotation || [0, 0, 0]}>
      {/* Hyllplan */}
      <mesh position={[0, 0, shelfDepth/2]}>
        <boxGeometry args={[width, shelfThickness, shelfDepth]} />
        <meshPhysicalMaterial 
          color="#f0f0f0" 
          roughness={0.2} 
          metalness={0.1}
        />
        <Edges color="#ddd" />
      </mesh>
      
      {/* Vänster fäste */}
      <mesh position={[-width/2 + bracketWidth/2, -0.05, bracketDepth/2]}>
        <boxGeometry args={[bracketWidth, 0.1, bracketDepth]} />
        <meshPhysicalMaterial 
          color="#c0c0c0" 
          roughness={0.3} 
          metalness={0.7}
        />
      </mesh>
      
      {/* Höger fäste */}
      <mesh position={[width/2 - bracketWidth/2, -0.05, bracketDepth/2]}>
        <boxGeometry args={[bracketWidth, 0.1, bracketDepth]} />
        <meshPhysicalMaterial 
          color="#c0c0c0" 
          roughness={0.3} 
          metalness={0.7}
        />
      </mesh>
    </group>
  );
}

// Klädhängare
export function ClothingRack({ position, rotation, height = 1.8 }: {
  position: [number, number, number],
  rotation?: [number, number, number],
  height?: number
}) {
  const baseWidth = 0.6;
  const baseDepth = 0.4;
  const poleRadius = 0.02;
  const rodLength = 0.5;
  
  return (
    <group position={position} rotation={rotation || [0, 0, 0]}>
      {/* Bas */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[baseWidth, 0.1, baseDepth]} />
        <meshPhysicalMaterial 
          color="#333" 
          roughness={0.2} 
          metalness={0.8}
        />
      </mesh>
      
      {/* Vertikal stång */}
      <mesh position={[0, height/2, 0]}>
        <cylinderGeometry args={[poleRadius, poleRadius, height, 12]} />
        <meshPhysicalMaterial 
          color="#888" 
          roughness={0.1} 
          metalness={0.9}
        />
      </mesh>
      
      {/* Hängstång */}
      <mesh position={[0, height - 0.3, rodLength/2]}>
        <cylinderGeometry args={[poleRadius * 0.8, poleRadius * 0.8, rodLength, 12]} />
        <meshPhysicalMaterial 
          color="#888" 
          roughness={0.1} 
          metalness={0.9}
        />
      </mesh>
      
      {/* Kläder på galgar */}
      <mesh position={[-0.15, height - 0.35, rodLength/2]}>
        <boxGeometry args={[0.05, 0.4, 0.02]} />
        <meshStandardMaterial color="#1a472a" />
      </mesh>
      
      <mesh position={[0, height - 0.35, rodLength/2]}>
        <boxGeometry args={[0.05, 0.35, 0.02]} />
        <meshStandardMaterial color="#2c5aa0" />
      </mesh>
      
      <mesh position={[0.1, height - 0.35, rodLength/2]}>
        <boxGeometry args={[0.05, 0.38, 0.02]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
    </group>
  );
}

// Eluttag/elkonsol
export function PowerOutlet({ position, rotation }: {
  position: [number, number, number],
  rotation?: [number, number, number]
}) {
  return (
    <group position={position} rotation={rotation || [0, 0, 0]}>
      {/* Elkonsol */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[0.3, 0.15, 0.04]} />
        <meshPhysicalMaterial 
          color="#f0f0f0" 
          roughness={0.1} 
          metalness={0.1}
        />
        <Edges color="#ccc" />
      </mesh>
      
      {/* Uttag 1 */}
      <mesh position={[-0.08, 0, 0.045]}>
        <boxGeometry args={[0.08, 0.08, 0.01]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      
      {/* Uttag 2 */}
      <mesh position={[0.08, 0, 0.045]}>
        <boxGeometry args={[0.08, 0.08, 0.01]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      
      {/* Hål i uttagen */}
      <mesh position={[-0.08, 0.02, 0.05]}>
        <cylinderGeometry args={[0.008, 0.008, 0.02, 8]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[-0.08, -0.02, 0.05]}>
        <cylinderGeometry args={[0.008, 0.008, 0.02, 8]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      
      <mesh position={[0.08, 0.02, 0.05]}>
        <cylinderGeometry args={[0.008, 0.008, 0.02, 8]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0.08, -0.02, 0.05]}>
        <cylinderGeometry args={[0.008, 0.008, 0.02, 8]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      
      {/* LED-indikator */}
      <mesh position={[0, -0.05, 0.048]}>
        <cylinderGeometry args={[0.004, 0.004, 0.008, 6]} />
        <meshStandardMaterial 
          color="#00ff00" 
          emissive="#004400"
        />
      </mesh>
    </group>
  );
}

// Högtalare
export function Speaker({ position, rotation, size = 'medium' }: {
  position: [number, number, number],
  rotation?: [number, number, number],
  size?: 'small' | 'medium' | 'large'
}) {
  const sizeMultiplier = size === 'small' ? 0.7 : size === 'large' ? 1.4 : 1.0;
  const speakerWidth = 0.25 * sizeMultiplier;
  const speakerHeight = 0.4 * sizeMultiplier;
  const speakerDepth = 0.18 * sizeMultiplier;
  
  return (
    <group position={position} rotation={rotation || [0, 0, 0]}>
      {/* Högtalarkåpa */}
      <mesh position={[0, 0, speakerDepth/2]}>
        <boxGeometry args={[speakerWidth, speakerHeight, speakerDepth]} />
        <meshPhysicalMaterial 
          color="#1a1a1a" 
          roughness={0.3} 
          metalness={0.1}
        />
        <Edges color="#333" />
      </mesh>
      
      {/* Woofer (stor högtalare) */}
      <mesh position={[0, -0.08 * sizeMultiplier, speakerDepth + 0.01]}>
        <cylinderGeometry args={[0.08 * sizeMultiplier, 0.08 * sizeMultiplier, 0.02, 16]} />
        <meshPhysicalMaterial 
          color="#333" 
          roughness={0.8}
        />
      </mesh>
      
      {/* Tweeter (liten högtalare) */}
      <mesh position={[0, 0.08 * sizeMultiplier, speakerDepth + 0.005]}>
        <cylinderGeometry args={[0.025 * sizeMultiplier, 0.025 * sizeMultiplier, 0.015, 12]} />
        <meshPhysicalMaterial 
          color="#444" 
          roughness={0.6}
        />
      </mesh>
      
      {/* Bass-reflex port */}
      <mesh position={[0, -0.15 * sizeMultiplier, speakerDepth + 0.005]}>
        <cylinderGeometry args={[0.02 * sizeMultiplier, 0.02 * sizeMultiplier, 0.01, 12]} />
        <meshPhysicalMaterial 
          color="#000" 
          roughness={1.0}
        />
      </mesh>
      
      {/* Logo/märke */}
      <mesh position={[0, 0.15 * sizeMultiplier, speakerDepth + 0.002]}>
        <boxGeometry args={[0.08 * sizeMultiplier, 0.02 * sizeMultiplier, 0.001]} />
        <meshStandardMaterial color="#888" />
      </mesh>
    </group>
  );
}

// Högtalare på stativ
export function SpeakerOnStand({ position, rotation, size = 'medium' }: {
  position: [number, number, number],
  rotation?: [number, number, number],
  size?: 'small' | 'medium' | 'large'
}) {
  const sizeMultiplier = size === 'small' ? 0.7 : size === 'large' ? 1.4 : 1.0;
  const speakerWidth = 0.25 * sizeMultiplier;
  const speakerHeight = 0.4 * sizeMultiplier;
  const speakerDepth = 0.18 * sizeMultiplier;
  const standHeight = 1.2 * sizeMultiplier;
  const standPoleRadius = 0.02;
  const baseRadius = 0.15;
  
  return (
    <group position={position} rotation={rotation || [0, 0, 0]}>
      {/* Stativbas */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[baseRadius, baseRadius, 0.04, 16]} />
        <meshPhysicalMaterial 
          color="#333" 
          roughness={0.2} 
          metalness={0.8}
        />
      </mesh>
      
      {/* Stativstång */}
      <mesh position={[0, standHeight/2, 0]}>
        <cylinderGeometry args={[standPoleRadius, standPoleRadius, standHeight, 12]} />
        <meshPhysicalMaterial 
          color="#666" 
          roughness={0.1} 
          metalness={0.9}
        />
      </mesh>
      
      {/* Högtalare placerad på stativet */}
      <group position={[0, standHeight, 0]}>
        {/* Högtalarkåpa */}
        <mesh position={[0, speakerHeight/2, 0]}>
          <boxGeometry args={[speakerWidth, speakerHeight, speakerDepth]} />
          <meshPhysicalMaterial 
            color="#1a1a1a" 
            roughness={0.3} 
            metalness={0.1}
          />
          <Edges color="#333" />
        </mesh>
        
        {/* Woofer (stor högtalare) */}
        <mesh position={[0, speakerHeight/2 - 0.08 * sizeMultiplier, speakerDepth/2 + 0.01]}>
          <cylinderGeometry args={[0.08 * sizeMultiplier, 0.08 * sizeMultiplier, 0.02, 16]} />
          <meshPhysicalMaterial 
            color="#333" 
            roughness={0.8}
          />
        </mesh>
        
        {/* Tweeter (liten högtalare) */}
        <mesh position={[0, speakerHeight/2 + 0.08 * sizeMultiplier, speakerDepth/2 + 0.005]}>
          <cylinderGeometry args={[0.025 * sizeMultiplier, 0.025 * sizeMultiplier, 0.015, 12]} />
          <meshPhysicalMaterial 
            color="#444" 
            roughness={0.6}
          />
        </mesh>
        
        {/* Bass-reflex port */}
        <mesh position={[0, speakerHeight/2 - 0.15 * sizeMultiplier, speakerDepth/2 + 0.005]}>
          <cylinderGeometry args={[0.02 * sizeMultiplier, 0.02 * sizeMultiplier, 0.01, 12]} />
          <meshPhysicalMaterial 
            color="#000" 
            roughness={1.0}
          />
        </mesh>
        
        {/* Logo/märke */}
        <mesh position={[0, speakerHeight/2 + 0.15 * sizeMultiplier, speakerDepth/2 + 0.002]}>
          <boxGeometry args={[0.08 * sizeMultiplier, 0.02 * sizeMultiplier, 0.001]} />
          <meshStandardMaterial color="#888" />
        </mesh>
      </group>
    </group>
  );
}