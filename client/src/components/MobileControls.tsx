import React, { useRef, useState } from 'react';
import { Target } from 'lucide-react';

interface MobileControlsProps {
  onMove: (vector: { x: number; y: number }) => void;
  onCatch: () => void;
  isSeeker: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ onMove, onCatch, isSeeker }) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    updateJoystick(e.touches[0]);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    updateJoystick(e.touches[0]);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setKnobPos({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  };

  const updateJoystick = (touch: React.Touch) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const distance = Math.min(45, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx);

    const knobX = distance * Math.cos(angle);
    const knobY = distance * Math.sin(angle);

    setKnobPos({ x: knobX, y: knobY });

    onMove({
      x: knobX / 45,
      y: knobY / 45,
    });
  };

  return (
    <div className="fixed bottom-6 left-6 right-6 pointer-events-none flex justify-between items-end z-40 select-none">
      <div
        ref={joystickRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-32 h-32 rounded-full bg-slate-900/60 border-2 border-indigo-500/40 backdrop-blur-md relative pointer-events-auto flex items-center justify-center shadow-xl"
      >
        <div
          className="w-12 h-12 rounded-full bg-indigo-500/80 border border-white shadow-lg transition-transform duration-75"
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          }}
        />
      </div>

      {isSeeker && (
        <button
          onClick={onCatch}
          className="w-20 h-20 rounded-full bg-red-600/90 border-2 border-red-400 text-white font-bold pointer-events-auto flex flex-col items-center justify-center active:scale-95 transition-transform shadow-2xl shadow-red-600/50"
        >
          <Target className="w-8 h-8 animate-pulse" />
          <span className="text-[10px] tracking-wider uppercase mt-1">TAG</span>
        </button>
      )}
    </div>
  );
};
