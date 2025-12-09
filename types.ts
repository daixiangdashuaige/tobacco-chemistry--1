export interface Question {
  id: string | number;
  question: string;
  options: string[];
  answer: number; // Index of the correct answer (0-3)
  explanation?: string; // Static explanation
}

export enum QuizMode {
  PRACTICE = 'PRACTICE', // Normal mode
  REVIEW_WRONG = 'REVIEW_WRONG', // Wrong answers only
}

export interface AnswerState {
  selectedOption: number | null; // Index of selected option
  isCorrect: boolean;
}

// Map of Question ID -> AnswerState
export type UserAnswers = Record<string | number, AnswerState>;

export type ImportMode = 'append' | 'overwrite';