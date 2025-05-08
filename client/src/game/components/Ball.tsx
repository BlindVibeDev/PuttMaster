import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import { useGameState } from '../hooks/useGameState';
import { useAudio } from '@/lib/stores/useAudio';

const BALL_RADIUS = 0.1;
const FRICTION = 0.95;
const STOP_THRESHOLD = 0.01;

// Ball designs/colors
const BALL_DESIGNS = [
  { color: '#ffffff', emissive: '#111111', metalness: 0.2, roughness: 0.1 },  // Standard white
  { color: '#ff5555', emissive: '#220000', metalness: 0.3, roughness: 0.1 },  // Red
  { color: '#5555ff', emissive: '#000022', metalness: 0.3, roughness: 0.1 },  // Blue
  { color: '#55ff55', emissive: '#002200', metalness: 0.3, roughness: 0.1 },  // Green
  { color: '#ffff55', emissive: '#222200', metalness: 0.3, roughness: 0.1 },  // Yellow
  { color: '#ff55ff', emissive: '#220022', metalness: 0.3, roughness: 0.1 },  // Pink
];

interface BallProps {
  playerId: number;
  initialPosition: [number, number, number];
  isCurrentPlayer: boolean;
  designIndex?: number;
  onBallStop?: () => void;
  onBallInHole?: () => void;
}

export default function Ball({ 
  playerId, 
  initialPosition, 
  isCurrentPlayer, 
  designIndex = 0, 
  onBallStop,
  onBallInHole
}: BallProps) {
  const ballRef = useRef<THREE.Mesh>(null);
  const velocityRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const isMovingRef = useRef<boolean>(false);
  const design = BALL_DESIGNS[designIndex % BALL_DESIGNS.length];
  
  const { 
    shotPower, 
    shotAngle, 
    ball_positions, 
    updateBallPosition,
    currentHole,
    holes
  } = useGameState(state => ({
    shotPower: state.shotPower,
    shotAngle: state.shotAngle,
    ball_positions: state.ball_positions,
    updateBallPosition: state.updateBallPosition,
    currentHole: state.currentHole,
    holes: state.holes
  }));
  
  // Update position from game state if needed (multiplayer sync)
  useEffect(() => {
    if (ball_positions[playerId] && !isMovingRef.current && ballRef.current) {
      const [x, y, z] = ball_positions[playerId];
      ballRef.current.position.set(x, y, z);
    }
  }, [ball_positions, playerId]);
  
  // Initialize ball position
  useEffect(() => {
    if (ballRef.current) {
      const [x, y, z] = initialPosition;
      ballRef.current.position.set(x, y, z);
      updateBallPosition(playerId, [x, y, z]);
    }
  }, [initialPosition, playerId, updateBallPosition]);
  
  // Handle swing/shot
  useEffect(() => {
    if (isCurrentPlayer && shotPower > 0 && !isMovingRef.current && ballRef.current) {
      // Calculate direction vector based on angle
      const radians = shotAngle * (Math.PI / 180);
      const directionX = Math.cos(radians);
      const directionZ = Math.sin(radians);
      
      // Set velocity based on power and direction
      const power = shotPower * 0.05; // Adjust strength factor
      velocityRef.current.set(directionX * power, 0, directionZ * power);
      isMovingRef.current = true;
      
      // Play hit sound
      const { playHit } = useAudio.getState();
      playHit();
    }
  }, [shotPower, shotAngle, isCurrentPlayer]);
  
  // Ball physics update
  useFrame((_, delta) => {
    if (!ballRef.current || !isMovingRef.current) return;
    
    // Get current ball position
    const ball = ballRef.current;
    
    // Apply velocity to position
    ball.position.x += velocityRef.current.x;
    ball.position.z += velocityRef.current.z;
    
    // Apply friction to slow down
    velocityRef.current.multiplyScalar(FRICTION);
    
    // Check if ball has stopped
    if (velocityRef.current.length() < STOP_THRESHOLD) {
      velocityRef.current.set(0, 0, 0);
      isMovingRef.current = false;
      
      // Update position in game state
      updateBallPosition(playerId, [
        ball.position.x,
        ball.position.y,
        ball.position.z
      ]);
      
      // Notify when ball stops
      if (onBallStop) onBallStop();
      
      // Check if ball is in hole
      if (currentHole < holes.length) {
        const hole = holes[currentHole];
        const holePosition = new THREE.Vector3(hole.position[0], 0, hole.position[2]);
        const ballPosition = new THREE.Vector3(ball.position.x, 0, ball.position.z);
        const distance = holePosition.distanceTo(ballPosition);
        
        if (distance < 0.2) { // Hole radius check
          if (onBallInHole) {
            // Play success sound
            const { playSuccess } = useAudio.getState();
            playSuccess();
            onBallInHole();
          }
        }
      }
    }
    
    // Basic collision detection with bounds
    // This will be enhanced with actual course collision in full implementation
    const MAX_BOUNDS = 10;
    if (Math.abs(ball.position.x) > MAX_BOUNDS) {
      ball.position.x = Math.sign(ball.position.x) * MAX_BOUNDS;
      velocityRef.current.x *= -0.5; // Bounce with energy loss
    }
    
    if (Math.abs(ball.position.z) > MAX_BOUNDS) {
      ball.position.z = Math.sign(ball.position.z) * MAX_BOUNDS;
      velocityRef.current.z *= -0.5; // Bounce with energy loss
    }
  });
  
  return (
    <Sphere ref={ballRef} args={[BALL_RADIUS, 32, 32]} position={initialPosition}>
      <meshStandardMaterial
        color={design.color}
        emissive={design.emissive}
        metalness={design.metalness}
        roughness={design.roughness}
      />
      {isCurrentPlayer && (
        <pointLight 
          intensity={5} 
          distance={0.5} 
          color="#ffffff" 
        />
      )}
    </Sphere>
  );
}
