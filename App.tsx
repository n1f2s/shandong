import React, { useState, useEffect, useRef } from 'react';
import { GameState, Guest, GuestType, HandEntity, GuestState, Gender } from './types';
import { GUESTS, DISHES, MAX_RESPECT, RESPECT_DECAY_RATE, RESPECT_GAIN_RATE, PENALTY_RUDE_MOVE, PENALTY_FISH_WRONG, TOAST_WAIT_TIME, TOAST_PENALTY, EXCUSE_TIME, EXCUSES, NAMES_MALE, NAMES_FEMALE, FEMALE_TOLERANCE_TIME, EXCUSE_CHECK_INTERVAL, EXCUSE_PROBABILITY, RESPAWN_INITIAL_DELAY, RESPAWN_INITIAL_CHANCE, RESPAWN_RETRY_INTERVAL, RESPAWN_RETRY_CHANCE } from './constants';
import { Table } from './components/Table';
import { GuestSeat } from './components/GuestSeat';
import { Hand } from './components/Hand';
import { ToastHUD } from './components/ToastGame'; 
import { normalizeAngle, getShortestRotation } from './utils/math';
import { Trophy, AlertTriangle, Play, RefreshCw, Fish, Crown, Baby, Wine, UserX } from 'lucide-react';

export default function App() {
  // -- State --
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [respect, setRespect] = useState(100); 
  const [score, setScore] = useState(0); 
  const [rotation, setRotation] = useState(0); 
  const [hands, setHands] = useState<HandEntity[]>([]);
  const [guests, setGuests] = useState<Guest[]>(GUESTS);
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<'neutral' | 'bad' | 'good'>('neutral');
  const [isShaking, setIsShaking] = useState(false);
  
  const [cupFillLevel, setCupFillLevel] = useState(0);
  
  // Responsive Table Radius (Defaults to mobile approx 144)
  const [tableRadius, setTableRadius] = useState(144);

  // -- Refs --
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const gameStartTimeRef = useRef<number>(0);
  const rotationRef = useRef(0);
  const rotationVelocityRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastPointerX = useRef(0);
  const lastPointerY = useRef(0);
  const handsRef = useRef<HandEntity[]>([]);
  const isPouringRef = useRef(false);
  const guestsRef = useRef<Guest[]>(GUESTS);

  // -- Helpers --
  const showMessage = (msg: string, type: 'neutral' | 'bad' | 'good' = 'neutral') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
        setMessage(prev => prev === msg ? "" : prev);
    }, 2000);
  };

  useEffect(() => {
      guestsRef.current = guests;
  }, [guests]);

  // -- Input Handlers --
  const handlePointerDown = (e: React.PointerEvent) => {
    if (gameState !== GameState.PLAYING) return;
    
    // Check if table is locked by an NPC
    const lockingHand = handsRef.current.find(h => h.state === 'grabbing' || h.isNaughty);
    if (lockingHand) {
       const owner = guests.find(g => g.id === lockingHand.guestId);
       
       if (lockingHand.isNaughty) {
           showMessage("先管好熊孩子！", "bad");
       } else if (owner?.type === GuestType.ELDER) {
           // Visual feedback is handled in gameLoop now, but immediate feedback is good
           setRespect(prev => Math.max(0, prev - 5)); 
       } else {
           showMessage("客人在夹菜，别转桌！（不懂事！）", "bad");
           setRespect(prev => Math.max(0, prev - PENALTY_RUDE_MOVE));
       }
    }

    isDraggingRef.current = true;
    lastPointerX.current = e.clientX;
    lastPointerY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const lastAngle = Math.atan2(lastPointerY.current - centerY, lastPointerX.current - centerX);
    const newAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    
    let delta = (newAngle - lastAngle) * (180 / Math.PI);
    
    rotationRef.current += delta;
    setRotation(rotationRef.current); 
    rotationVelocityRef.current = delta;

    lastPointerX.current = e.clientX;
    lastPointerY.current = e.clientY;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
  };

  const slapHand = (handId: string) => {
    const hand = handsRef.current.find(h => h.id === handId);
    if (hand && hand.isNaughty) {
        setHands(prev => prev.filter(h => h.id !== handId));
        handsRef.current = handsRef.current.filter(h => h.id !== handId);
        showMessage("逮到了！老实点！", "good");
        setScore(s => s + 50);
        rotationVelocityRef.current = 0;
    }
  };

  // -- Toasting & Kicking Logic --
  const handlePourStart = () => { isPouringRef.current = true; };
  const handlePourEnd = () => { isPouringRef.current = false; };
  const handleDumpCup = () => { setCupFillLevel(0); isPouringRef.current = false; };

  const handleKickGuest = (guestId: number) => {
      const guest = guests.find(g => g.id === guestId);
      // Ignore if empty or already kicking
      if (!guest || guest.state === GuestState.EMPTY || guest.state === GuestState.KICKING) return;

      const isValidKick = !!guest.excuse || guest.gender === Gender.FEMALE;

      if (isValidKick) {
          // 1. Enter Kicking State (Trigger Animation)
          setGuests(prev => prev.map(g => 
            g.id === guestId ? { 
                ...g, 
                state: GuestState.KICKING, 
                excuse: null, // Clear excuse so penalties stop immediately
                wantsToast: false 
            } : g
          ));
          
          showMessage("滚出去！", "good");
          setScore(s => s + 100);

          // 2. Remove after animation
          setTimeout(() => {
              setGuests(prev => prev.map(g => 
                g.id === guestId ? { 
                    ...g, 
                    state: GuestState.EMPTY, 
                    respawnTimer: 0, 
                    respawnRetryMode: false
                } : g
              ));
          }, 800); // Matches CSS transition duration
      } else {
          showMessage("干嘛踹人家？！没礼貌！", "bad");
          setRespect(r => Math.max(0, r - 30));
      }
  };

  const handleGuestClick = (guestId: number) => {
      const guest = guests.find(g => g.id === guestId);
      if (!guest || guest.state === GuestState.EMPTY || guest.state === GuestState.KICKING) return;

      if (guest.excuse || guest.gender === Gender.FEMALE) {
          handleKickGuest(guestId);
          return;
      }

      if (guest.wantsToast) {
          if (cupFillLevel <= 5) {
              showMessage("杯子是空的！倒酒啊！", "neutral");
              return;
          }

          const isElder = guest.type === GuestType.ELDER;
          let msg = "";
          let pts = 0;
          let hp = 0;

          if (cupFillLevel > 100) {
              msg = "倒洒在客人身上了！丢人！";
              pts = -50;
              hp = -10;
          } else if (cupFillLevel >= 80) {
              msg = "倒得正好！'干杯！'";
              pts = isElder ? 300 : 150;
              hp = 20;
          } else if (cupFillLevel >= 50) {
              msg = "这酒倒的太随意了！";
              pts = -50;
              hp = -5;
          } else {
              msg = "养鱼呢？'就这点？'";
              pts = 0;
              hp = -10;
          }

          showMessage(msg, pts >= 50 ? 'good' : 'bad');
          setScore(s => s + pts);
          setRespect(r => Math.min(MAX_RESPECT, Math.max(0, r + hp)));
          
          setGuests(prev => prev.map(g => 
            g.id === guestId ? { ...g, wantsToast: false, toastTimer: 0 } : g
          ));
          setCupFillLevel(0);
      }
  };

  // -- Game Loop --
  const startGame = () => {
    setGameState(GameState.PLAYING);
    setRespect(MAX_RESPECT);
    setScore(0);
    setRotation(0);
    setHands([]);
    setGuests(GUESTS.map(g => ({ 
        ...g, 
        wantsToast: false, 
        toastTimer: 0, 
        state: GuestState.SEATED, 
        excuse: null, 
        respawnTimer: 0, 
        respawnRetryMode: false,
        excuseCheckAccumulator: 0 
    })));
    setCupFillLevel(0);
    isPouringRef.current = false;
    handsRef.current = [];
    rotationRef.current = 0;
    rotationVelocityRef.current = 0;
    setIsShaking(false);
    const now = performance.now();
    lastTimeRef.current = now;
    gameStartTimeRef.current = now;
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const spawnNewGuest = (g: Guest): Guest => {
      const newG = { ...g };
      newG.state = GuestState.SEATED;
      newG.excuse = null;
      newG.wantsToast = false;
      newG.excuseCheckAccumulator = 0;
      
      const isReserved = g.type === GuestType.ELDER || g.type === GuestType.CHILD;
      
      if (isReserved) {
          newG.gender = Gender.MALE; 
      } else {
          const isFemale = Math.random() < 0.4;
          newG.gender = isFemale ? Gender.FEMALE : Gender.MALE;
          newG.type = GuestType.ADULT;
          newG.name = isFemale 
              ? NAMES_FEMALE[Math.floor(Math.random() * NAMES_FEMALE.length)] 
              : NAMES_MALE[Math.floor(Math.random() * NAMES_MALE.length)];
          
          if (isFemale) {
              newG.excuseTimer = FEMALE_TOLERANCE_TIME; 
          }
      }
      return newG;
  };

  const gameLoop = (time: number) => {
    if (gameState !== GameState.PLAYING) return; 

    const deltaTime = time - (lastTimeRef.current || time);
    const gameDuration = time - gameStartTimeRef.current;
    lastTimeRef.current = time;

    // -- Pouring Physics --
    if (isPouringRef.current) {
        setCupFillLevel(prev => Math.min(120, prev + 2.5));
    }

    // -- CRITICAL: Check for Elder Disturbing (Continuous Drain) --
    let disturbingElder = false;
    if (isDraggingRef.current) {
        const elderId = guestsRef.current.find(g => g.type === GuestType.ELDER)?.id;
        const elderHand = handsRef.current.find(h => h.guestId === elderId);
        if (elderHand) {
            // Rapid HP Drain
            setRespect(prev => Math.max(0, prev - 1.5)); // Approx 90 HP per second if dragging
            disturbingElder = true;
        }
    }
    setIsShaking(disturbingElder);

    // -- CRITICAL: Pre-check penalties before state update clears the flags --
    guestsRef.current.forEach(g => {
        // Skip penalty checks if guest is being kicked
        if (g.state !== GuestState.SEATED) return;

        // 1. Toast Timer Expiration Check
        if (g.wantsToast && g.toastTimer > 0 && g.toastTimer - deltaTime <= 0) {
             showMessage(`${g.name} 生气了！（没敬酒）`, 'bad');
             setRespect(r => Math.max(0, r - TOAST_PENALTY));
        }
        
        // 2. Excuse Timer Expiration Check
        if (g.excuse && g.excuseTimer > 0 && g.excuseTimer - deltaTime <= 0) {
            showMessage(`你让 ${g.name} 躲酒了！太弱了！`, 'bad');
            setRespect(r => Math.max(0, r - 20));
        }

        // 3. Female Presence Timeout Check
        if (g.gender === Gender.FEMALE && g.excuseTimer > 0 && g.excuseTimer - deltaTime <= 0) {
             showMessage(`女人怎么上桌了？！不像话！`, 'bad');
             setRespect(r => Math.max(0, r - 30));
        }
        if (g.gender === Gender.FEMALE && g.excuseTimer <= 0) {
             setRespect(r => Math.max(0, r - 0.2));
        }
    });

    // -- GUEST LIFECYCLE UPDATE --
    setGuests(prevGuests => {
        let updated = false;
        const nextGuests = prevGuests.map(g => {
            const newG = { ...g };
            
            // 1. Handle Empty Seat & Respawn
            if (newG.state === GuestState.EMPTY) {
                newG.respawnTimer += deltaTime; 
                
                // Phase 1: Initial Delay (2s)
                if (!newG.respawnRetryMode) {
                    if (newG.respawnTimer >= RESPAWN_INITIAL_DELAY) {
                        if (Math.random() < RESPAWN_INITIAL_CHANCE) {
                            return spawnNewGuest(newG);
                        } else {
                            newG.respawnRetryMode = true;
                            newG.respawnTimer = 0; 
                            updated = true;
                        }
                    }
                } 
                // Phase 2: Retry Loop (Every 1s)
                else {
                    if (newG.respawnTimer >= RESPAWN_RETRY_INTERVAL) {
                        newG.respawnTimer -= RESPAWN_RETRY_INTERVAL; 
                        if (Math.random() < RESPAWN_RETRY_CHANCE) {
                             return spawnNewGuest(newG);
                        }
                        updated = true;
                    }
                }
                return newG;
            }

            // Skip KICKING state updates for logic
            if (newG.state === GuestState.KICKING) {
                return newG;
            }

            // 2. Handle Seated Guests
            
            // A. Female Guest Handling
            if (newG.gender === Gender.FEMALE) {
                newG.excuseTimer -= deltaTime;
                if (newG.excuseTimer > -1000) { // Keep updating for a bit to ensure UI bar is gone
                     updated = true;
                }
            }

            // B. Excuse Logic
            if (newG.excuse) {
                newG.excuseTimer -= deltaTime;
                updated = true; // FIX: Ensure UI updates for the timer bar
                if (newG.excuseTimer <= 0) {
                    newG.excuse = null;
                }
            } else if (
                gameDuration > 10000 && 
                newG.type !== GuestType.CHILD && 
                newG.type !== GuestType.ELDER && 
                newG.gender === Gender.MALE && 
                !newG.wantsToast && 
                newG.state === GuestState.SEATED
            ) {
                 newG.excuseCheckAccumulator += deltaTime;
                 if (newG.excuseCheckAccumulator >= EXCUSE_CHECK_INTERVAL) {
                     newG.excuseCheckAccumulator = 0; 
                     if (Math.random() < EXCUSE_PROBABILITY) {
                         newG.excuse = EXCUSES[Math.floor(Math.random() * EXCUSES.length)];
                         newG.excuseTimer = EXCUSE_TIME;
                         updated = true;
                     }
                 }
            }

            // C. Toast Logic
            if (newG.wantsToast && !newG.excuse && newG.gender === Gender.MALE) {
                newG.toastTimer -= deltaTime;
                updated = true; // FIX: Ensure UI updates for the circular timer
                if (newG.toastTimer <= 0) {
                    newG.wantsToast = false;
                }
            } else if (!newG.wantsToast && !newG.excuse && newG.gender === Gender.MALE && newG.type !== GuestType.CHILD) {
                // Start toast request
                if (Math.random() < 0.0005) {
                    newG.wantsToast = true;
                    newG.toastTimer = TOAST_WAIT_TIME;
                    updated = true;
                }
            }

            return newG;
        });

        guestsRef.current = nextGuests;
        return updated ? nextGuests : prevGuests;
    });

    // 1. Hand Spawn Logic
    const difficultyMultiplier = 1; 
    const spawnChance = 0.005 * difficultyMultiplier; 
    const seatedGuests = guestsRef.current.filter(g => g.state === GuestState.SEATED);

    if (Math.random() < spawnChance && handsRef.current.length === 0 && seatedGuests.length > 0) {
        const randomGuest = seatedGuests[Math.floor(Math.random() * seatedGuests.length)];
        let isNaughty = false;
        if (randomGuest.type === GuestType.CHILD) isNaughty = true;

        const newHand: HandEntity = {
            id: Date.now().toString(),
            guestId: randomGuest.id,
            state: 'reaching',
            startTime: time,
            isNaughty,
            targetRotation: !isNaughty ? Math.random() * 360 : undefined
        };
        
        if (!isNaughty) {
            const targetDish = DISHES[Math.floor(Math.random() * DISHES.length)];
            const guestScreenAngle = normalizeAngle(randomGuest.angle); 
            newHand.targetRotation = normalizeAngle(guestScreenAngle - targetDish.angle);
        }

        handsRef.current.push(newHand);
        setHands([...handsRef.current]);
    }

    // 2. Process Hands & Physics
    let isTableLocked = false;
    let naughtySpin = 0;

    const updatedHands = handsRef.current.map(hand => {
        const owner = guestsRef.current.find(g => g.id === hand.guestId);
        // Remove hand if owner is gone or being kicked
        if (!owner || owner.state === GuestState.EMPTY || owner.state === GuestState.KICKING) return null;

        const age = time - hand.startTime;
        
        if (hand.isNaughty) {
            if (age > 1000) { 
                naughtySpin = 15; 
                isTableLocked = true; 
            }
            return hand;
        } else {
            if (age < 1000) {
                return { ...hand, state: 'reaching' };
            } else if (age < 2500) {
                const current = normalizeAngle(rotationRef.current);
                const target = hand.targetRotation!;
                const diff = getShortestRotation(current, target);
                
                if (Math.abs(diff) > 2) {
                    rotationRef.current += diff * 0.1; 
                    rotationVelocityRef.current = diff * 0.1;
                    isTableLocked = true; 
                }
                return { ...hand, state: 'grabbing' };
            } else if (age < 4500) {
                 isTableLocked = true;
                 rotationVelocityRef.current = 0; 
                 return { ...hand, state: 'grabbing' };
            } else if (age < 5500) {
                return { ...hand, state: 'retracting' };
            } else {
                return null; 
            }
        }
    }).filter(Boolean) as HandEntity[];

    if (updatedHands.length !== handsRef.current.length) {
        setHands(updatedHands);
        handsRef.current = updatedHands;
    }

    // 3. Physics Application
    if (naughtySpin !== 0) {
        rotationRef.current += naughtySpin;
        rotationVelocityRef.current = naughtySpin;
    } else if (!isTableLocked && !isDraggingRef.current) {
        rotationRef.current += rotationVelocityRef.current;
        rotationVelocityRef.current *= 0.95;
        if (Math.abs(rotationVelocityRef.current) < 0.1) rotationVelocityRef.current = 0;
    }

    // 4. Win/Loss Logic
    const fishWorldAngle = normalizeAngle(rotationRef.current);
    const distToElder = Math.abs(getShortestRotation(fishWorldAngle, 270));
    const isAligned = distToElder < 20; 

    let respectChange = -RESPECT_DECAY_RATE; 

    if (handsRef.current.length === 0) {
        if (isAligned) {
            respectChange = RESPECT_GAIN_RATE;
        } else {
            respectChange = -PENALTY_FISH_WRONG; 
        }
    }

    setRespect(prev => {
        const newVal = Math.min(MAX_RESPECT, Math.max(0, prev + respectChange));
        if (newVal <= 0) {
            cancelAnimationFrame(requestRef.current!);
            setGameState(GameState.GAME_OVER);
        }
        return newVal;
    });

    if (isAligned && handsRef.current.length === 0) {
        setScore(s => s + 1); 
    }

    setRotation(rotationRef.current);
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
       requestRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
  }, [gameState]);


  const getFishStatusColor = () => {
    const fishWorldAngle = normalizeAngle(rotation);
    const distToElder = Math.abs(getShortestRotation(fishWorldAngle, 270));
    if (distToElder < 20) return 'text-green-500';
    if (distToElder < 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div 
        className={`w-full h-screen relative overflow-hidden flex flex-col items-center justify-center select-none bg-[#78281F] transition-colors duration-100 ${isShaking ? 'animate-shake bg-red-900/50' : ''}`}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
    >
      
      {/* UI: HUD */}
      {gameState === GameState.PLAYING && (
          <>
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-30 pointer-events-none">
                <div className="flex flex-col gap-2">
                    <div className="bg-black/40 backdrop-blur-md text-white p-2 rounded-lg border border-white/20">
                        <div className="text-xs uppercase tracking-wider opacity-70">面子 (HP)</div>
                        <div className="w-32 h-4 bg-gray-800 rounded-full mt-1 overflow-hidden border border-gray-600">
                            <div 
                                className={`h-full transition-all duration-300 ${respect < 30 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}
                                style={{ width: `${respect}%` }}
                            />
                        </div>
                    </div>
                    <div className="bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-lg border border-white/20 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span className="font-bold text-xl">{Math.floor(score)}</span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                     <div className={`bg-black/40 backdrop-blur-md px-3 py-2 rounded-lg border border-white/20 font-bold ${getFishStatusColor()}`}>
                         鱼头: {getFishStatusColor() === 'text-green-500' ? '对准了' : '歪了'}
                     </div>
                </div>
            </div>

            {/* Elder Disturbance Warning Overlay */}
            {isShaking && (
                <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
                    <div className="bg-red-600 text-white font-black text-4xl p-4 uppercase tracking-widest animate-ping border-4 border-yellow-400 shadow-2xl rotate-3">
                        长辈动筷了！
                    </div>
                </div>
            )}

            {message && (
                <div className={`absolute top-24 left-1/2 -translate-x-1/2 z-40 px-6 py-3 rounded-xl font-bold shadow-xl animate-bounce text-center backdrop-blur-md border-2
                    ${messageType === 'bad' ? 'bg-red-500/80 border-red-300 text-white' : 
                      messageType === 'good' ? 'bg-green-500/80 border-green-300 text-white' : 
                      'bg-black/60 border-gray-400 text-white'}`}>
                    {message}
                </div>
            )}
            
            <ToastHUD 
                fillLevel={cupFillLevel} 
                onPourStart={handlePourStart} 
                onPourEnd={handlePourEnd}
                onDump={handleDumpCup}
            />
          </>
      )}

      {/* Main Game Area */}
      <div className="relative w-full h-full max-w-2xl max-h-2xl flex items-center justify-center">
         
         {guests.map((guest) => {
             const activeHand = hands.find(h => h.guestId === guest.id);
             return (
                <GuestSeat 
                    key={guest.id} 
                    guest={guest} 
                    isActive={!!activeHand} 
                    onToastClick={handleGuestClick}
                    onKickClick={handleKickGuest}
                    tableRadius={tableRadius}
                />
             );
         })}

         <div className="relative z-10">
            <Table 
                rotation={rotation} 
                onPointerDown={handlePointerDown} 
                isLocked={hands.some(h => h.state === 'grabbing' || h.isNaughty)}
                onSizeChange={setTableRadius}
            />
         </div>

         {hands.map(hand => {
             const guest = guests.find(g => g.id === hand.guestId);
             if (!guest || guest.state === GuestState.EMPTY) return null;
             return (
                <Hand 
                    key={hand.id} 
                    hand={hand} 
                    guest={guest} 
                    onClick={() => slapHand(hand.id)} 
                    tableRadius={tableRadius}
                />
             );
         })}
      </div>

      {/* Menus */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center text-white p-6 text-center">
            <div className="mb-8 p-6 rounded-full bg-red-900 border-4 border-yellow-500 shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                <Fish className="w-24 h-24 text-yellow-400" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-yellow-500 mb-2 drop-shadow-md">鱼头大师</h1>
            <p className="text-xl md:text-2xl font-serif text-gray-300 mb-8 italic">"尊老敬贤，眼观六路"</p>
            
            <div className="max-w-md bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/10 mb-8 text-left space-y-3">
                <div className="flex items-start gap-3">
                    <div className="bg-yellow-500 p-1 rounded mt-1"><Crown className="w-4 h-4 text-black"/></div>
                    <p className="text-sm"><strong>规矩一：</strong> 鱼头必须对准主宾（长辈）。</p>
                </div>
                <div className="flex items-start gap-3">
                    <div className="bg-red-500 p-1 rounded mt-1"><AlertTriangle className="w-4 h-4 text-white"/></div>
                    <p className="text-sm"><strong>规矩二：</strong> 客人夹菜时别转桌。熊孩子乱转就抽他！</p>
                </div>
                <div className="flex items-start gap-3">
                    <div className="bg-blue-500 p-1 rounded mt-1"><Wine className="w-4 h-4 text-white"/></div>
                    <p className="text-sm"><strong>规矩三：</strong> 倒满酒，勤敬酒。</p>
                </div>
                <div className="flex items-start gap-3">
                    <div className="bg-fuchsia-500 p-1 rounded mt-1"><UserX className="w-4 h-4 text-white"/></div>
                    <p className="text-sm"><strong>规矩四：</strong> 找借口不喝的直接踹飞。女人不上桌，看到了直接踹！（老规矩！）</p>
                </div>
            </div>

            <button 
                onClick={startGame}
                className="group relative px-8 py-4 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-full text-xl transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(234,179,8,0.5)] flex items-center gap-3"
            >
                <Play className="fill-current" />
                开席
            </button>
        </div>
      )}

      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center text-white p-6 text-center animate-in fade-in duration-500">
            <h2 className="text-5xl font-black text-red-500 mb-4">丢人现眼！</h2>
            <p className="text-xl text-gray-300 mb-6">家族的面子都被你丢光了。</p>
            
            <div className="bg-white/10 p-8 rounded-2xl mb-8 border border-white/20">
                <div className="text-sm uppercase tracking-widest text-gray-400 mb-2">最终得分</div>
                <div className="text-6xl font-bold text-yellow-400">{Math.floor(score)}</div>
            </div>

            <button 
                onClick={startGame}
                className="px-8 py-4 bg-white text-black font-bold rounded-full text-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
                <RefreshCw className="w-5 h-5" />
                再来一次
            </button>
        </div>
      )}

      <div className="absolute bottom-4 left-4 text-white/20 text-xs text-left pointer-events-none z-0 hidden sm:block">
          拖动转桌 • 点击手背制止 <br/> 敬酒 • 踹飞借口多的人
      </div>
    </div>
  );
}