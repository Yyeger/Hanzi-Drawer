
import { HANZI_WORDS } from '../constants';
import type { HanziWord, WordStat } from '../types';

const STATS_STORAGE_KEY = 'hanzi-drawer-stats-v4';
const REVIEW_THRESHOLD_PERCENTAGE = 50;
const MAX_ATTEMPT_HISTORY = 3;

interface Attempt {
  mistakes: number;
  totalStrokes: number;
}

interface CharacterStats {
  totalAttempts: number;
  attemptsHistory: Attempt[];
}

interface Stats {
  [character: string]: CharacterStats;
}

interface AppData {
  stats: Stats;
  studyDays: number[]; // Array of unique timestamps (day start)
}

export interface DashboardStats {
  wordsStudied: number;
  studyStreak: number;
}

const getAppData = (): AppData => {
  try {
    const dataJson = localStorage.getItem(STATS_STORAGE_KEY);
    if (dataJson) {
      return JSON.parse(dataJson);
    }
  } catch (error) {
    console.error("Failed to parse app data from localStorage", error);
    localStorage.removeItem(STATS_STORAGE_KEY);
  }
  // Return default structure if no data or parsing failed
  return { stats: {}, studyDays: [] };
};

const saveAppData = (appData: AppData): void => {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(appData));
  } catch (error) {
    console.error("Failed to save app data to localStorage", error);
  }
}

const calculateStreak = (studyDays: number[]): number => {
    if (studyDays.length === 0) return 0;

    const uniqueSortedDays = [...new Set(studyDays)].sort((a, b) => b - a);

    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayMidnight = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).getTime();
    
    let streak = 0;
    let lastDate: number;

    if (uniqueSortedDays[0] === todayMidnight) {
        streak = 1;
        lastDate = todayMidnight;
    } else if (uniqueSortedDays[0] === yesterdayMidnight) {
        streak = 1;
        lastDate = yesterdayMidnight;
    } else {
        return 0; // Streak broken
    }

    for (let i = 1; i < uniqueSortedDays.length; i++) {
        const currentDate = uniqueSortedDays[i];
        const expectedPreviousDate = new Date(lastDate);
        expectedPreviousDate.setDate(expectedPreviousDate.getDate() - 1);
        
        if (currentDate === expectedPreviousDate.getTime()) {
            streak++;
            lastDate = currentDate;
        } else {
            break; // Gap found
        }
    }

    return streak;
}


export const getDashboardStats = (): DashboardStats => {
    const appData = getAppData();
    return {
        wordsStudied: Object.keys(appData.stats).length,
        studyStreak: calculateStreak(appData.studyDays),
    };
}


export const updateStat = (character: string, mistakesMade: number, totalStrokesInChar: number): void => {
  if (totalStrokesInChar === 0) return;

  const appData = getAppData();
  const stats = appData.stats;

  if (!stats[character]) {
    stats[character] = { totalAttempts: 0, attemptsHistory: [] };
  }
  
  const charStats = stats[character];
  charStats.totalAttempts += 1;

  const newAttempt = { mistakes: mistakesMade, totalStrokes: totalStrokesInChar };
  charStats.attemptsHistory.push(newAttempt);

  if (charStats.attemptsHistory.length > MAX_ATTEMPT_HISTORY) {
    charStats.attemptsHistory.shift(); 
  }

  // Update study days
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  if (!appData.studyDays.includes(todayMidnight)) {
      appData.studyDays.push(todayMidnight);
      appData.studyDays.sort((a,b) => a - b);
  }

  saveAppData(appData);
};

export const getAllStatsWithDetails = (): WordStat[] => {
    const stats = getAppData().stats;
    const wordMap: Map<string, HanziWord> = new Map();

    HANZI_WORDS.forEach(word => {
        if (!word || typeof word.pinyin !== 'string' || typeof word.hanzi !== 'string') {
            return; // Skip malformed entries to prevent crashes
        }
        const pinyinParts = word.pinyin.split(' ');
        word.hanzi.split('').forEach((char, index) => {
            if (!wordMap.has(char)) {
                wordMap.set(char, {
                    hanzi: char,
                    pinyin: pinyinParts[index] || '',
                    meaning: `Part of "${word.meaning}"`,
                    hskLevel: word.hskLevel,
                });
            }
        });
    });

    return Object.entries(stats)
        .map(([character, statData]) => {
            const wordDetails = wordMap.get(character);
            if (!wordDetails || !statData.attemptsHistory || statData.attemptsHistory.length === 0) {
                return null;
            }
            
            const recentAttempts = statData.attemptsHistory;
            const recentMistakes = recentAttempts.reduce((sum, attempt) => sum + attempt.mistakes, 0);
            const recentStrokes = recentAttempts.reduce((sum, attempt) => sum + attempt.totalStrokes, 0);

            const precision = recentStrokes > 0 
                ? Math.max(0, ((recentStrokes - recentMistakes) / recentStrokes) * 100)
                : 0;
                
            return {
                ...wordDetails,
                attempts: statData.totalAttempts,
                precision,
            };
        })
        .filter((item): item is WordStat => item !== null)
        .map(stat => {
            const originWord = HANZI_WORDS.find(w => w.hanzi.includes(stat.hanzi));
            return { ...stat, meaning: originWord?.meaning || stat.meaning };
        });
};


export const getWordsForReview = (): HanziWord[] => {
    const allStats = getAllStatsWithDetails();
    const wordsToReviewMap = new Map<string, HanziWord>();

    const characterStats = allStats.filter(stat => stat.precision < REVIEW_THRESHOLD_PERCENTAGE);

    characterStats.forEach(stat => {
        const originWord = HANZI_WORDS.find(w => w.hanzi.includes(stat.hanzi));
        if (originWord && !wordsToReviewMap.has(originWord.hanzi)) {
            wordsToReviewMap.set(originWord.hanzi, originWord);
        }
    });
    
    return Array.from(wordsToReviewMap.values());
};
