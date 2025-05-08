import { useTexture } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import Hole from './Hole';
import { useGameState } from '../hooks/useGameState';

// Course style textures
const COURSE_STYLES = [
  { texture: 'grass.png', roughness: 0.8, color: '#88cc88' },
  { texture: 'sand.jpg', roughness: 0.9, color: '#e6d59e' },
  { texture: 'asphalt.png', roughness: 0.7, color: '#999999' },
  { texture: 'wood.jpg', roughness: 0.6, color: '#cc9966' },
  { texture: 'grass.png', roughness: 0.8, color: '#77aa77' }, // Darker grass
  { texture: 'grass.png', roughness: 0.8, color: '#99dd99' }  // Lighter grass
];

interface CourseProps {
  courseStyle?: number;
}

export default function Course({ courseStyle = 0 }: CourseProps) {
  const { currentHole, holes } = useGameState(state => ({
    currentHole: state.currentHole,
    holes: state.holes
  }));
  
  // Select course style
  const style = COURSE_STYLES[courseStyle % COURSE_STYLES.length];
  
  // Load texture
  const texture = useTexture(`/textures/${style.texture}`);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 5);
  
  // Create course geometry
  const groundRef = useRef<THREE.Mesh>(null);
  
  // Get current hole data
  const hole = holes[currentHole];
  
  // Create obstacles for current hole
  const obstacles = useMemo(() => {
    if (!hole || !hole.obstacles) return null;
    
    return hole.obstacles.map((obstacle, index) => {
      const { position, size, type } = obstacle;
      
      // Determine material based on obstacle type
      let material;
      switch (type) {
        case 'water':
          material = (
            <meshStandardMaterial 
              color="#0077ff" 
              transparent={true} 
              opacity={0.7}
              metalness={0.1}
              roughness={0.1}
            />
          );
          break;
        case 'sand':
          material = (
            <meshStandardMaterial 
              color="#e6d59e" 
              metalness={0}
              roughness={1}
            />
          );
          break;
        case 'wall':
        default:
          material = (
            <meshStandardMaterial 
              color="#555555" 
              metalness={0.2}
              roughness={0.8}
            />
          );
      }
      
      return (
        <mesh 
          key={`obstacle-${index}`} 
          position={[position[0], position[1] + size[1]/2, position[2]]} 
          receiveShadow 
          castShadow
        >
          <boxGeometry args={size} />
          {material}
        </mesh>
      );
    });
  }, [hole]);
  
  // Course boundaries
  const boundaries = useMemo(() => {
    const width = hole?.width || 20;
    const length = hole?.length || 20;
    const wallHeight = 0.5;
    const wallThickness = 0.3;
    
    return (
      <>
        {/* Left wall */}
        <mesh position={[-width/2 - wallThickness/2, wallHeight/2, 0]} receiveShadow castShadow>
          <boxGeometry args={[wallThickness, wallHeight, length]} />
          <meshStandardMaterial color="#3d2817" roughness={0.7} />
        </mesh>
        
        {/* Right wall */}
        <mesh position={[width/2 + wallThickness/2, wallHeight/2, 0]} receiveShadow castShadow>
          <boxGeometry args={[wallThickness, wallHeight, length]} />
          <meshStandardMaterial color="#3d2817" roughness={0.7} />
        </mesh>
        
        {/* Back wall */}
        <mesh position={[0, wallHeight/2, -length/2 - wallThickness/2]} receiveShadow castShadow>
          <boxGeometry args={[width + wallThickness*2, wallHeight, wallThickness]} />
          <meshStandardMaterial color="#3d2817" roughness={0.7} />
        </mesh>
        
        {/* Front wall */}
        <mesh position={[0, wallHeight/2, length/2 + wallThickness/2]} receiveShadow castShadow>
          <boxGeometry args={[width + wallThickness*2, wallHeight, wallThickness]} />
          <meshStandardMaterial color="#3d2817" roughness={0.7} />
        </mesh>
      </>
    );
  }, [hole]);
  
  return (
    <group>
      {/* Base course ground */}
      <mesh 
        ref={groundRef} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.01, 0]} 
        receiveShadow
      >
        <planeGeometry args={[hole?.width || 20, hole?.length || 20]} />
        <meshStandardMaterial 
          map={texture} 
          color={style.color}
          roughness={style.roughness}
        />
      </mesh>
      
      {/* Current hole */}
      {hole && (
        <Hole 
          position={[hole.position[0], 0, hole.position[2]]} 
          number={currentHole + 1}
        />
      )}
      
      {/* Starting position marker */}
      {hole && (
        <mesh position={[hole.start[0], 0.01, hole.start[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.3, 32]} />
          <meshStandardMaterial color="#ffffff" opacity={0.7} transparent />
        </mesh>
      )}
      
      {/* Obstacles */}
      {obstacles}
      
      {/* Course boundaries */}
      {boundaries}
    </group>
  );
}
