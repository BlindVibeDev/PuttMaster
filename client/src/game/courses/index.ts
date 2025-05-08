import * as THREE from 'three';

// Type definitions
export interface CourseObstacle {
  position: [number, number, number]; // x, y, z
  size: [number, number, number]; // width, height, depth
  type: 'wall' | 'water' | 'sand' | 'ramp';
}

export interface CourseHole {
  id: number;
  name: string;
  position: [number, number, number]; // hole position
  start: [number, number, number]; // starting position
  par: number;
  width: number; // course width
  length: number; // course length
  obstacles: CourseObstacle[];
}

// Generate 9 unique course layouts
export const COURSE_HOLES: CourseHole[] = [
  // Hole 1: Simple Starter
  {
    id: 0,
    name: "Simple Start",
    position: [0, 0, -5],
    start: [0, 0, 5],
    par: 2,
    width: 15,
    length: 15,
    obstacles: []
  },
  
  // Hole 2: Narrow Pathway
  {
    id: 1,
    name: "Narrow Path",
    position: [0, 0, -6],
    start: [0, 0, 6],
    par: 3,
    width: 15,
    length: 15,
    obstacles: [
      // Left wall of the path
      { position: [-2, 0, 0], size: [0.5, 0.5, 8], type: 'wall' },
      // Right wall of the path
      { position: [2, 0, 0], size: [0.5, 0.5, 8], type: 'wall' }
    ]
  },
  
  // Hole 3: Water Hazard
  {
    id: 2,
    name: "Water Hazard",
    position: [0, 0, -6],
    start: [0, 0, 6],
    par: 3,
    width: 15,
    length: 15,
    obstacles: [
      // Water hazard in the middle
      { position: [0, -0.1, 0], size: [6, 0.2, 3], type: 'water' },
      // Optional path around
      { position: [4, 0, 0], size: [0.5, 0.5, 10], type: 'wall' },
    ]
  },
  
  // Hole 4: Sand Traps
  {
    id: 3,
    name: "Sand Traps",
    position: [0, 0, -7],
    start: [0, 0, 7],
    par: 3,
    width: 16,
    length: 16,
    obstacles: [
      // Left sand trap
      { position: [-3, -0.1, -2], size: [3, 0.2, 2], type: 'sand' },
      // Right sand trap
      { position: [3, -0.1, -2], size: [3, 0.2, 2], type: 'sand' },
      // Back sand trap
      { position: [0, -0.1, -5], size: [5, 0.2, 2], type: 'sand' },
    ]
  },
  
  // Hole 5: Zigzag
  {
    id: 4,
    name: "Zigzag Challenge",
    position: [5, 0, -7],
    start: [-5, 0, 7],
    par: 4,
    width: 20,
    length: 20,
    obstacles: [
      // First barrier
      { position: [0, 0, 3], size: [8, 0.5, 0.5], type: 'wall' },
      // Second barrier
      { position: [0, 0, -3], size: [8, 0.5, 0.5], type: 'wall' },
    ]
  },
  
  // Hole 6: Island Hole
  {
    id: 5,
    name: "Island Hole",
    position: [0, 0, 0],
    start: [0, 0, 7],
    par: 4,
    width: 20,
    length: 20,
    obstacles: [
      // Water surrounding the hole
      { position: [0, -0.1, 0], size: [10, 0.2, 10], type: 'water' },
      // Small island in the middle (subtracted from water)
      { position: [0, -0.05, 0], size: [2, 0.3, 2], type: 'wall' },
    ]
  },
  
  // Hole 7: Maze
  {
    id: 6,
    name: "Mini Maze",
    position: [5, 0, -5],
    start: [-5, 0, 6],
    par: 5,
    width: 20,
    length: 20,
    obstacles: [
      // Horizontal walls
      { position: [0, 0, 2], size: [8, 0.5, 0.5], type: 'wall' },
      { position: [0, 0, -2], size: [8, 0.5, 0.5], type: 'wall' },
      
      // Vertical walls
      { position: [-3, 0, 0], size: [0.5, 0.5, 3], type: 'wall' },
      { position: [3, 0, 0], size: [0.5, 0.5, 3], type: 'wall' },
    ]
  },
  
  // Hole 8: Loop-de-loop
  {
    id: 7,
    name: "The Loop",
    position: [0, 0, 0],
    start: [0, 0, 7],
    par: 4,
    width: 18,
    length: 18,
    obstacles: [
      // Outer circle of walls
      { position: [4, 0, 0], size: [0.5, 0.5, 6], type: 'wall' },
      { position: [-4, 0, 0], size: [0.5, 0.5, 6], type: 'wall' },
      { position: [0, 0, -3], size: [7.5, 0.5, 0.5], type: 'wall' },
      
      // Opening to the hole
      { position: [0, 0, 3], size: [3, 0.5, 0.5], type: 'wall' },
      { position: [-3.5, 0, 3], size: [2, 0.5, 0.5], type: 'wall' },
      { position: [3.5, 0, 3], size: [2, 0.5, 0.5], type: 'wall' },
    ]
  },
  
  // Hole 9: Grand Finale
  {
    id: 8,
    name: "Grand Finale",
    position: [0, 0, -8],
    start: [0, 0, 8],
    par: 5,
    width: 22,
    length: 22,
    obstacles: [
      // Water hazard
      { position: [0, -0.1, 0], size: [10, 0.2, 3], type: 'water' },
      
      // Sand traps
      { position: [-5, -0.1, -4], size: [3, 0.2, 2], type: 'sand' },
      { position: [5, -0.1, -4], size: [3, 0.2, 2], type: 'sand' },
      
      // Wall obstacles
      { position: [-3, 0, 4], size: [2, 0.5, 0.5], type: 'wall' },
      { position: [3, 0, 4], size: [2, 0.5, 0.5], type: 'wall' },
    ]
  }
];

// Helper for physics calculations
export function detectCourseCollision(
  ballPosition: THREE.Vector3,
  ballRadius: number,
  hole: CourseHole
): { collided: boolean; normal?: THREE.Vector3 } {
  // Check collision with course boundaries
  const halfWidth = hole.width / 2;
  const halfLength = hole.length / 2;
  
  // Course boundary check
  if (
    ballPosition.x - ballRadius < -halfWidth ||
    ballPosition.x + ballRadius > halfWidth ||
    ballPosition.z - ballRadius < -halfLength ||
    ballPosition.z + ballRadius > halfLength
  ) {
    // Determine the normal for the boundary hit
    const normal = new THREE.Vector3(0, 0, 0);
    
    if (ballPosition.x - ballRadius < -halfWidth) normal.x = 1;
    if (ballPosition.x + ballRadius > halfWidth) normal.x = -1;
    if (ballPosition.z - ballRadius < -halfLength) normal.z = 1;
    if (ballPosition.z + ballRadius > halfLength) normal.z = -1;
    
    normal.normalize();
    
    return { collided: true, normal };
  }
  
  // Check collision with obstacles
  for (const obstacle of hole.obstacles) {
    const { position, size, type } = obstacle;
    
    // Create a box for the obstacle
    const halfSize = [size[0] / 2, size[1] / 2, size[2] / 2];
    
    // Check if the ball is colliding with this obstacle
    if (
      ballPosition.x + ballRadius > position[0] - halfSize[0] &&
      ballPosition.x - ballRadius < position[0] + halfSize[0] &&
      ballPosition.z + ballRadius > position[2] - halfSize[2] &&
      ballPosition.z - ballRadius < position[2] + halfSize[2]
    ) {
      // Handle different obstacle types
      switch (type) {
        case 'water':
          // Water hazard - return to last position or apply penalty
          return { collided: true, normal: new THREE.Vector3(0, 1, 0) };
        
        case 'sand':
          // Sand trap - slow down but don't bounce
          return { collided: true, normal: new THREE.Vector3(0, 0, 0) };
        
        case 'wall':
        default:
          // Calculate normal for walls
          const dx = ballPosition.x - position[0];
          const dz = ballPosition.z - position[2];
          
          // Find closest face
          const absDx = Math.abs(dx);
          const absDz = Math.abs(dz);
          
          const normal = new THREE.Vector3(0, 0, 0);
          
          if (absDx > absDz) {
            // Hit on X axis
            normal.x = Math.sign(dx);
          } else {
            // Hit on Z axis
            normal.z = Math.sign(dz);
          }
          
          return { collided: true, normal };
      }
    }
  }
  
  // No collision
  return { collided: false };
}
