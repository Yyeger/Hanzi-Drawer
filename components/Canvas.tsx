
import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import type { CanvasRef, HanziWriterMistake } from '../types';

declare const HanziWriter: any;

interface CanvasProps {
  character: string;
  onComplete: (summary: { character: string; totalMistakes: number }) => void;
  onMistake: (mistake: HanziWriterMistake) => void;
  onCorrectStroke: () => void;
  onHistoryChange: (canUndo: boolean) => void;
  showHint?: boolean;
}

const CanvasComponent: React.ForwardRefRenderFunction<CanvasRef, CanvasProps> = 
  ({ character, onComplete, onMistake, onCorrectStroke, onHistoryChange, showHint }, ref) => {
    
  const targetRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<any | null>(null);
  const [isWriterReady, setIsWriterReady] = useState(false);
  const drawnStrokeCount = useRef(0);

  // Use refs for callbacks to ensure the writer's callbacks always have the latest functions
  // without needing to re-create the writer instance.
  const onCompleteRef = useRef(onComplete);
  const onMistakeRef = useRef(onMistake);
  const onCorrectStrokeRef = useRef(onCorrectStroke);
  const onHistoryChangeRef = useRef(onHistoryChange);
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onMistakeRef.current = onMistake;
    onCorrectStrokeRef.current = onCorrectStroke;
    onHistoryChangeRef.current = onHistoryChange;
  });

  const startQuiz = (writer: any) => {
    drawnStrokeCount.current = 0;
    onHistoryChangeRef.current(false);
    writer.quiz({
      onCorrectStroke: (data: any) => {
        drawnStrokeCount.current++;
        onCorrectStrokeRef.current();
        onHistoryChangeRef.current(true);
      },
      onMistake: (data: HanziWriterMistake) => {
        drawnStrokeCount.current++;
        onMistakeRef.current(data);
        onHistoryChangeRef.current(true);
      },
      onComplete: (summary: { character: string; totalMistakes: number }) => {
        onCompleteRef.current(summary);
        onHistoryChangeRef.current(false); // Can't undo after completion
      }
    });
  };

  useEffect(() => {
    if (!targetRef.current || !character || typeof HanziWriter === 'undefined') return;

    if (writerRef.current) {
      writerRef.current.target.innerHTML = '';
    }

    const { width, height } = targetRef.current.getBoundingClientRect();

    const writer = HanziWriter.create(targetRef.current, character, {
      width: width,
      height: height,
      padding: 5,
      showOutline: false,
      showCharacter: false,
      strokeColor: '#000000',
      outlineColor: '#CCCCCC',
      radicalColor: '#FF6B6B',
      drawingWidth: 14,
      strokeAnimationSpeed: 2,
      delayBetweenStrokes: 200,
      quizStartAndEndStrokes: character,
    });
    
    writerRef.current = writer;
    setIsWriterReady(true);
    
    startQuiz(writer);

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        writer.updateDimensions({ width, height });
      }
    });

    if (targetRef.current) {
      resizeObserver.observe(targetRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [character]);

  useEffect(() => {
    if (!isWriterReady || !writerRef.current) return;
    if (showHint) {
      writerRef.current.showOutline();
    } else {
      writerRef.current.hideOutline();
    }
  }, [showHint, isWriterReady]);

  useImperativeHandle(ref, () => ({
    undo: () => {
      if (!writerRef.current || drawnStrokeCount.current < 1) return;
      drawnStrokeCount.current--;
      writerRef.current.undo();
      onHistoryChangeRef.current(drawnStrokeCount.current > 0);
    },
    resetQuiz: () => {
      if (writerRef.current) {
        startQuiz(writerRef.current);
      }
    },
  }));

  return (
    <div
      ref={targetRef}
      className="hanzi-grid bg-white border border-slate-200 dark:border-slate-700 rounded-lg w-full h-56 sm:h-64 md:h-72 cursor-crosshair touch-none"
    />
  );
};

export const Canvas = forwardRef(CanvasComponent);
