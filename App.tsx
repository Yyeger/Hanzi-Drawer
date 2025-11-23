import React, { useState, useCallback } from 'react';
import HomePage from './HomePage';
import DrawingPage from './DrawingPage';
import StatsPage from './StatsPage';
import type { DrawingMode } from './types';

export default function App(): React.ReactNode {
  const [view, setView] = useState<'home' | 'drawing' | 'stats'>('home');
  const [hskLevel, setHskLevel] = useState<number>(1);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('level');

  const handleStartDrawing = useCallback((level: number) => {
    setHskLevel(level);
    setDrawingMode('level');
    setView('drawing');
  }, []);

  const handleStartSmartReview = useCallback(() => {
    setDrawingMode('smart_review');
    setView('drawing');
  }, []);

  const handleGoHome = useCallback(() => {
    setView('home');
  }, []);

  const handleViewStats = useCallback(() => {
    setView('stats');
  }, []);

  const renderContent = () => {
    switch (view) {
      case 'drawing':
        return <DrawingPage mode={drawingMode} level={drawingMode === 'level' ? hskLevel : undefined} onGoHome={handleGoHome} />;
      case 'stats':
        return <StatsPage onGoHome={handleGoHome} />;
      case 'home':
      default:
        return <HomePage 
                  defaultLevel={hskLevel} 
                  onStart={handleStartDrawing} 
                  onViewStats={handleViewStats} 
                  onStartSmartReview={handleStartSmartReview}
                />;
    }
  };

  return (
    <main 
      className="min-h-screen w-full bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex items-center justify-center p-4"
    >
      {renderContent()}
    </main>
  );
}