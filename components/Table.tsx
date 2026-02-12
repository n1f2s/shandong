import React from 'react';
import { Dish } from '../types';
import { DISHES } from '../constants';
import { Fish, Utensils } from 'lucide-react';

interface TableProps {
  rotation: number;
  onPointerDown: (e: React.PointerEvent) => void;
  isLocked: boolean; // Visual feedback if locked by NPC
}

export const Table: React.FC<TableProps> = ({ rotation, onPointerDown, isLocked }) => {
  return (
    <div 
      className={`relative w-72 h-72 sm:w-96 sm:h-96 rounded-full shadow-2xl transition-shadow duration-300 ${isLocked ? 'shadow-red-500/50 cursor-not-allowed' : 'shadow-black/50 cursor-grab active:cursor-grabbing'}`}
      style={{
        transform: `rotate(${rotation}deg)`,
        touchAction: 'none' // Critical for handling gestures manually
      }}
      onPointerDown={onPointerDown}
    >
      {/* Wood Texture */}
      <div className="absolute inset-0 w-full h-full rounded-full wood-pattern border-4 border-[#3E2723] overflow-hidden">
        {/* Lazy Susan Mechanism (Center decoration) */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#3E2723] rounded-full z-10 flex items-center justify-center border-2 border-[#8D6E63]">
            <span className="text-[#D7CCC8] text-xs font-bold text-center leading-tight">好客<br/>山东</span>
        </div>
      </div>

      {/* Dishes */}
      {DISHES.map((dish) => (
        <div
          key={dish.id}
          className="absolute top-1/2 left-1/2 w-16 h-16 sm:w-20 sm:h-20 -ml-8 -mt-8 sm:-ml-10 sm:-mt-10 flex flex-col items-center justify-center"
          style={{
            transform: `rotate(${dish.angle}deg) translate(0, -110px) rotate(-${dish.angle}deg)`, // Keep dishes upright relative to table center? No, they rotate with table.
            // Actually, let's let them rotate with the table, but the icon inside can be oriented.
            // Correction: `translate(0, -110px)` moves it to the edge. The outer rotate positions it.
          }}
        >
          <div className={`relative flex items-center justify-center w-full h-full rounded-full border-2 shadow-md ${dish.type === 'fish' ? 'bg-amber-100 border-amber-500' : 'bg-white border-gray-300'}`}>
            {dish.type === 'fish' ? (
               // The Fish Head needs to be visually distinct direction-wise. 
               // Assuming 0 deg on the dish points "UP" (towards center) or "OUT"?
               // Let's say the Fish head points UP relative to the dish container.
               // And the dish is at angle 0. 
               // If table rotation is 0, dish 0 is at top (12 o'clock).
               // We want Fish Head to point to 12 o'clock.
              <div className="flex flex-col items-center justify-center">
                 {/* Arrow indicating head */}
                 <div className="w-0 h-0 border-l-[6px] border-l-transparent border-b-[10px] border-b-red-600 border-r-[6px] border-r-transparent mb-1"></div>
                 <Fish className="w-8 h-8 text-red-600 fill-current" />
                 <span className="text-[10px] font-bold text-red-800 mt-1">鱼头</span>
              </div>
            ) : (
              <Utensils className="w-6 h-6 text-gray-400" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};