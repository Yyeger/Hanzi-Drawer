
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { HANZI_WORDS } from './constants';
import type { HanziWord, CanvasRef, DrawingMode, HanziWriterMistake } from './types';
import { updateStat, getWordsForReview } from './services/statsService';
import { Canvas } from './components/Canvas';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { CheckIcon, XIcon, UndoIcon, LightbulbIcon, HomeIcon } from './components/icons';

declare global {
  interface Window {
    HanziWriter: any;
  }
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const getOrdinalString = (index: number): string => {
  const ordinals = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
  if (index < ordinals.length) {
    return ordinals[index];
  }
  const j = index + 1;
  const lastDigit = j % 10;
  const lastTwoDigits = j % 100;
  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return `${j}st`;
  }
  if (lastDigit === 2 && lastTwoDigits !== 12) {
    return `${j}nd`;
  }
  if (lastDigit === 3 && lastTwoDigits !== 13) {
    return `${j}rd`;
  }
  return `${j}th`;
};

const getMeaningFontSize = (meaning: string): string => {
    const len = meaning.length;
    if (len > 35) return 'text-xl md:text-2xl';
    if (len > 20) return 'text-2xl md:text-3xl';
    return 'text-3xl md:text-4xl';
};

interface DrawingPageProps {
  mode: DrawingMode;
  level?: number;
  onGoHome: () => void;
}

export default function DrawingPage({ mode, level, onGoHome }: DrawingPageProps): React.ReactNode {
  const [words, setWords] = useState<HanziWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [wordCharData, setWordCharData] = useState<any[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [mistakeMessage, setMistakeMessage] = useState<string | null>(null);
  const [intermediateFeedback, setIntermediateFeedback] = useState<string>('');
  const [canUndo, setCanUndo] = useState(false);
  const [showHint, setShowHint] = useState(false);
  
  const canvasRef = useRef<CanvasRef>(null);

  const resetForNewWord = useCallback(() => {
    setIsComplete(false);
    setMistakeMessage(null);
    setIntermediateFeedback('');
    setShowHint(false);
    setCanUndo(false);
    setCurrentCharIndex(0);
    setWordCharData([]);
  }, []);

  useEffect(() => {
    let wordsToPractice: HanziWord[];
    if (mode === 'smart_review') {
        const reviewWords = getWordsForReview();
        wordsToPractice = shuffleArray(reviewWords);
    } else {
        wordsToPractice = HANZI_WORDS.filter(w => w.hskLevel === level);
    }
    
    setWords(shuffleArray(wordsToPractice));
    setCurrentIndex(0);
    resetForNewWord();
  }, [mode, level, resetForNewWord]);

  const currentWord: HanziWord | undefined = words[currentIndex];

  useEffect(() => {
    const loadData = async () => {
        if (!currentWord) return;
        setWordCharData([]); // Clear old data
        try {
            const dataPromises = currentWord.hanzi.split('').map(char => window.HanziWriter.loadCharacterData(char));
            const loadedData = await Promise.all(dataPromises);
            setWordCharData(loadedData);
        } catch (e) {
            console.error("Failed to load character data for", currentWord.hanzi, e);
            onGoHome(); // Fail gracefully
        }
    };
    loadData();
  }, [currentWord, onGoHome]);

  const currentCharacter: string | undefined = currentWord?.hanzi[currentCharIndex];
  
  const goToNextWord = useCallback(() => {
    setCurrentIndex((prevIndex) => {
        const next = prevIndex + 1;
        if (next >= words.length) {
            onGoHome();
            return prevIndex;
        }
        return next;
    });
    resetForNewWord();
  }, [words.length, onGoHome, resetForNewWord]);
  
  const handleComplete = useCallback((summary: { character: string; totalMistakes: number }) => {
    if (!currentWord || !wordCharData[currentCharIndex]) return;

    const charData = wordCharData[currentCharIndex];
    const totalStrokes = charData.strokes.length;
    updateStat(summary.character, summary.totalMistakes, totalStrokes);

    if (currentCharIndex === currentWord.hanzi.length - 1) {
      // Last character of the word is done
      setIsComplete(true);
      setMistakeMessage(null);
      setIntermediateFeedback('');
    } else {
      // Move to next character
      setIntermediateFeedback('✓ Well done! Now for the next character.');
      setTimeout(() => setIntermediateFeedback(''), 2500);
      setCurrentCharIndex(prev => prev + 1);
      setCanUndo(false);
    }
  }, [currentWord, currentCharIndex, wordCharData]);
  
  const getMistakeMessage = (mistake: HanziWriterMistake): string => {
      switch(mistake.mistakeType) {
          case 'STROKE_ORDER': return `Incorrect stroke order. Stroke #${mistake.strokeNum + 1} is not next.`;
          case 'STROKE_DIRECTION': return `Incorrect stroke direction. Try again.`;
          case 'STROKE_SHAPE': return `Stroke shape is a bit off. Try again.`;
          case 'TOO_MANY_STROKES': return 'This character has fewer strokes.';
          default: return 'Something is not quite right. Try again.';
      }
  }

  const handleMistake = useCallback((mistake: HanziWriterMistake) => {
    setMistakeMessage(getMistakeMessage(mistake));
    setIntermediateFeedback('');
    setTimeout(() => setMistakeMessage(null), 2500);
  }, []);

  const handleCorrectStroke = useCallback(() => {
      setMistakeMessage(null);
  }, [])

  const handleTryAgain = useCallback(() => {
     canvasRef.current?.resetQuiz();
  }, []);

  const handleHistoryChange = useCallback((canUndoNow: boolean) => {
    setCanUndo(canUndoNow);
  }, []);

  const toggleHint = useCallback(() => {
    setShowHint(prev => !prev);
  }, []);

  const pageTitle = mode === 'smart_review' ? 'Smart Review' : `HSK Level ${level}`;

  const renderFooterFeedback = () => {
    let feedbackDetails = null;

    if (isComplete) {
      feedbackDetails = {
        type: 'success',
        bgColor: 'bg-green-100 dark:bg-green-900/50 border border-green-400/50',
        icon: <CheckIcon className="w-8 h-8 text-green-500 mr-3"/>,
        title: 'Completed!',
        titleColor: 'text-green-700 dark:text-green-300',
        message: 'Great job! Ready for the next one?',
      };
    } else if (mistakeMessage) {
      feedbackDetails = {
        type: 'error',
        bgColor: 'bg-red-100 dark:bg-red-900/50 border border-red-400/50',
        icon: <XIcon className="w-8 h-8 text-red-500 mr-3"/>,
        title: 'Mistake!',
        titleColor: 'text-red-700 dark:text-red-300',
        message: mistakeMessage,
      };
    } else if (intermediateFeedback) {
      feedbackDetails = {
        type: 'info',
        bgColor: 'bg-blue-100 dark:bg-blue-900/50 border border-blue-400/50',
        icon: <CheckIcon className="w-8 h-8 text-blue-500 mr-3"/>,
        title: 'Good Job!',
        titleColor: 'text-blue-700 dark:text-blue-300',
        message: intermediateFeedback,
      };
    }

    if (!feedbackDetails) return null;

    return (
      <div className={`p-4 rounded-lg animate-fade-in max-w-2xl mx-auto ${feedbackDetails.bgColor}`}>
        <div className="flex items-center justify-center">
          {feedbackDetails.icon}
          <div className="text-left">
            <p className={`font-bold text-lg ${feedbackDetails.titleColor}`}>
              {feedbackDetails.title}
            </p>
            <p className="text-slate-600 dark:text-slate-300">{feedbackDetails.message}</p>
          </div>
        </div>
      </div>
    );
  };
  

  if (words.length === 0 && mode === 'smart_review') {
    return (
        <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">
              No words to review right now. Great job!
            </h2>
            <Button onClick={onGoHome}>
                <HomeIcon className="w-5 h-5 mr-2" />
                Back to Home
            </Button>
        </div>
    );
  }

  if (!currentWord || (currentWord.hanzi.length > 0 && wordCharData.length === 0) || !currentCharacter) {
      return (
        <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Loading...</h2>
        </div>
    );
  }

  const pinyinParts = currentWord.pinyin.split(' ');
  const currentPinyin = pinyinParts[currentCharIndex];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <header className="text-center mb-4 relative">
        <Button onClick={onGoHome} variant="secondary" className="absolute top-0 left-0">
          <HomeIcon className="w-5 h-5 sm:mr-2" /><span className="hidden sm:inline">Home</span>
        </Button>
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500">Hanzi Drawer</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">{pageTitle} ({currentIndex + 1} / {words.length})</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-2">Meaning & Pinyin:</p>
            <p className={`${getMeaningFontSize(currentWord.meaning)} font-semibold capitalize`}>{currentWord.meaning}</p>
            <p className="text-2xl text-red-500 font-mono mt-2">{currentWord.pinyin}</p>
            <div className="mt-6">
               <Button onClick={toggleHint} variant="secondary" disabled={isComplete}>
                  <LightbulbIcon className="w-5 h-5 mr-2"/>
                  {showHint ? 'Hide Hint' : 'Show Hint'}
               </Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col items-center">
             <div className="h-16 mb-4 flex items-center justify-center">
                {currentWord.hanzi.length > 1 ? (
                  <p className="text-xl text-slate-500 dark:text-slate-400 text-center" aria-live="polite">
                    Write the {getOrdinalString(currentCharIndex)} hanzi: <span className="font-semibold text-red-500 font-mono">{currentPinyin}</span>
                  </p>
                ) : (
                  <p className="text-xl text-slate-500 dark:text-slate-400">Draw the character</p>
                )}
              </div>
            <Canvas 
              ref={canvasRef}
              key={`${currentWord.hanzi}-${currentCharIndex}`}
              character={currentCharacter}
              onComplete={handleComplete}
              onMistake={handleMistake}
              onCorrectStroke={handleCorrectStroke}
              onHistoryChange={handleHistoryChange}
              showHint={showHint}
            />
            <div className="mt-4 w-full flex justify-center items-center flex-wrap gap-2 sm:gap-4">
               <Button onClick={() => canvasRef.current?.undo()} variant="secondary" disabled={!canUndo || isComplete}>
                 <UndoIcon className="w-5 h-5 mr-2"/>
                 Undo
               </Button>
               <Button onClick={handleTryAgain} variant="secondary">
                 Try Again
               </Button>
               <Button onClick={goToNextWord} disabled={!isComplete} size="lg" className="flex-grow sm:flex-grow-0 mt-2 sm:mt-0">
                  Next Word →
               </Button>
            </div>
          </div>
        </Card>
      </main>
      
      <footer className="mt-4 text-center h-20 flex items-center justify-center">
        {renderFooterFeedback()}
      </footer>
    </div>
  );
}
