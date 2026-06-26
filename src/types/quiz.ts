export type MBTIAxis = 'E' | 'I' | 'N' | 'S' | 'T' | 'F' | 'J' | 'P';
export type FrictionSignal = 'EMO' | 'MOT' | 'ORG' | 'ATT' | 'ENG' | 'FAT';

export interface QuizOption {
  id: string;
  text: string;
  mbti: MBTIAxis[];
  friction: FrictionSignal[];
  next: string;
}

export interface QuizResults {
  mbti: string;
  dominantFriction: FrictionSignal[];
}
