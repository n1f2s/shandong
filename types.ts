export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export enum GuestType {
  ELDER = 'ELDER',
  ADULT = 'ADULT',
  CHILD = 'CHILD',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum GuestState {
  SEATED = 'SEATED',
  EMPTY = 'EMPTY',
  KICKING = 'KICKING',
}

export interface Guest {
  id: number;
  type: GuestType;
  gender: Gender;
  state: GuestState;
  angle: number; // Position around the table (degrees)
  name: string;
  wantsToast: boolean; // Is waiting for a drink
  toastTimer: number; // Time until they get angry
  excuse: string | null; // The excuse they are making
  excuseTimer: number; // Time left to kick them
  
  // New Logic Fields
  excuseCheckAccumulator: number; // Accumulates time to trigger the 1s check
  respawnTimer: number; // Tracks time since empty or since last check
  respawnRetryMode: boolean; // False = waiting for initial 2s, True = looping every 1s
}

export interface HandEntity {
  id: string;
  guestId: number;
  state: 'reaching' | 'grabbing' | 'retracting';
  targetRotation?: number; // The rotation the NPC wants to force the table to
  isNaughty: boolean; // If true, spins the table continuously
  startTime: number;
}

export interface Dish {
  id: number;
  type: 'fish' | 'vegetable' | 'meat' | 'soup';
  angle: number; // Position on the turntable
  label: string;
}