import { useEffect, useState } from 'react';
import { useKeyboardControls } from '@react-three/drei';
import { useGameState } from '../hooks/useGameState';
import { usePlayerControls } from '../hooks/usePlayerControls';
import PowerMeter from './PowerMeter';

enum Controls {
  left = 'left',
  right = 'right',
  increase = 'increase',
  decrease = 'decrease',
  swing = 'swing',
}

export default function PlayerControls() {
  const [isCharging, setIsCharging] = useState(false);
  const [swinging, setSwinging] = useState(false);
  const { shotPower, shotAngle, setShotPower, setShotAngle, isMyTurn, canSwing } = useGameState(state => ({
    shotPower: state.shotPower,
    shotAngle: state.shotAngle,
    setShotPower: state.setShotPower,
    setShotAngle: state.setShotAngle,
    isMyTurn: state.isMyTurn,
    canSwing: state.canSwing
  }));
  
  // Setup keyboard controls
  const leftPressed = useKeyboardControls<Controls>(state => state.left);
  const rightPressed = useKeyboardControls<Controls>(state => state.right);
  const increasePressed = useKeyboardControls<Controls>(state => state.increase);
  const decreasePressed = useKeyboardControls<Controls>(state => state.decrease);
  const swingPressed = useKeyboardControls<Controls>(state => state.swing);
  
  // Handle direction controls (left/right)
  useEffect(() => {
    if (!isMyTurn || !canSwing) return;
    
    const turnSpeed = 2; // Degrees per frame
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Left/right to adjust angle
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setShotAngle(prev => prev + turnSpeed);
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        setShotAngle(prev => prev - turnSpeed);
      }
      
      // Space to start/execute swing
      if (e.key === ' ') {
        if (!isCharging && !swinging) {
          setIsCharging(true);
        } else if (isCharging) {
          setIsCharging(false);
          setSwinging(true);
          
          // Execute the swing after a brief animation delay
          setTimeout(() => {
            setSwinging(false);
          }, 1000);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMyTurn, canSwing, isCharging, swinging, setShotAngle]);
  
  // Handle power meter charging
  useEffect(() => {
    if (!isCharging || !isMyTurn || !canSwing) return;
    
    let power = 0;
    let increasing = true;
    const maxPower = 100;
    const powerStep = 2;
    
    const chargeInterval = setInterval(() => {
      if (increasing) {
        power += powerStep;
        if (power >= maxPower) {
          power = maxPower;
          increasing = false;
        }
      } else {
        power -= powerStep;
        if (power <= 0) {
          power = 0;
          increasing = true;
        }
      }
      
      setShotPower(power);
    }, 30);
    
    return () => clearInterval(chargeInterval);
  }, [isCharging, isMyTurn, canSwing, setShotPower]);
  
  // Handle actual swing based on swingPressed
  useEffect(() => {
    if (swingPressed && isMyTurn && canSwing && !swinging) {
      setIsCharging(true);
    } else if (!swingPressed && isCharging) {
      setIsCharging(false);
      setSwinging(true);
      
      setTimeout(() => {
        setSwinging(false);
      }, 1000);
    }
  }, [swingPressed, isMyTurn, canSwing, swinging, isCharging]);
  
  // Handle angle adjustment based on left/right pressed
  useEffect(() => {
    if (!isMyTurn || !canSwing || isCharging || swinging) return;
    
    const turnSpeed = 2; // Degrees per frame
    
    if (leftPressed) {
      setShotAngle(prev => prev + turnSpeed);
    }
    if (rightPressed) {
      setShotAngle(prev => prev - turnSpeed);
    }
  }, [leftPressed, rightPressed, isMyTurn, canSwing, isCharging, swinging, setShotAngle]);
  
  if (!isMyTurn) return null;
  
  return (
    <div className="absolute bottom-5 left-0 right-0 flex justify-center items-center">
      <div className="bg-black/70 p-4 rounded-lg flex flex-col items-center">
        <PowerMeter power={shotPower} isCharging={isCharging} />
        
        <div className="mt-2 text-white">
          <div className="flex justify-between w-full mb-2">
            <span>Angle: {shotAngle.toFixed(0)}°</span>
            <span>Power: {shotPower}%</span>
          </div>
          
          <div className="text-xs opacity-70 mt-1">
            {isCharging ? (
              "Release SPACE to swing!"
            ) : canSwing ? (
              "← → to aim | SPACE to start swing"
            ) : (
              "Ball in motion..."
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
