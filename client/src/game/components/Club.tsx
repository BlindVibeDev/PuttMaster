import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameState } from '../hooks/useGameState';

// Club types with different properties
const CLUB_TYPES = [
  { 
    name: 'Putter',
    powerMultiplier: 1.0,
    color: '#888888',
    size: [0.05, 0.05, 0.5], // handle dimensions
    headSize: [0.15, 0.07, 0.1], // club head dimensions
    headColor: '#444444'
  },
  { 
    name: 'Wedge',
    powerMultiplier: 1.2,
    color: '#777777',
    size: [0.05, 0.05, 0.5],
    headSize: [0.18, 0.07, 0.12],
    headColor: '#555555'
  },
  { 
    name: 'Driver',
    powerMultiplier: 1.5,
    color: '#666666',
    size: [0.05, 0.05, 0.55],
    headSize: [0.2, 0.08, 0.14],
    headColor: '#333333'
  },
  { 
    name: 'Hybrid',
    powerMultiplier: 1.3,
    color: '#999999',
    size: [0.05, 0.05, 0.52],
    headSize: [0.19, 0.075, 0.13],
    headColor: '#444444'
  }
];

interface ClubProps {
  clubType?: number;
  ballPosition: [number, number, number];
  isCurrentPlayer: boolean;
  isSwinging: boolean;
}

export default function Club({ 
  clubType = 0, 
  ballPosition, 
  isCurrentPlayer,
  isSwinging 
}: ClubProps) {
  const handleRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const swingProgressRef = useRef(0);
  
  const { shotAngle } = useGameState(state => ({
    shotAngle: state.shotAngle
  }));
  
  const club = CLUB_TYPES[clubType % CLUB_TYPES.length];
  
  // Update position and rotation based on ball position and shot angle
  useEffect(() => {
    if (groupRef.current && isCurrentPlayer) {
      // Position slightly behind the ball based on angle
      const radians = shotAngle * (Math.PI / 180);
      const offsetX = -Math.cos(radians) * 0.3;
      const offsetZ = -Math.sin(radians) * 0.3;
      
      // Update position
      groupRef.current.position.set(
        ballPosition[0] + offsetX,
        ballPosition[1],
        ballPosition[2] + offsetZ
      );
      
      // Update rotation
      groupRef.current.rotation.y = radians;
    }
  }, [ballPosition, shotAngle, isCurrentPlayer]);
  
  // Handle swing animation
  useFrame((_, delta) => {
    if (!groupRef.current || !isCurrentPlayer) return;
    
    if (isSwinging) {
      // Progress swing animation
      swingProgressRef.current += delta * 5; // Controls swing speed
      
      // Clamp to 0-1
      if (swingProgressRef.current > 1) {
        swingProgressRef.current = 1;
      }
      
      // Calculate club rotation for backswing and follow-through
      const swingPhase = swingProgressRef.current;
      let swingAngle;
      
      if (swingPhase < 0.5) {
        // Backswing: 0 to -PI/2 (90 degrees back)
        swingAngle = -(swingPhase * 2) * Math.PI / 2;
      } else {
        // Follow through: -PI/2 to PI/3 (60 degrees forward)
        const forwardProgress = (swingPhase - 0.5) * 2;
        swingAngle = -Math.PI/2 + forwardProgress * (Math.PI/2 + Math.PI/3);
      }
      
      // Apply rotation to the club group
      groupRef.current.rotation.x = swingAngle;
    } else {
      // Reset swing progress when not swinging
      swingProgressRef.current = 0;
      
      // Smoothly return to base position
      if (groupRef.current.rotation.x !== 0) {
        groupRef.current.rotation.x *= 0.9;
        if (Math.abs(groupRef.current.rotation.x) < 0.01) {
          groupRef.current.rotation.x = 0;
        }
      }
    }
  });
  
  // Only render for current player
  if (!isCurrentPlayer) return null;
  
  return (
    <group ref={groupRef} position={[ballPosition[0], ballPosition[1], ballPosition[2]]}>
      {/* Club handle */}
      <mesh ref={handleRef} position={[0, 0.25, 0]}>
        <boxGeometry args={club.size} />
        <meshStandardMaterial color={club.color} metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Club head */}
      <mesh 
        ref={headRef} 
        position={[0, club.size[2] / 2, 0]} 
        rotation={[Math.PI / 2, 0, 0]}
      >
        <boxGeometry args={club.headSize} />
        <meshStandardMaterial color={club.headColor} metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}
