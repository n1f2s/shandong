import React from 'react';
import { Guest, GuestType, GuestState, Gender } from '../types';
import { User, Crown, Baby, Wine, UserMinus, UserX, XCircle } from 'lucide-react';
import { TOAST_WAIT_TIME, EXCUSE_TIME } from '../constants';

interface GuestSeatProps {
  guest: Guest;
  isActive: boolean; // Is currently eating
  onToastClick: (guestId: number) => void;
  onKickClick: (guestId: number) => void;
}

export const GuestSeat: React.FC<GuestSeatProps> = ({ guest, isActive, onToastClick, onKickClick }) => {
  // Position Calculation
  const baseRadius = 220; 
  const kickRadius = 800; // Fly far off screen
  const isKicking = guest.state === GuestState.KICKING;
  
  const currentRadius = isKicking ? kickRadius : baseRadius;
  
  const rad = ((guest.angle - 90) * Math.PI) / 180;
  const x = Math.cos(rad) * currentRadius;
  const y = Math.sin(rad) * currentRadius;

  // -- EMPTY STATE --
  if (guest.state === GuestState.EMPTY) {
     return (
        <div
            className="absolute flex flex-col items-center justify-center opacity-50"
            style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -50%)',
                zIndex: 5,
            }}
        >
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center bg-black/20">
                <span className="text-xs text-gray-400">空座</span>
            </div>
        </div>
     );
  }

  // -- SEATED / KICKING STATE --

  // Visuals based on type/gender
  let Icon = User;
  let bgColor = 'bg-gray-200';
  let borderColor = 'border-gray-400';
  let iconColor = 'text-gray-700';

  if (guest.type === GuestType.ELDER) {
    Icon = Crown;
    bgColor = 'bg-yellow-200';
    borderColor = 'border-yellow-600';
    iconColor = 'text-yellow-700';
  } else if (guest.type === GuestType.CHILD) {
    Icon = Baby;
    bgColor = 'bg-pink-200';
    borderColor = 'border-pink-400';
  } else if (guest.gender === Gender.FEMALE) {
    // Female guests distinct look
    Icon = User; // Or a custom feminine icon if available, reusing User for now but styled
    bgColor = 'bg-fuchsia-200';
    borderColor = 'border-fuchsia-500';
    iconColor = 'text-fuchsia-800';
  }

  // Toast Progress
  const toastProgress = Math.max(0, Math.min(1, guest.toastTimer / TOAST_WAIT_TIME));
  const radiusRing = 18;
  const circumference = 2 * Math.PI * radiusRing;
  const dashOffset = circumference * (1 - toastProgress);
  const ringColor = toastProgress < 0.3 ? '#ef4444' : (toastProgress < 0.6 ? '#f59e0b' : '#22c55e');
  
  // Excuse Progress (for kicking time)
  const excuseProgress = Math.max(0, Math.min(1, guest.excuseTimer / EXCUSE_TIME));
  
  // Is this guest kickable? (Female or Has Excuse)
  const isKickable = guest.gender === Gender.FEMALE || !!guest.excuse;

  return (
    <div
      className={`absolute flex flex-col items-center justify-center transition-all ease-in
         ${isKicking ? 'duration-700 rotate-[720deg] scale-0 opacity-0' : 'duration-300 ' + (isActive ? 'scale-110' : 'scale-100')}
      `}
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: 'translate(-50%, -50%)',
        zIndex: (guest.wantsToast || guest.excuse) ? 40 : 10,
      }}
    >
      <div 
        className={`relative w-14 h-14 rounded-full border-4 flex items-center justify-center shadow-lg transition-colors ${bgColor} ${borderColor} ${isActive ? 'ring-4 ring-green-400' : ''} ${isKickable ? 'animate-pulse ring-4 ring-red-500' : ''}`}
        onClick={(e) => {
             if (isKickable && !isKicking) {
                 e.stopPropagation();
                 onKickClick(guest.id);
             } else if (guest.wantsToast && !isKicking) {
                 e.stopPropagation();
                 onToastClick(guest.id);
             }
        }}
      >
        <Icon className={`w-8 h-8 ${iconColor}`} />
        
        {/* Female Indicator Badge */}
        {guest.gender === Gender.FEMALE && !isKicking && (
             <div className="absolute -bottom-2 -right-2 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm animate-bounce z-20">
                 踹!
             </div>
        )}

        {/* Excuse Bubble */}
        {guest.excuse && !isKicking && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white border-2 border-red-500 px-2 py-1 rounded-lg shadow-xl z-50 whitespace-nowrap flex flex-col items-center animate-shake">
                <span className="text-[10px] font-bold text-red-600 max-w-[100px] overflow-hidden text-ellipsis">{guest.excuse}</span>
                <div className="text-[8px] bg-red-100 text-red-800 px-1 rounded mt-0.5">点击踹飞</div>
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-red-500"></div>
                
                {/* Timer Bar */}
                <div className="w-full h-1 bg-gray-200 mt-1 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 transition-all duration-100" style={{ width: `${excuseProgress * 100}%` }}></div>
                </div>
            </div>
        )}

        {/* Toast Indicator */}
        {guest.wantsToast && !guest.excuse && !isKicking && (
            <div className="absolute -top-8 -right-6 w-12 h-12 flex items-center justify-center animate-bounce z-50 pointer-events-none">
                <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-md">
                   <circle cx="50%" cy="50%" r={radiusRing} fill="white" stroke="none" className="opacity-90"/>
                   <circle cx="50%" cy="50%" r={radiusRing} fill="none" stroke="#e5e7eb" strokeWidth="4"/>
                   <circle cx="50%" cy="50%" r={radiusRing} fill="none" stroke={ringColor} strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round" className="transition-all duration-100 linear"/>
                </svg>
                <div className="relative z-10 bg-red-600 text-white p-1.5 rounded-full shadow-sm">
                    <Wine className="w-4 h-4" />
                </div>
            </div>
        )}

        {/* Kick Hover Overlay (If kickable) */}
        {isKickable && !isKicking && (
            <div className="absolute inset-0 bg-red-500/30 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <UserX className="w-8 h-8 text-white drop-shadow-md" />
            </div>
        )}
      </div>
      
      <div className="mt-1 px-2 py-0.5 bg-black/60 rounded text-white text-[10px] whitespace-nowrap">
        {guest.name}
      </div>
    </div>
  );
};