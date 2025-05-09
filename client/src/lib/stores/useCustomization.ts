import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getLocalStorage, setLocalStorage } from '../utils';

// Define all available ball types
export const ballTypes = [
  { id: 0, name: 'Standard White', color: '#ffffff', unlocked: true },
  { id: 1, name: 'Red Stripe', color: '#ff5555', unlocked: true },
  { id: 2, name: 'Blue Swirl', color: '#5555ff', unlocked: true },
  { id: 3, name: 'Green Sparkle', color: '#55ff55', unlocked: false },
  { id: 4, name: 'Golden', color: '#ffff55', unlocked: false },
  { id: 5, name: 'Pink Glitter', color: '#ff55ff', unlocked: false },
];

// Define all available club types
export const clubTypes = [
  { id: 0, name: 'Standard Putter', power: 1.0, unlocked: true },
  { id: 1, name: 'Precision Wedge', power: 1.2, unlocked: true },
  { id: 2, name: 'Power Driver', power: 1.5, unlocked: false },
  { id: 3, name: 'Hybrid Club', power: 1.3, unlocked: false },
];

// Define all available course styles
export const courseStyles = [
  { id: 0, name: 'Classic Green', unlocked: true },
  { id: 1, name: 'Sandy Dunes', unlocked: true },
  { id: 2, name: 'Urban Street', unlocked: true },
  { id: 3, name: 'Wooden Deck', unlocked: false },
  { id: 4, name: 'Forest Green', unlocked: false },
  { id: 5, name: 'Spring Meadow', unlocked: false },
];

interface CustomizationState {
  ballType: number;
  clubType: number;
  preferredCourseStyle: number;
  unlockedBalls: number[];
  unlockedClubs: number[];
  unlockedCourses: number[];
  
  // Actions
  setBallType: (id: number) => void;
  setClubType: (id: number) => void;
  setPreferredCourseStyle: (id: number) => void;
  unlockBall: (id: number) => void;
  unlockClub: (id: number) => void;
  unlockCourse: (id: number) => void;
  unlockItem: (type: 'ball' | 'club' | 'course', id: number) => void;
}

// Persistent storage using Zustand middleware
export const useCustomization = create<CustomizationState>()(
  persist(
    (set) => ({
      // Default state
      ballType: 0,
      clubType: 0,
      preferredCourseStyle: 0,
      unlockedBalls: [0, 1, 2], // Start with a few unlocked
      unlockedClubs: [0, 1],
      unlockedCourses: [0, 1, 2],
      
      // Actions
      setBallType: (id: number) => set({ ballType: id }),
      
      setClubType: (id: number) => set({ clubType: id }),
      
      setPreferredCourseStyle: (id: number) => set({ preferredCourseStyle: id }),
      
      unlockBall: (id: number) => set(state => ({
        unlockedBalls: state.unlockedBalls.includes(id) 
          ? state.unlockedBalls 
          : [...state.unlockedBalls, id]
      })),
      
      unlockClub: (id: number) => set(state => ({
        unlockedClubs: state.unlockedClubs.includes(id)
          ? state.unlockedClubs
          : [...state.unlockedClubs, id]
      })),
      
      unlockCourse: (id: number) => set(state => ({
        unlockedCourses: state.unlockedCourses.includes(id)
          ? state.unlockedCourses
          : [...state.unlockedCourses, id]
      })),
      
      unlockItem: (type: 'ball' | 'club' | 'course', id: number) => {
        if (type === 'ball') {
          set(state => ({
            unlockedBalls: state.unlockedBalls.includes(id)
              ? state.unlockedBalls
              : [...state.unlockedBalls, id]
          }));
        } else if (type === 'club') {
          set(state => ({
            unlockedClubs: state.unlockedClubs.includes(id)
              ? state.unlockedClubs
              : [...state.unlockedClubs, id]
          }));
        } else if (type === 'course') {
          set(state => ({
            unlockedCourses: state.unlockedCourses.includes(id)
              ? state.unlockedCourses
              : [...state.unlockedCourses, id]
          }));
        }
      }
    }),
    {
      name: 'putt-putt-customization',
      // Use our custom storage functions that match the required signature
      storage: {
        getItem: (name) => {
          try {
            const value = getLocalStorage(name);
            return value ?? null;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            setLocalStorage(name, value);
          } catch (error) {
            console.error('Failed to save to storage:', error);
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.error('Failed to remove from storage:', error);
          }
        },
      },
    }
  )
);
