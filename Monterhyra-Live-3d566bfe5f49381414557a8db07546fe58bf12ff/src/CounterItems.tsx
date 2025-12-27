interface CounterItemProps {
  position: [number, number, number];
  rotation?: number;
}

export function EspressoMachine({ position, rotation = 0 }: CounterItemProps) {
  return (
    <group position={position} rotation={[0, rotation * Math.PI / 180, 0]}>
      {/* Bas/sockel */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.35, 0.1, 0.25]} />
        <meshStandardMaterial color="#2c2c2c" roughness={0.3} metalness={0.7} />
      </mesh>
      
      {/* Huvudkropp */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.3, 0.25, 0.2]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.8} />
      </mesh>
      
      {/* Vattenreservoar baktill */}
      <mesh position={[-0.05, 0.25, -0.12]}>
        <boxGeometry args={[0.15, 0.3, 0.08]} />
        <meshStandardMaterial color="#444" roughness={0.4} metalness={0.6} />
      </mesh>
      
      {/* Kaffe-utgång/portafilter */}
      <mesh position={[0, 0.15, 0.12]}>
        <cylinderGeometry args={[0.03, 0.03, 0.08, 12]} />
        <meshStandardMaterial color="#666" roughness={0.3} metalness={0.8} />
      </mesh>
      
      {/* Ångmunstycke */}
      <mesh position={[0.1, 0.2, 0.08]}>
        <cylinderGeometry args={[0.015, 0.015, 0.12, 8]} />
        <meshStandardMaterial color="#888" roughness={0.2} metalness={0.9} />
      </mesh>
      
      {/* Kopp-plattform */}
      <mesh position={[0, 0.11, 0.08]}>
        <boxGeometry args={[0.2, 0.02, 0.15]} />
        <meshStandardMaterial color="#333" roughness={0.4} metalness={0.7} />
      </mesh>
      
      {/* Kontrollpanel */}
      <mesh position={[0, 0.28, 0.11]}>
        <boxGeometry args={[0.15, 0.08, 0.02]} />
        <meshStandardMaterial color="#111" roughness={0.1} metalness={0.3} />
      </mesh>
      
      {/* LED-indikator */}
      <mesh position={[0.04, 0.28, 0.12]}>
        <cylinderGeometry args={[0.008, 0.008, 0.01, 8]} />
        <meshStandardMaterial 
          color="#00ff00" 
          emissive="#004400" 
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}

export function FlowerVase({ position, rotation = 0 }: CounterItemProps) {
  return (
    <group position={position} rotation={[0, rotation * Math.PI / 180, 0]}>
      {/* Vas */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.06, 0.04, 0.16, 16]} />
        <meshStandardMaterial 
          color="#f8f8f8" 
          roughness={0.1} 
          metalness={0.0}
          transparent={true}
          opacity={0.9}
        />
      </mesh>
      
      {/* Vatten i vasen */}
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.055, 0.038, 0.14, 16]} />
        <meshStandardMaterial 
          color="#e6f3ff" 
          roughness={0.0} 
          metalness={0.0}
          transparent={true}
          opacity={0.3}
        />
      </mesh>
      
      {/* Blomstjälk */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.2, 8]} />
        <meshStandardMaterial color="#2d5016" roughness={0.8} metalness={0.0} />
      </mesh>
      
      {/* Blad */}
      <mesh position={[0.02, 0.18, 0]} rotation={[0, 0, Math.PI/6]}>
        <boxGeometry args={[0.04, 0.002, 0.02]} />
        <meshStandardMaterial color="#4a7c59" roughness={0.9} metalness={0.0} />
      </mesh>
      
      <mesh position={[-0.015, 0.22, 0]} rotation={[0, 0, -Math.PI/8]}>
        <boxGeometry args={[0.03, 0.002, 0.015]} />
        <meshStandardMaterial color="#4a7c59" roughness={0.9} metalness={0.0} />
      </mesh>
      
      {/* Blomma - kronblad */}
      {Array.from({length: 6}).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const x = Math.cos(angle) * 0.025;
        const z = Math.sin(angle) * 0.025;
        
        return (
          <mesh 
            key={`petal-${i}`}
            position={[x, 0.32, z]} 
            rotation={[Math.PI/4, angle, 0]}
          >
            <boxGeometry args={[0.02, 0.001, 0.04]} />
            <meshStandardMaterial color="#ff6b9d" roughness={0.6} metalness={0.0} />
          </mesh>
        );
      })}
      
      {/* Blommitten */}
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.008, 12]} />
        <meshStandardMaterial color="#ffeb3b" roughness={0.8} metalness={0.0} />
      </mesh>
    </group>
  );
}

export function CandyBowl({ position, rotation = 0 }: CounterItemProps) {
  return (
    <group position={position} rotation={[0, rotation * Math.PI / 180, 0]}>
      {/* Skål */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.08, 0.06, 0.08, 20]} />
        <meshStandardMaterial 
          color="#ffffff" 
          roughness={0.1} 
          metalness={0.0}
          transparent={true}
          opacity={0.95}
        />
      </mesh>
      
      {/* Skålens insida (lite mörkare) */}
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.075, 0.055, 0.075, 20]} />
        <meshStandardMaterial 
          color="#f5f5f5" 
          roughness={0.15} 
          metalness={0.0}
        />
      </mesh>
      
      {/* Skålens botten (inuti) */}
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.005, 20]} />
        <meshStandardMaterial 
          color="#eeeeee" 
          roughness={0.2} 
          metalness={0.0}
        />
      </mesh>
      
      {/* Liten reflektion på skålkanten */}
      <mesh position={[0, 0.077, 0]}>
        <torusGeometry args={[0.078, 0.003, 8, 20]} />
        <meshStandardMaterial 
          color="#ffffff" 
          roughness={0.0} 
          metalness={0.3}
          emissive="#ffffff"
          emissiveIntensity={0.1}
        />
      </mesh>
    </group>
  );
}
