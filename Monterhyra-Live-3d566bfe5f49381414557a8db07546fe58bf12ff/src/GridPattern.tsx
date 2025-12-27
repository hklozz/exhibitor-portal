import React from 'react';

// Rutmönster komponent för under mattan
export function GridPattern({ width, depth, color = "#e0e0e0" }: { 
  width: number, 
  depth: number, 
  color?: string 
}) {
  const gridSize = 0.5; // Halv meter rutor
  const gridLines: React.ReactElement[] = [];
  
  // Vertikala linjer
  for (let x = 0; x <= width; x += gridSize) {
    const posX = x - width/2;
    gridLines.push(
      <mesh key={`v-${x}`} position={[posX, 0.01, 0]}>
        <boxGeometry args={[0.005, 0.002, depth]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  }
  
  // Horisontella linjer
  for (let z = 0; z <= depth; z += gridSize) {
    const posZ = z - depth/2;
    gridLines.push(
      <mesh key={`h-${z}`} position={[0, 0.01, posZ]}>
        <boxGeometry args={[width, 0.002, 0.005]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  }
  
  return <>{gridLines}</>;
}
