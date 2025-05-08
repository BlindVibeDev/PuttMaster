// Define course hole data structures
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
