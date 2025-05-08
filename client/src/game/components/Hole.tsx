import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface HoleProps {
  position: [number, number, number];
  number: number;
}

export default function Hole({ position, number }: HoleProps) {
  const flagRef = useRef<THREE.Group>(null);
  const flagClothRef = useRef<THREE.Mesh>(null);
  
  // Animate flag slightly
  useFrame((_, delta) => {
    if (flagClothRef.current) {
      // Subtle wave effect for the flag
      const time = Date.now() * 0.001;
      const vertices = (flagClothRef.current.geometry as THREE.BufferGeometry).attributes.position;
      
      for (let i = 0; i < vertices.count; i++) {
        const x = vertices.getX(i);
        if (x > 0) { // Only affect the flag part, not the pole attachment
          const wave = 0.1 * Math.sin(time * 5 + x * 5);
          vertices.setY(i, wave);
        }
      }
      
      vertices.needsUpdate = true;
    }
  });
  
  return (
    <group position={position}>
      {/* Hole (depression in the ground) */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.15, 32]} />
        <meshStandardMaterial color="#111111" roughness={1} metalness={0} />
      </mesh>
      
      {/* Hole cup (white ring) */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.14, 0.16, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} metalness={0.2} />
      </mesh>
      
      {/* Flag */}
      <group ref={flagRef} position={[0, 0, 0]}>
        {/* Flag pole */}
        <mesh position={[0, 0.75, 0]} castShadow>
          <cylinderGeometry args={[0.01, 0.01, 1.5, 8]} />
          <meshStandardMaterial color="#cccccc" metalness={0.5} roughness={0.2} />
        </mesh>
        
        {/* Flag cloth */}
        <mesh ref={flagClothRef} position={[0.2, 1.3, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <planeGeometry args={[0.4, 0.3, 6, 6]} />
          <meshStandardMaterial 
            color={getColorForHole(number)} 
            side={THREE.DoubleSide}
            roughness={0.8}
          />
        </mesh>
        
        {/* Hole number */}
        <mesh position={[0.2, 1.3, 0.001]} rotation={[0, Math.PI / 2, 0]}>
          <textGeometry args={[number.toString(), { fontSize: 0.15, height: 0.01 }]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>
    </group>
  );
}

// Helper to get color based on hole number
function getColorForHole(number: number): string {
  const colors = [
    '#ff5555', // Red
    '#55ff55', // Green
    '#5555ff', // Blue
    '#ffff55', // Yellow
    '#ff55ff', // Magenta
    '#55ffff', // Cyan
    '#ff8855', // Orange
    '#8855ff', // Purple
    '#55ff88'  // Mint
  ];
  
  return colors[(number - 1) % colors.length];
}
