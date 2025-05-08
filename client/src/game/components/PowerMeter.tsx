import { useEffect, useRef } from 'react';

interface PowerMeterProps {
  power: number;
  isCharging: boolean;
}

export default function PowerMeter({ power, isCharging }: PowerMeterProps) {
  const meterRef = useRef<HTMLDivElement>(null);
  
  // Update the power meter fill width based on power
  useEffect(() => {
    if (meterRef.current) {
      meterRef.current.style.width = `${power}%`;
    }
  }, [power]);
  
  // Get color based on power level
  const getColor = (power: number): string => {
    if (power < 33) return 'bg-green-500';
    if (power < 66) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="power-meter">
      <div 
        ref={meterRef} 
        className={`power-meter-fill ${isCharging ? 'animate-pulse' : ''}`}
        style={{ width: `${power}%` }}
      />
    </div>
  );
}
