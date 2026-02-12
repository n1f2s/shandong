import { Dish, Guest, GuestType, Gender, GuestState } from "./types";

export const GUEST_COUNT = 8;
export const TABLE_RADIUS = 140; // Pixels
export const TABLE_CENTER_X = window.innerWidth / 2;
export const TABLE_CENTER_Y = window.innerHeight / 2;

// Generate Guests
export const GUESTS: Guest[] = Array.from({ length: GUEST_COUNT }).map((_, i) => {
  const angle = (i * 360) / GUEST_COUNT;
  let type = GuestType.ADULT;
  let name = `客人 ${i}`;
  let gender = Gender.MALE;

  if (i === 0) {
    type = GuestType.ELDER;
    name = "大舅";
  } else if (i === 3 || i === 5) {
    type = GuestType.CHILD;
    name = "外甥";
  }

  return { 
    id: i, 
    type, 
    gender,
    state: GuestState.SEATED,
    angle: angle - 90, 
    name,
    wantsToast: false,
    toastTimer: 0,
    excuse: null,
    excuseTimer: 0,
    excuseCheckAccumulator: 0,
    respawnTimer: 0,
    respawnRetryMode: false
  }; // -90 to start from top
});

// Generate Dishes
export const DISHES: Dish[] = [
  { id: 0, type: 'fish', angle: 0, label: '红烧鱼' }, // Fish head at 0 deg relative to table
  { id: 1, type: 'vegetable', angle: 45, label: '油菜' },
  { id: 2, type: 'meat', angle: 90, label: '红烧肉' },
  { id: 3, type: 'soup', angle: 135, label: '蛋花汤' },
  { id: 4, type: 'vegetable', angle: 180, label: '西兰花' },
  { id: 5, type: 'meat', angle: 225, label: '烤鸭' },
  { id: 6, type: 'vegetable', angle: 270, label: '豆腐' },
  { id: 7, type: 'meat', angle: 315, label: '烧鸡' },
];

export const EXCUSES = [
  "我开车了。",
  "医生说不能喝。",
  "一会还有会。",
  "胃疼。",
  "我就喝茶。",
  "老婆会骂我。"
];

export const NAMES_MALE = ["张叔", "李哥", "王总", "老刘", "陈弟"];
export const NAMES_FEMALE = ["王姨", "赵姐", "孙女士", "吴妹", "钱姐"];

export const MAX_RESPECT = 100;
export const RESPECT_DECAY_RATE = 0.05; // Base decay per frame
export const RESPECT_GAIN_RATE = 0.1; // Gain when fish is correct
export const PENALTY_RUDE_MOVE = 10; // Penalty for moving table while someone eats
export const PENALTY_FISH_WRONG = 0.05; // Extra decay when fish is wrong position
export const TOAST_WAIT_TIME = 8000; // ms before they get mad about no toast
export const TOAST_PENALTY = 15; // Penalty for ignoring a toast
export const EXCUSE_TIME = 5000; // Time to kick someone making an excuse
export const FEMALE_TOLERANCE_TIME = 4000; // Time to kick a female guest before penalty

// New Constants for Probabilities
export const EXCUSE_CHECK_INTERVAL = 1000; // Check every 1s
export const EXCUSE_PROBABILITY = 0.04; // 4% chance per second

export const RESPAWN_INITIAL_DELAY = 2000; // Wait 2s after leaving
export const RESPAWN_INITIAL_CHANCE = 0.5; // 50% chance after 2s
export const RESPAWN_RETRY_INTERVAL = 1000; // If failed, try every 1s
export const RESPAWN_RETRY_CHANCE = 0.8; // 80% chance on retry