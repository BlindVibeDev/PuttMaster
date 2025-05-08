import { useEffect } from 'react';
import { useGameState } from './useGameState';

// Define control keys
export enum Controls {
  left = 'left',
  right = 'right',
  increase = 'increase',
  decrease = 'decrease',
  swing = 'swing',
}

export const usePlayerControls = () => {
  const { 
    isMyTurn, 
    canSwing, 
    shotAngle, 
    shotPower, 
    setShotAngle, 
    setShotPower,
    sendAction
  } = useGameState();
  
  // Set up keyboard controls
  useEffect(() => {
    // Only process controls when it's the player's turn
    if (!isMyTurn) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canSwing) return;
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
          // Rotate aiming direction left
          setShotAngle(shotAngle + 5);
          sendAction({ type: 'aim', angle: shotAngle + 5 });
          break;
          
        case 'ArrowRight':
        case 'd':
          // Rotate aiming direction right
          setShotAngle(shotAngle - 5);
          sendAction({ type: 'aim', angle: shotAngle - 5 });
          break;
          
        case 'ArrowUp':
        case 'w':
          // Increase power
          if (shotPower < 100) {
            setShotPower(Math.min(shotPower + 5, 100));
          }
          break;
          
        case 'ArrowDown':
        case 's':
          // Decrease power
          if (shotPower > 0) {
            setShotPower(Math.max(shotPower - 5, 0));
          }
          break;
          
        case ' ':
          // Swing/shot
          if (shotPower > 0) {
            sendAction({ 
              type: 'swing', 
              angle: shotAngle, 
              power: shotPower
            });
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMyTurn, canSwing, shotAngle, shotPower, setShotAngle, setShotPower, sendAction]);
  
  return {
    shotAngle,
    shotPower,
    setShotAngle,
    setShotPower
  };
};
