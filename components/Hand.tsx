import React from 'react';
import { Hand as HandIcon } from 'lucide-react';
import { HandEntity, Guest } from '../types';

interface HandProps {
  hand: HandEntity;
  guest: Guest;
  onClick: () => void;
}

export const Hand: React.FC<HandProps> = ({ hand, guest, onClick }) => {
  // Calculate position logic
  // The hand originates from the guest's position and moves towards the table center.
  // We use the same angle logic as GuestSeat but interpolate distance based on state.

  const maxRadius = 200; // Start position (near guest)
  const minRadius = 100; // End position (at dish)
  
  let currentRadius = maxRadius;
  
  if (hand.state === 'reaching') {
     // Animate in
     currentRadius = 120;
  } else if (hand.state === 'grabbing') {
     currentRadius = minRadius;
  } else {
     currentRadius = maxRadius;
  }

  const angleRad = ((guest.angle - 90) * Math.PI) / 180;
  
  // Calculate CSS transform for position and rotation
  // The hand icon should point towards the center
  const x = Math.cos(angleRad) * currentRadius;
  const y = Math.sin(angleRad) * currentRadius;
  
  // Rotation: The hand should point inward. 
  // At 0 deg (top), rotation should be 180 (pointing down).
  const rotation = guest.angle + 180;

  return (
    <div
      className={`absolute z-20 transition-all duration-500 ease-in-out cursor-pointer ${hand.isNaughty ? 'animate-shake' : ''}`}
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <div className={`relative ${hand.isNaughty ? 'scale-125' : 'scale-100'}`}>
         {/* Arm */}
         <div className="absolute top-full left-1/2 -translate-x-1/2 w-4 h-24 bg-orange-200 -mt-2 rounded-full"></div>
         {/* Hand */}
         <div className={`p-2 rounded-full ${hand.isNaughty ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'bg-orange-300 border-2 border-orange-400'}`}>
            <HandIcon className={`w-8 h-8 ${hand.isNaughty ? 'text-white' : 'text-orange-800'}`} />
         </div>
         {hand.isNaughty && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-600 text-white text-xs px-2 py-1 rounded-full font-bold animate-bounce">
                点击制止!
            </div>
         )}
      </div>
    </div>
  );
};