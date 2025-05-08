import * as THREE from 'three';
import { CourseHole, detectCourseCollision } from '../courses';

// Constants
export const BALL_RADIUS = 0.1;
export const FRICTION = 0.96;
export const WATER_PENALTY = 1; // Extra stroke for water hazard
export const SAND_FACTOR = 0.7; // Sand slows down more than regular surfaces

// Physics simulation functions
export function applyForce(
  velocity: THREE.Vector3,
  force: THREE.Vector3, 
  mass: number = 1
): THREE.Vector3 {
  // F = ma, so a = F/m
  const acceleration = force.clone().divideScalar(mass);
  return velocity.clone().add(acceleration);
}

export function applyFriction(
  velocity: THREE.Vector3, 
  frictionFactor: number = FRICTION
): THREE.Vector3 {
  return velocity.clone().multiplyScalar(frictionFactor);
}

export function handleCollision(
  position: THREE.Vector3,
  velocity: THREE.Vector3,
  course: CourseHole
): { 
  newPosition: THREE.Vector3; 
  newVelocity: THREE.Vector3;
  inHole: boolean;
  inWater: boolean;
  inSand: boolean;
} {
  // Check if we're in the hole
  const holePosition = new THREE.Vector3(
    course.position[0],
    course.position[1],
    course.position[2]
  );
  
  const distanceToHole = position.clone().sub(holePosition).length();
  const inHole = distanceToHole < 0.15; // Slightly smaller than hole radius
  
  if (inHole) {
    return {
      newPosition: position,
      newVelocity: new THREE.Vector3(0, 0, 0),
      inHole: true,
      inWater: false,
      inSand: false
    };
  }
  
  // Detect collisions with course elements
  const collision = detectCourseCollision(position, BALL_RADIUS, course);
  
  if (collision.collided) {
    // Check if it's a water hazard
    for (const obstacle of course.obstacles) {
      if (obstacle.type === 'water') {
        const { position: obsPos, size } = obstacle;
        const halfSize = [size[0] / 2, size[1] / 2, size[2] / 2];
        
        // Simple AABB check
        if (
          position.x > obsPos[0] - halfSize[0] &&
          position.x < obsPos[0] + halfSize[0] &&
          position.z > obsPos[2] - halfSize[2] &&
          position.z < obsPos[2] + halfSize[2]
        ) {
          // Ball in water - will be reset to starting position
          return {
            newPosition: position,
            newVelocity: velocity,
            inHole: false,
            inWater: true,
            inSand: false
          };
        }
      }
      
      // Check for sand traps
      if (obstacle.type === 'sand') {
        const { position: obsPos, size } = obstacle;
        const halfSize = [size[0] / 2, size[1] / 2, size[2] / 2];
        
        // Simple AABB check
        if (
          position.x > obsPos[0] - halfSize[0] &&
          position.x < obsPos[0] + halfSize[0] &&
          position.z > obsPos[2] - halfSize[2] &&
          position.z < obsPos[2] + halfSize[2]
        ) {
          // Ball in sand - apply extra friction
          return {
            newPosition: position,
            newVelocity: velocity.clone().multiplyScalar(SAND_FACTOR),
            inHole: false,
            inWater: false,
            inSand: true
          };
        }
      }
    }
    
    // If normal is provided, reflect the velocity
    if (collision.normal) {
      // Reflect velocity across the normal (bounce)
      const reflectedVelocity = velocity.clone();
      // Calculate reflection: v - 2(v·n)n
      reflectedVelocity.sub(
        collision.normal.clone().multiplyScalar(
          2 * velocity.dot(collision.normal)
        )
      );
      
      // Reduce velocity after bounce (energy loss)
      reflectedVelocity.multiplyScalar(0.7);
      
      return {
        newPosition: position,
        newVelocity: reflectedVelocity,
        inHole: false,
        inWater: false,
        inSand: false
      };
    }
  }
  
  // No special handling needed
  return {
    newPosition: position,
    newVelocity: velocity,
    inHole: false,
    inWater: false,
    inSand: false
  };
}

// Helper to convert polar coordinates to cartesian (for shot direction)
export function polarToCartesian(
  angle: number,
  power: number
): THREE.Vector2 {
  const radians = angle * (Math.PI / 180);
  return new THREE.Vector2(
    Math.cos(radians) * power,
    Math.sin(radians) * power
  );
}
