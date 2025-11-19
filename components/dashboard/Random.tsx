'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Student } from '@/lib/types';

interface RandomProps {
  onClose: () => void;
}

// Function to play a click sound for wheel spinning
const playClickSound = async () => {
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
    
    // Create a short, sharp click sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Use a higher frequency for a sharper click sound
    oscillator.frequency.value = 800;
    oscillator.type = 'square'; // Square wave for a more percussive sound
    
    const now = audioContext.currentTime;
    const duration = 0.05; // Very short click (50ms)
    
    // Quick attack and decay for a sharp click
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    oscillator.start(now);
    oscillator.stop(now + duration);
  } catch (error) {
    // Silently fail if audio cannot be played
    console.log('Could not play click sound:', error);
  }
};

export default function Random({ onClose }: RandomProps) {
  const params = useParams();
  const classId = params.classId as string;
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);
  const clickIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch students when component mounts
  useEffect(() => {
    if (classId) {
      fetchStudents();
    }
  }, [classId]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (clickIntervalRef.current) {
        clearInterval(clickIntervalRef.current);
      }
    };
  }, []);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      
      const { data: studentsData, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, points, class_id, student_number, gender')
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
  };

  const handleSpin = () => {
    if (students.length === 0 || isSpinning) return;

    setIsSpinning(true);
    setSelectedStudent(null);

    // Clear any existing interval
    if (clickIntervalRef.current) {
      clearInterval(clickIntervalRef.current);
    }

    // Randomly select a student
    const randomIndex = Math.floor(Math.random() * students.length);
    const selected = students[randomIndex];
    
    // Calculate rotation: multiple full spins (3 seconds) + position of selected student
    const baseRotations = 5; // Number of full rotations for visual effect
    const segmentAngle = 360 / students.length;
    
    // Calculate the angle of the center of the selected segment
    // Segments start from top (270 degrees in SVG), so center is at:
    const segmentCenterAngle = 270 + (randomIndex + 0.5) * segmentAngle;
    
    // We want the selected segment to be at the right side (0 degrees in SVG coordinates) when it stops
    // Pointer is at right side (0 degrees), so we need the segment center to align with 0 degrees
    // Final rotation = base rotations + (0 - segmentCenterAngle) to bring it to right
    const additionalRotation = -segmentCenterAngle;
    const finalRotation = baseRotations * 360 + additionalRotation;
    
    setRotation(prev => prev + finalRotation);

    // Calculate how many segments will pass during the spin
    const totalDegrees = Math.abs(finalRotation);
    const segmentsPassed = Math.ceil((totalDegrees / 360) * students.length);
    
    // Calculate interval between clicks (total spin time / segments passed)
    const spinDuration = 3000; // 3 seconds
    const clickInterval = Math.max(50, spinDuration / segmentsPassed); // Minimum 50ms between clicks
    
    // Play initial click
    playClickSound();
    
    // Set up interval to play clicks as segments pass
    clickIntervalRef.current = setInterval(() => {
      playClickSound();
    }, clickInterval);

    // After 3 seconds, stop and show selected student
    setTimeout(() => {
      if (clickIntervalRef.current) {
        clearInterval(clickIntervalRef.current);
        clickIntervalRef.current = null;
      }
      setIsSpinning(false);
      setSelectedStudent(`${selected.first_name} ${selected.last_name}`);
    }, 3000);
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

  // Calculate segment angle for each student
  const segmentAngle = students.length > 0 ? 360 / students.length : 0;

  // Generate colors for segments (red, yellow, green, blue pattern)
  const getSegmentColor = (index: number) => {
    const colors = ['#FF4444', '#FFD700', '#4CAF50', '#2196F3']; // Red, Yellow, Green, Blue
    return colors[index % colors.length];
  };

  return (
    <div className="fixed inset-0 bg-[#4A3B8D] z-50 flex items-center justify-center">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors z-10"
      >
        <svg
          className="w-6 h-6 text-white"
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

      <div className="w-full h-full flex flex-row items-center justify-center px-8 gap-8">
        {/* Left Side - Placeholder */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Random Student Selector</h1>
            <p className="text-white/80 text-lg mb-6">
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
                className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-500 text-white px-8 py-4 rounded-xl font-bold text-xl transition-colors shadow-lg disabled:cursor-not-allowed"
              >
                {isSpinning ? 'Spinning...' : 'Choose Random Student'}
              </button>
            )}

            {selectedStudent && (
              <div className="mt-8 p-6 bg-white/20 rounded-2xl backdrop-blur-sm">
                <p className="text-white text-2xl font-semibold mb-2">Selected:</p>
                <p className="text-white text-4xl font-bold">{selectedStudent}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Spinning Wheel */}
        <div className="flex-1 flex items-center justify-center">
          {isLoading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white/80">Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center">
              <p className="text-white/80 text-xl">No students available</p>
            </div>
          ) : (
            <div className="relative">
              {/* Pointer on right side */}
              <div className="absolute right-0 top-1/2 transform translate-x-12 -translate-y-1/2 z-20 rotate-270">
                <svg
                  className="w-20 h-20 text-red-600 drop-shadow-lg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2L2 22h20L12 2z" />
                </svg>
              </div>

              {/* Wheel Container */}
              <div className="relative w-[600px] h-[600px]">
                <div
                  ref={wheelRef}
                  className="w-full h-full rounded-full shadow-2xl transition-transform duration-3000 ease-out cursor-pointer"
                  onClick={!isSpinning ? handleSpin : undefined}
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: 'center',
                  }}
                >
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 400 400"
                  >
                    {students.map((student, index) => {
                      // Start from top (-90 degrees in SVG coordinates, which is 270 degrees)
                      // SVG: 0 = right, 90 = bottom, 180 = left, 270 = top
                      const startAngle = 270 + (index * segmentAngle);
                      const endAngle = 270 + ((index + 1) * segmentAngle);
                      const largeArc = segmentAngle > 180 ? 1 : 0;

                      // Calculate path for segment
                      const startAngleRad = (startAngle * Math.PI) / 180;
                      const endAngleRad = (endAngle * Math.PI) / 180;

                      const x1 = 200 + 200 * Math.cos(startAngleRad);
                      const y1 = 200 + 200 * Math.sin(startAngleRad);
                      const x2 = 200 + 200 * Math.cos(endAngleRad);
                      const y2 = 200 + 200 * Math.sin(endAngleRad);

                      // Text position (middle of segment, closer to edge)
                      const textAngle = (startAngle + endAngle) / 2;
                      const textAngleRad = (textAngle * Math.PI) / 180;
                      const textX = 200 + 140 * Math.cos(textAngleRad);
                      const textY = 200 + 140 * Math.sin(textAngleRad);

                      // Determine text rotation based on position (make text readable)
                      let textRotation = textAngle;
                      // Adjust rotation so text is readable - flip on left side
                      if (textAngle > 90 && textAngle < 270) {
                        textRotation = textAngle + 180; // Flip text on left half
                      }

                      return (
                        <g key={student.id}>
                          <path
                            d={`M 200 200 L ${x1} ${y1} A 200 200 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill={getSegmentColor(index)}
                            stroke="white"
                            strokeWidth="3"
                          />
                          <text
                            x={textX}
                            y={textY}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="white"
                            fontSize="24"
                            fontWeight="bold"
                            transform={`rotate(${textRotation} ${textX} ${textY})`}
                            className="select-none"
                            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
                          >
                            {student.first_name}
                          </text>
                        </g>
                      );
                    })}
                    
                    {/* White circular hub in center */}
                    <circle
                      cx="200"
                      cy="200"
                      r="40"
                      fill="white"
                      stroke="#ddd"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

