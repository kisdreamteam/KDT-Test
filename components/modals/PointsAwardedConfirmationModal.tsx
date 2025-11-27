'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Modal from '@/components/modals/Modal';

interface PointsAwardedConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentAvatar: string;
  studentFirstName: string;
  points: number;
  categoryName: string;
  categoryIcon?: string;
}

// Function to play a chime sound for positive points
const playChime = async () => {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }
    
    const audioContext = new AudioContextClass();
    
    // Resume audio context if suspended (required by some browsers)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    // Create a pleasant chime using multiple oscillators
    const frequencies = [523.25, 659.25, 783.99]; // C, E, G notes (C major chord)
    const duration = 0.3; // 300ms
    
    frequencies.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      // Create a fade-out envelope
      const now = audioContext.currentTime;
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
      
      // Stagger the notes slightly for a more pleasant effect
      oscillator.start(now + index * 0.05);
      oscillator.stop(now + duration + index * 0.05);
    });
  } catch (error) {
    // Silently fail if audio cannot be played (e.g., no user interaction yet)
    console.log('Could not play chime sound:', error);
  }
};

// Function to play a boing sound for negative points
const playBoing = async () => {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }
    
    const audioContext = new AudioContextClass();
    
    // Resume audio context if suspended (required by some browsers)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    // Create a boing sound with a descending frequency sweep
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Start at a higher frequency and sweep down (boing effect)
    const startFreq = 200; // Lower starting frequency
    const endFreq = 100;   // Even lower end frequency
    const duration = 0.4;   // 400ms
    
    oscillator.type = 'sawtooth'; // Sawtooth gives a more bouncy/boing-like sound
    
    const now = audioContext.currentTime;
    
    // Set initial frequency
    oscillator.frequency.setValueAtTime(startFreq, now);
    // Sweep down to create the boing effect
    oscillator.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    
    // Create a bouncy envelope - quick attack, then decay with a slight bounce
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.4, now + 0.05); // Quick attack
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.1);  // Slight bounce
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.15); // Another bounce
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration); // Fade out
    
    oscillator.start(now);
    oscillator.stop(now + duration);
  } catch (error) {
    // Silently fail if audio cannot be played (e.g., no user interaction yet)
    console.log('Could not play boing sound:', error);
  }
};

export default function PointsAwardedConfirmationModal({
  isOpen,
  onClose,
  studentAvatar,
  studentFirstName,
  points,
  categoryName,
  categoryIcon,
}: PointsAwardedConfirmationModalProps) {
  // Play appropriate sound when modal opens based on points value
  useEffect(() => {
    if (isOpen) {
      if (points > 0) {
        playChime(); // Positive points - play chime
      } else if (points < 0) {
        playBoing(); // Negative points - play boing
      }
      // If points is 0, don't play any sound
    }
  }, [isOpen, points]);

  // Auto-dismiss after 1 second
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 1500); // 1 second

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-180 max-h-50">
      <div className="flex flex-row bg-white rounded-2xl p-8 items-center justify-center gap-12 p-1 shadow-lg">
          {/* Student Avatar */}
          <div className="relative w-40">
            <Image
              src={studentAvatar || "/images/classes/avatars/avatar-01.png"}
              alt={`${studentFirstName} avatar`}
              width={120}
              height={120}
              className="rounded-lg object-cover"
              onError={(e) => {
                e.currentTarget.src = '/images/classes/avatars/avatar-01.png';
              }}
            />
          </div>

          <div className="flex flex-col gap-10 w-100 justify-center items-center">
            {/* Check if it's multiple students (contains "Student" or "Students") */}
            {studentFirstName.includes('Student') ? (
              // Multiple students format: "X points awarded to X students"
              <>
                <h2 className="text-5xl font-bold text-gray-900">
                  {points > 0 ? '+' : ''}{points} points
                </h2>
                <div className="flex flex-row gap-2 items-center justify-center">
                  <span className="text-lg font-semibold text-gray-900">awarded to</span>
                  <span className="text-lg font-semibold text-gray-900">{studentFirstName}</span>
                </div>
              </>
            ) : (
              // Single student format
              <>
                <h2 className="text-5xl font-bold text-gray-900">{studentFirstName}</h2>
                <div className="flex flex-row gap-2 items-center justify-center">
                  <div className="text-4xl font-bold text-red-600">
                    {points > 0 ? '+' : ''}{points}
                  </div>
                  <span className="text-lg font-semibold text-gray-900"> awarded for</span>
                  <span className="text-lg font-semibold text-gray-900">{categoryName}</span>
                </div>
              </>
            )}
          </div>    
            
          <div className="flex items-center gap-3 w-40">
              {/* Category Icon */}
              {categoryIcon && (
                <div className="w-12 h-12 flex items-center justify-center">
                  <Image
                    src={categoryIcon}
                    alt={categoryName}
                    width={120}
                    height={120}
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

          </div>
        </div>  
    </Modal>
  );
}

