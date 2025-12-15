'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Student } from '@/lib/types';
import Image from 'next/image';
import AwardPointsModal from '@/components/modals/AwardPointsModal';

interface RandomProps {
  onClose: () => void;
}

export default function Random({ onClose }: RandomProps) {
  const params = useParams();
  const classId = params.classId as string;
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const reelRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isAwardPointsModalOpen, setIsAwardPointsModalOpen] = useState(false);
  const lastCardIndexRef = useRef<number>(-1);
  const audioContextRef = useRef<AudioContext | null>(null);

  const fetchStudents = useCallback(async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      
      const { data: studentsData, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, points, class_id, student_number, gender, avatar')
        .eq('class_id', classId)
        .order('last_name', { ascending: true });

      if (error) {
        console.error('Error fetching students:', error);
        return;
      }

      setStudents(studentsData || []);
    } catch (err) {
      console.error('Unexpected error fetching students:', err);
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  // Fetch students when component mounts
  useEffect(() => {
    if (classId) {
      fetchStudents();
    }
  }, [classId, fetchStudents]);

  // Cleanup animation frame and audio context on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Function to play a tick sound for each card passing through
  const playTickSound = useCallback(async (volume: number = 0.2) => {
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) {
        return;
      }
      
      // Create or reuse audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }
      
      const audioContext = audioContextRef.current;
      
      // Resume audio context if suspended (required by some browsers)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // Create a mechanical slot machine tick sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Lower frequency for a more mechanical, slot machine-like sound
      // Real slot machines typically have lower-pitched mechanical clicks
      oscillator.frequency.value = 250; // Lower pitch (was 800)
      oscillator.type = 'sawtooth'; // Sawtooth gives a more mechanical, gritty sound
      
      // Create a short mechanical click envelope
      const now = audioContext.currentTime;
      const duration = 0.08; // Slightly longer for more presence
      
      // Quick attack and decay for a mechanical click sound
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.005); // Very quick attack
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration); // Quick decay
      
      // Add slight frequency variation for more mechanical character
      oscillator.frequency.setValueAtTime(250, now);
      oscillator.frequency.linearRampToValueAtTime(230, now + duration); // Slight downward sweep
      
      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch (error) {
      // Silently fail if audio cannot be played
      console.log('Could not play tick sound:', error);
    }
  }, []);

  const handleSpin = () => {
    if (students.length === 0 || isSpinning) return;

    setIsSpinning(true);
    setSelectedStudent(null);
    
    // Reset card tracking and scroll position to top for consistent animation
    lastCardIndexRef.current = -1;
    setScrollPosition(0); // Reset to top immediately

    // Randomly select a student
    const randomIndex = Math.floor(Math.random() * students.length);
    const selected = students[randomIndex];

    // Item height (avatar + name + padding) - scaled up 25%
    const itemHeight = 250; // Height of each student item (200 * 1.25)
    const slotWindowHeight = 750; // Height of the visible slot window (600 * 1.25)
    const middleOfWindow = slotWindowHeight / 2; // 375px - middle of the visible window
    const itemCenterOffset = itemHeight / 2; // 125px - center of each item
    
    // Calculate target position: center the selected student in the middle row
    // The selected student's top position in the list: randomIndex * itemHeight
    // To center it in the middle: we want the item's center (top + itemCenterOffset) to align with middleOfWindow
    // So: randomIndex * itemHeight + itemCenterOffset should be at middleOfWindow
    // Therefore: scrollPosition = randomIndex * itemHeight + itemCenterOffset - middleOfWindow
    const targetPosition = randomIndex * itemHeight + itemCenterOffset - middleOfWindow;
    
    // Add multiple full rotations for visual effect (spin through all students multiple times)
    const fullRotations = 3; // Number of full rotations
    const totalItems = students.length;
    const extraScroll = fullRotations * totalItems * itemHeight;
    
    // Final target position (add extra scroll to ensure we have enough content to scroll through)
    const finalTarget = extraScroll + targetPosition;
    
    // Always start from top (0) for consistent animation
    const startPosition = 0;
    const distance = finalTarget - startPosition;
    
    // Consistent animation duration (3.5 seconds)
    const duration = 3500; // Always 3.5 seconds
    const startTime = performance.now();
    
    // Easing function for smooth deceleration
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Apply easing
      const easedProgress = easeOutCubic(progress);
      
      // Calculate current position
      const currentPosition = startPosition + distance * easedProgress;
      setScrollPosition(currentPosition);
      
      // Calculate which card is currently in the middle slot
      // The middle of the window is at middleOfWindow (375px)
      // With scrollPosition, the card at position (scrollPosition + middleOfWindow) is centered
      // Calculate which item index this corresponds to
      const currentCenterPosition = currentPosition + middleOfWindow;
      const currentCardIndex = Math.floor((currentCenterPosition - itemCenterOffset) / itemHeight);
      
      // Play sound when a new card passes through the middle
      // The timing will naturally be faster at the start (due to higher scroll speed) 
      // and slower at the end (due to easing), which is exactly what we want
      if (currentCardIndex !== lastCardIndexRef.current && currentCardIndex >= 0) {
        lastCardIndexRef.current = currentCardIndex;
        
        // Volume decreases as we approach the end (softer sounds near the end)
        // This creates a nice effect where sounds are more prominent at the start
        const volume = 0.3 - (progress * 0.2); // Start at 0.3, end at 0.1
        playTickSound(volume);
      }
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        setIsSpinning(false);
        setSelectedStudent(selected);
        setScrollPosition(finalTarget);
        lastCardIndexRef.current = -1; // Reset for next spin
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isSpinning && students.length > 0) {
        handleSpin();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpinning, students.length]);

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

      <div className="w-full h-full flex flex-row items-center justify-center px-10 gap-10">
        {/* Left Side - Controls and Selected Student */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-6">Random Student Selector</h1>
            <p className="text-white/80 text-xl mb-8">
              {isLoading 
                ? 'Loading students...' 
                : students.length === 0 
                  ? 'No students found' 
                  : `Click the button to randomly select from ${students.length} students`}
            </p>
            
            {!isLoading && students.length > 0 && (
              <button
                onClick={handleSpin}
                disabled={isSpinning}
                className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-500 text-white px-10 py-5 rounded-xl font-bold text-2xl transition-colors shadow-lg disabled:cursor-not-allowed"
              >
                {isSpinning ? 'Spinning...' : 'Choose Random Student'}
              </button>
            )}

            {/* Selected Student Display */}
            <div className="mt-10 p-8 bg-white/20 rounded-2xl backdrop-blur-sm">
              {selectedStudent ? (
                <>
                  <p className="text-white text-3xl font-semibold mb-3">Selected:</p>
                  <div className="flex items-center gap-5 justify-center mb-6">
                    <Image
                      src={selectedStudent.avatar || "/images/dashboard/student-avatars/avatar-01.png"}
                      alt={`${selectedStudent.first_name} ${selectedStudent.last_name}`}
                      width={75}
                      height={75}
                      className="rounded-full bg-[#FDF2F0] border-4 border-white"
                    />
                    <p className="text-white text-5xl font-bold">{selectedStudent.first_name} {selectedStudent.last_name}</p>
                  </div>
                </>
              ) : (
                <p className="text-white text-2xl font-semibold mb-6 text-center">No student selected</p>
              )}
              <button
                onClick={() => setIsAwardPointsModalOpen(true)}
                disabled={!selectedStudent}
                className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold text-xl transition-colors shadow-lg"
              >
                Award Points
              </button>
            </div>
          </div>
        </div>

        {/* Right Side - Slot Machine */}
        <div className="flex-1 flex items-center justify-center">
          {isLoading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white/80 text-xl">Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center">
              <p className="text-white/80 text-2xl">No students available</p>
            </div>
          ) : (
            <div className="relative">
              {/* Slot Machine Frame */}
              <div className="bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600 rounded-2xl p-8 shadow-2xl border-4 border-yellow-700">
                {/* Slot Window */}
                <div className="relative bg-gray-500 rounded-lg p-5 overflow-hidden" style={{ width: '375px', height: '750px' }}>
                  {/* Top and bottom gradient overlays for fade effect */}
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none" style={{ height: '100px' }}></div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" style={{ height: '100px' }}></div>
                  
                  {/* Selection indicator lines */}
                  <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 z-20 pointer-events-none">
                    <div className="border-t-4 border-b-4 border-yellow-400" style={{ height: '250px' }}></div>
                  </div>
                  
                  {/* Reel Container */}
                  <div 
                    ref={reelRef}
                    className="relative transition-none"
                    style={{
                      transform: `translateY(-${scrollPosition}px)`,
                      transition: isSpinning ? 'none' : 'transform 0.3s ease-out',
                    }}
                  >
                    {/* Duplicate students multiple times for seamless scrolling */}
                    {[...Array(5)].map((_, rotation) => 
                      students.map((student, index) => {
                        return (
                          <div
                            key={`${student.id}-${rotation}-${index}`}
                            className="flex flex-col items-center justify-center py-10"
                            style={{ height: '250px' }}
                          >
                            <div className="mb-5">
                              <Image
                                src={student.avatar || "/images/dashboard/student-avatars/avatar-01.png"}
                                alt={`${student.first_name} ${student.last_name}`}
                                width={150}
                                height={150}
                                className="rounded-full bg-[#FDF2F0] border-4 border-white shadow-lg"
                              />
                            </div>
                            <h3 className="text-white text-2xl font-bold text-center px-5">
                              {student.first_name} {student.last_name}
                            </h3>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Award Points Modal */}
      {selectedStudent && (
        <AwardPointsModal
          isOpen={isAwardPointsModalOpen}
          onClose={() => setIsAwardPointsModalOpen(false)}
          student={selectedStudent}
          classId={classId}
          onRefresh={fetchStudents}
        />
      )}
    </div>
  );
}

