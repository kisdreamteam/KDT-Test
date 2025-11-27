'use client';

import { useState, useEffect, useRef } from 'react';

interface TimerProps {
  onClose: () => void;
}

export default function Timer({ onClose }: TimerProps) {
  const [activeTab, setActiveTab] = useState<'stopwatch' | 'countdown'>('countdown');
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(600); // 10:00 in seconds (600 seconds)
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState(0);

  // Countdown state
  const [countdownMinutes, setCountdownMinutes] = useState(10);
  const [countdownSeconds, setCountdownSeconds] = useState(0);

  useEffect(() => {
    if (isRunning) {
      if (activeTab === 'stopwatch') {
        intervalRef.current = setInterval(() => {
          setStopwatchTime((prev) => prev + 1);
        }, 1000);
      } else {
        intervalRef.current = setInterval(() => {
          setTime((prev) => {
            if (prev <= 0) {
              setIsRunning(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, activeTab]);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (activeTab === 'stopwatch') {
      setStopwatchTime(0);
    } else {
      setTime(countdownMinutes * 60 + countdownSeconds);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return {
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
    };
  };

  const handleTabChange = (tab: 'countdown' | 'stopwatch') => {
    if (isRunning) {
      setIsRunning(false);
    }
    setActiveTab(tab);
    if (tab === 'countdown') {
      setTime(countdownMinutes * 60 + countdownSeconds);
    }
  };

  const handleMinutesChange = (value: number) => {
    const newMinutes = Math.max(0, Math.min(99, value));
    setCountdownMinutes(newMinutes);
    if (!isRunning) {
      setTime(newMinutes * 60 + countdownSeconds);
    }
  };

  const handleSecondsChange = (value: number) => {
    const newSeconds = Math.max(0, Math.min(59, value));
    setCountdownSeconds(newSeconds);
    if (!isRunning) {
      setTime(countdownMinutes * 60 + newSeconds);
    }
  };

  const displayTime = activeTab === 'stopwatch' 
    ? formatTime(stopwatchTime)
    : formatTime(time);

  return (
    <div className="fixed inset-0 bg-[#4A3B8D] z-50 flex items-center justify-center">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-10 right-10 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors z-10"
      >
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <div className="w-full max-w-4xl px-8">
        {/* Tabs */}
        <div className="flex gap-12 mb-10">
          <button
            onClick={() => handleTabChange('countdown')}
            className="text-3xl font-semibold pb-3 transition-colors text-white"
            style={{
              borderBottom: `3px solid ${activeTab === 'countdown' ? 'white' : '#4A3B8D'}`,
            }}
          >
            Countdown
          </button>
          <button
            onClick={() => handleTabChange('stopwatch')}
            className="text-3xl font-semibold pb-3 transition-colors text-white"
            style={{
              borderBottom: `3px solid ${activeTab === 'stopwatch' ? 'white' : '#4A3B8D'}`,
            }}
          >
            Stopwatch
          </button>
        </div>

        {/* Timer Display */}
        <div className="bg-pink-600 rounded-3xl p-[60px] mb-8 border-[6px] border-white">
          <div className="flex items-center justify-center gap-6">
            {/* Minutes */}
            <div className="text-center">
              <div className="text-[12rem] font-bold text-white mb-3 leading-none">
                {displayTime.minutes}
              </div>
              <div className="text-6xl text-white/80">Minutes</div>
            </div>

            {/* Colon */}
            <div className="text-[12rem] -translate-y-10 font-bold text-white leading-none">:</div>

            {/* Seconds */}
            <div className="text-center">
              <div className="text-[12rem] font-bold text-white mb-3 leading-none">
                {displayTime.seconds}
              </div>
              <div className="text-6xl text-white/80">Seconds</div>
            </div>
          </div>
        </div>

        {/* Countdown Time Input (only shown in countdown mode when not running) */}
        {activeTab === 'countdown' && !isRunning && (
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="flex items-center gap-3">
              <label className="text-white text-2xl">Minutes:</label>
              <input
                type="number"
                min="0"
                max="99"
                value={countdownMinutes}
                onChange={(e) => handleMinutesChange(parseInt(e.target.value) || 0)}
                className="w-28 px-5 py-3 rounded-lg bg-white/20 text-white text-center text-3xl font-bold border-[3px] border-white/30 focus:border-white focus:outline-none"
              />
            </div>
            <div className="text-white text-3xl">:</div>
            <div className="flex items-center gap-3">
              <label className="text-white text-2xl">Seconds:</label>
              <input
                type="number"
                min="0"
                max="59"
                value={countdownSeconds}
                onChange={(e) => handleSecondsChange(parseInt(e.target.value) || 0)}
                className="w-28 px-5 py-3 rounded-lg bg-white/20 text-white text-center text-3xl font-bold border-[3px] border-white/30 focus:border-white focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-6">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="bg-pink-600 border-white border-[6px] hover:bg-[#5a4b9d] text-white px-[72px] py-6 rounded-xl font-semibold text-2xl flex items-center gap-4 transition-colors shadow-lg"
            >
              <svg
                className="w-9 h-9"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              Start
            </button>
          ) : (
            <>
              <button
                onClick={handlePause}
                className="bg-[#4A3B8D] hover:bg-[#5a4b9d] text-white px-[72px] py-6 rounded-xl font-semibold text-2xl flex items-center gap-4 transition-colors shadow-lg"
              >
                <svg
                  className="w-9 h-9"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
                Pause
              </button>
              <button
                onClick={handleReset}
                className="bg-white/20 hover:bg-white/30 text-white px-[72px] py-6 rounded-xl font-semibold text-2xl transition-colors shadow-lg"
              >
                Reset
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

