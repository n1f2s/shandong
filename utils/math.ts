export const normalizeAngle = (angle: number): number => {
  let a = angle % 360;
  if (a < 0) a += 360;
  return a;
};

export const getShortestRotation = (current: number, target: number): number => {
  const diff = (target - current + 180) % 360 - 180;
  return diff < -180 ? diff + 360 : diff;
};

export const degToRad = (deg: number) => (deg * Math.PI) / 180;

export const dist = (x1: number, y1: number, x2: number, y2: number) => 
  Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
