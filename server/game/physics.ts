import { CourseHole, CourseObstacle } from './courseData';

// Constants for physics simulation
const BALL_RADIUS = 0.1;
const FRICTION = 0.95;
const STOP_THRESHOLD = 0.01;
const MAX_ITERATIONS = 100;

// Types for physics calculations
interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface PhysicsResult {
  position: [number, number, number];
  inHole: boolean;
  inWater: boolean;
  inSand: boolean;
}

/**
 * Calculate ball physics for a shot
 */
export function calculateBallPhysics(
  startPosition: [number, number, number],
  angle: number,
  power: number,
  hole: CourseHole
): PhysicsResult {
  // Convert angle and power to initial velocity
  const radians = angle * (Math.PI / 180);
  const scaledPower = power * 0.05; // Scale power to reasonable values
  
  // Create position and velocity vectors
  const position: Vector3 = { 
    x: startPosition[0], 
    y: startPosition[1], 
    z: startPosition[2] 
  };
  
  const velocity: Vector3 = {
    x: Math.cos(radians) * scaledPower,
    y: 0,
    z: Math.sin(radians) * scaledPower
  };
  
  // Simulate ball movement
  let inHole = false;
  let inWater = false;
  let inSand = false;
  let iterations = 0;
  
  while (vectorMagnitude(velocity) > STOP_THRESHOLD && iterations < MAX_ITERATIONS) {
    // Update position based on velocity
    position.x += velocity.x;
    position.z += velocity.z;
    
    // Apply friction
    const frictionFactor = inSand ? 0.8 : FRICTION;
    velocity.x *= frictionFactor;
    velocity.z *= frictionFactor;
    
    // Check for hole
    const holePos = hole.position;
    const distanceToHole = Math.sqrt(
      Math.pow(position.x - holePos[0], 2) + 
      Math.pow(position.z - holePos[2], 2)
    );
    
    if (distanceToHole < 0.15) {
      inHole = true;
      break;
    }
    
    // Check for collision with obstacles
    const collision = detectCollision(position, BALL_RADIUS, hole.obstacles);
    
    if (collision.collided) {
      if (collision.type === 'water') {
        inWater = true;
        
        // Reset to starting position for water hazards
        position.x = startPosition[0];
        position.y = startPosition[1];
        position.z = startPosition[2];
        
        // Stop movement
        velocity.x = 0;
        velocity.z = 0;
        break;
      } else if (collision.type === 'sand') {
        inSand = true;
      } else {
        // Wall collision - bounce
        if (collision.normal) {
          // Reflect velocity across normal
          const dot = velocity.x * collision.normal.x + velocity.z * collision.normal.z;
          velocity.x = velocity.x - 2 * dot * collision.normal.x;
          velocity.z = velocity.z - 2 * dot * collision.normal.z;
          
          // Reduce velocity after bounce (energy loss)
          velocity.x *= 0.7;
          velocity.z *= 0.7;
        }
      }
    }
    
    // Check for course boundaries
    const halfWidth = hole.width / 2;
    const halfLength = hole.length / 2;
    
    if (position.x < -halfWidth + BALL_RADIUS) {
      position.x = -halfWidth + BALL_RADIUS;
      velocity.x *= -0.7;
    } else if (position.x > halfWidth - BALL_RADIUS) {
      position.x = halfWidth - BALL_RADIUS;
      velocity.x *= -0.7;
    }
    
    if (position.z < -halfLength + BALL_RADIUS) {
      position.z = -halfLength + BALL_RADIUS;
      velocity.z *= -0.7;
    } else if (position.z > halfLength - BALL_RADIUS) {
      position.z = halfLength - BALL_RADIUS;
      velocity.z *= -0.7;
    }
    
    iterations++;
  }
  
  return {
    position: [position.x, position.y, position.z],
    inHole,
    inWater,
    inSand
  };
}

// Helper function to calculate vector magnitude
function vectorMagnitude(vector: Vector3): number {
  return Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
}

// Detect collision with obstacles
function detectCollision(
  position: Vector3, 
  radius: number, 
  obstacles: CourseObstacle[]
): {
  collided: boolean;
  type?: 'wall' | 'water' | 'sand';
  normal?: { x: number; z: number };
} {
  for (const obstacle of obstacles) {
    const { position: obsPos, size, type } = obstacle;
    
    // Calculate obstacle bounds
    const halfSize = [size[0] / 2, size[1] / 2, size[2] / 2];
    
    const minX = obsPos[0] - halfSize[0];
    const maxX = obsPos[0] + halfSize[0];
    const minZ = obsPos[2] - halfSize[2];
    const maxZ = obsPos[2] + halfSize[2];
    
    // Check if the ball is colliding with this obstacle
    if (
      position.x + radius > minX &&
      position.x - radius < maxX &&
      position.z + radius > minZ &&
      position.z - radius < maxZ
    ) {
      // Calculate collision normal
      let normal;
      
      if (type === 'wall') {
        // Determine which face was hit
        const penetrationX = Math.min(
          Math.abs(position.x - minX),
          Math.abs(position.x - maxX)
        );
        
        const penetrationZ = Math.min(
          Math.abs(position.z - minZ),
          Math.abs(position.z - maxZ)
        );
        
        if (penetrationX < penetrationZ) {
          // X-axis collision
          normal = { 
            x: position.x < obsPos[0] ? -1 : 1, 
            z: 0 
          };
        } else {
          // Z-axis collision
          normal = { 
            x: 0, 
            z: position.z < obsPos[2] ? -1 : 1 
          };
        }
      }
      
      return {
        collided: true,
        type,
        normal
      };
    }
  }
  
  return { collided: false };
}
