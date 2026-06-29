export interface QuizOption {
  id: string;
  text: string;
  next: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
}

export interface QuizResults {
  mbti: string;
  dominantFriction: string[];
}
