import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface ToastHUDProps {
  fillLevel: number;
  onPourStart: () => void;
  onPourEnd: () => void;
  onDump: () => void;
}

export const ToastHUD: React.FC<ToastHUDProps> = ({ fillLevel, onPourStart, onPourEnd, onDump }) => {
  const [isPouring, setIsPouring] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Determine visual state
  let statusText = "按住酒瓶倒酒";
  let statusColor = "text-white";
  let liquidColor = "bg-slate-200/90";
  
  if (fillLevel > 100) {
      statusText = "洒了！(快倒掉)";
      statusColor = "text-red-400";
      liquidColor = "bg-red-300/90";
  } else if (fillLevel >= 80) {
      statusText = "完美酒量";
      statusColor = "text-green-400";
  } else if (fillLevel > 0) {
      statusText = "倒酒中...";
      statusColor = "text-yellow-400";
  } else {
      statusText = "空杯";
      statusColor = "text-gray-400";
  }

  const handlePourDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    if (fillLevel <= 110) {
        setIsPouring(true);
        onPourStart();
    }
  };

  const handlePourUp = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsPouring(false);
    onPourEnd();
  };

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 pointer-events-none z-40 w-full max-w-lg px-4">
        <div className="pointer-events-auto bg-black/60 backdrop-blur-xl border-2 border-white/10 rounded-3xl p-6 pb-2 flex flex-col items-center shadow-2xl w-full">
            
            {/* Status Text */}
            <div className={`text-sm font-bold ${statusColor} uppercase tracking-widest mb-4 transition-colors duration-300`}>
                {statusText}
            </div>

            <div className="flex items-end justify-center gap-16 relative w-full h-40">
                
                {/* 1. THE CUP (Left Target) */}
                <div className="relative flex flex-col items-center z-10">
                    <div 
                        className="relative w-14 h-20 bg-white/10 rounded-b-xl border-2 border-white/40 border-t-0 overflow-hidden cursor-pointer hover:border-white/60 transition-colors"
                        onClick={onDump}
                        title="Click to dump"
                    >
                        {/* Glass Reflection */}
                        <div className="absolute top-0 right-1 w-1 h-full bg-white/20 rounded-full blur-[0.5px]"></div>
                        
                        {/* Target Zone Indicator */}
                        <div className="absolute bottom-[80%] w-full h-[1px] bg-green-400/50 z-20"></div>
                        <div className="absolute bottom-[100%] w-full h-[1px] bg-red-400/50 z-20"></div>

                        {/* Liquid */}
                        <div 
                            className={`absolute bottom-0 left-0 w-full transition-all duration-100 ease-linear ${liquidColor}`}
                            style={{ height: `${Math.min(100, fillLevel)}%` }}
                        >
                            <div className="w-full h-0.5 bg-white/80 absolute top-0 animate-pulse"></div>
                        </div>
                         
                         {/* Spilled Top Layer */}
                        {fillLevel > 100 && (
                            <div className="absolute top-0 w-full h-full bg-red-500/20 animate-pulse"></div>
                        )}
                    </div>
                    {/* Coaster */}
                    <div className="w-12 h-1 bg-black/30 rounded-full mt-1 blur-sm"></div>
                    
                    {/* Dump Button */}
                    {fillLevel > 0 && (
                        <button 
                            onClick={onDump}
                            className="absolute -left-10 bottom-0 p-2 text-white/50 hover:text-white transition-colors"
                            title="倒掉重来"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* 2. LIQUID STREAM (Absolute, centered on cup) */}
                {isPouring && (
                    <div className="absolute left-[calc(50%-4rem-4px)] top-12 w-2 h-24 bg-slate-200/80 rounded-full z-20 origin-top"
                         style={{ animation: 'pour-stream 0.5s infinite' }}
                    >
                         {/* Splash at bottom */}
                         <div className="absolute bottom-0 -left-2 w-6 h-2 bg-white/50 rounded-full blur-sm animate-ping"></div>
                    </div>
                )}

                {/* 3. THE BOTTLE (Right Source) */}
                <div 
                    className={`relative w-24 h-48 flex items-center justify-center cursor-pointer touch-none select-none transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-30 origin-[top_center]
                        ${isPouring ? '-translate-x-32 -translate-y-8 -rotate-[100deg]' : 'hover:-translate-y-1 hover:rotate-2'}`}
                    onPointerDown={handlePourDown}
                    onPointerUp={handlePourUp}
                    onPointerLeave={handlePourUp}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    {/* 
                       Using GitHub Raw URL.
                       If the image fails to load (e.g. wrong branch name or file path), 
                       it falls back to a CSS-drawn bottle.
                    */}
                    {!imgError ? (
                        <img 
                            src="https://raw.githubusercontent.com/n1f2s/ShaDong-Master/main/maotai.png" 
                            alt="Moutai Bottle" 
                            className="w-full h-full object-contain drop-shadow-2xl pointer-events-none"
                            draggable={false}
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        /* CSS Fallback Bottle */
                        <div className="w-16 h-40 bg-gray-100 rounded-t-2xl rounded-b-xl border border-gray-300 flex flex-col items-center overflow-hidden shadow-inner relative pointer-events-none">
                            {/* Cap */}
                            <div className="w-full h-8 bg-red-700 border-b-2 border-yellow-600"></div>
                            {/* Label Area */}
                            <div className="flex-1 w-full flex flex-col items-center justify-center p-1">
                                <div className="w-full h-full border-2 border-red-700 bg-white flex items-center justify-center">
                                     <span className="text-red-700 font-serif font-bold text-lg rotate-90 whitespace-nowrap">茅台</span>
                                </div>
                            </div>
                            {/* Ribbon */}
                            <div className="absolute top-6 right-2 w-4 h-12 bg-red-600 rotate-12 opacity-80"></div>
                        </div>
                    )}
                    
                    {/* Hint overlay on bottle */}
                    {!isPouring && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white/10 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            按住倒酒
                        </div>
                    )}
                </div>

            </div>
        </div>
    </div>
  );
};