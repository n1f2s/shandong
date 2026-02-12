import React, { useRef, useEffect, useState } from 'react';
import { DISHES } from '../constants';
import { Fish, Utensils } from 'lucide-react';

interface TableProps {
  rotation: number;
  onPointerDown: (e: React.PointerEvent) => void;
  isLocked: boolean; // Visual feedback if locked by NPC
  onSizeChange?: (radius: number) => void;
}

export const Table: React.FC<TableProps> = ({ rotation, onPointerDown, isLocked, onSizeChange }) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const [radius, setRadius] = useState(144); // Default to mobile size approx

  useEffect(() => {
    if (!tableRef.current) return;
    
    const observer = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect) {
        const r = entry.contentRect.width / 2;
        setRadius(r);
        if (onSizeChange) {
          onSizeChange(r);
        }
      }
    });

    observer.observe(tableRef.current);
    return () => observer.disconnect();
  }, [onSizeChange]);

  // Dish positioning: 70% from center looks good for both sizes
  const dishDistance = radius * 0.7; 

  return (
    <div 
      ref={tableRef}
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
            // Dynamic positioning based on table radius
            transform: `rotate(${dish.angle}deg) translate(0, -${dishDistance}px) rotate(-${dish.angle}deg)`, 
          }}
        >
          <div className={`relative flex items-center justify-center w-full h-full rounded-full border-2 shadow-md ${dish.type === 'fish' ? 'bg-amber-100 border-amber-500' : 'bg-white border-gray-300'}`}>
            {dish.type === 'fish' ? (
               // The Fish Head needs to be visually distinct direction-wise. 
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