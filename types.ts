
export interface HanziWord {
  hanzi: string;
  pinyin: string;
  meaning: string;
  hskLevel: number;
}

export interface Feedback {
  isCorrect: boolean;
  text: string;
}

export interface HanziWriterMistake {
    strokeNum: number;
    mistakeType: 'STROKE_ORDER' | 'RADICAL_ORDER' | 'STROKE_DIRECTION' | 'STROKE_SHAPE' | 'TOO_MANY_STROKES' | 'TOO_FEW_STROKES';
    mistakePosition: { x: number; y: number };
    isRadical: boolean;
}

export interface CanvasRef {
  undo: () => void;
  resetQuiz: () => void;
}

export interface WordStat extends HanziWord {
  attempts: number;
  precision: number;
}

export type DrawingMode = 'level' | 'smart_review';

export interface DashboardStats {
  wordsStudied: number;
  studyStreak: number;
}