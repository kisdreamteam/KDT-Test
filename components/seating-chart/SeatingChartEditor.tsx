'use client';

import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { createClient } from '@/lib/supabase/client';
import { useSeatingChart } from '@/context/SeatingChartContext';
import { Student } from '@/lib/types';
import CreateLayoutModal from '@/components/modals/CreateLayoutModal';
import Image from 'next/image';

interface SeatingChart {
  id: string;
  name: string;
  class_id: string;
  created_at: string;
}

interface SeatingGroup {
  id: string;
  name: string;
  seating_chart_id: string;
  sort_order: number;
  created_at: string;
}

interface SeatingChartEditorProps {
  classId: string;
}

export default function SeatingChartEditor({ classId }: SeatingChartEditorProps) {
  const { selectedStudentForGroup, setSelectedStudentForGroup, setUnseatedStudents } = useSeatingChart();
  const [layouts, setLayouts] = useState<SeatingChart[]>([]);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<SeatingGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [groupStudents, setGroupStudents] = useState<Map<string, Student[]>>(new Map());
  const [targetGroupId, setTargetGroupId] = useState<string | null>(null);

  const fetchLayouts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const supabase = createClient();
      
      const { data, error: fetchError } = await supabase
        .from('seating_charts')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching seating charts:', fetchError);
        setError('Failed to load seating charts. Please try again.');
        return;
      }

      if (data) {
        setLayouts(data);
        // Auto-select the first layout if available
        if (data.length > 0 && !selectedLayoutId) {
          setSelectedLayoutId(data[0].id);
        }
      } else {
        setLayouts([]);
      }
    } catch (err) {
      console.error('Unexpected error fetching seating charts:', err);
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [classId, selectedLayoutId]);

  // Fetch layouts from Supabase
  useEffect(() => {
    if (classId) {
      fetchLayouts();
    }
  }, [classId, fetchLayouts]);

  const fetchGroups = useCallback(async () => {
    if (!selectedLayoutId) return;

    try {
      setIsLoadingGroups(true);
      const supabase = createClient();
      
      const { data, error: fetchError } = await supabase
        .from('seating_groups')
        .select('*')
        .eq('seating_chart_id', selectedLayoutId)
        .order('sort_order', { ascending: true });

      if (fetchError) {
        console.error('Error fetching seating groups:', fetchError);
        return;
      }

      if (data) {
        setGroups(data);
        // Initialize empty student arrays for each group
        const newGroupStudents = new Map<string, Student[]>();
        data.forEach(group => {
          newGroupStudents.set(group.id, []);
        });
        setGroupStudents(newGroupStudents);
      } else {
        setGroups([]);
        setGroupStudents(new Map());
      }
    } catch (err) {
      console.error('Unexpected error fetching seating groups:', err);
    } finally {
      setIsLoadingGroups(false);
    }
  }, [selectedLayoutId]);

  // Fetch groups when layout is selected
  useEffect(() => {
    if (selectedLayoutId) {
      fetchGroups();
    } else {
      setGroups([]);
      setGroupStudents(new Map());
    }
  }, [selectedLayoutId, fetchGroups]);

  // Listen for student selection from sidebar
  useEffect(() => {
    const handleStudentSelected = (event: CustomEvent) => {
      const student = event.detail.student as Student;
      setSelectedStudentForGroup(student);
      // Show visual indicator that a student is ready to be placed
    };

    window.addEventListener('studentSelectedForGroup', handleStudentSelected as EventListener);
    return () => {
      window.removeEventListener('studentSelectedForGroup', handleStudentSelected as EventListener);
    };
  }, [setSelectedStudentForGroup]);

  // Listen for add student to group event
  const addStudentToGroup = useCallback((student: Student, groupId: string) => {
    setGroupStudents(prev => {
      const newMap = new Map(prev);
      const groupStudentsList = newMap.get(groupId) || [];
      // Check if student is already in this group
      if (!groupStudentsList.find(s => s.id === student.id)) {
        newMap.set(groupId, [...groupStudentsList, student]);
      }
      return newMap;
    });
    
    // Remove from unseated list
    setUnseatedStudents((prev: Student[]) => prev.filter(s => s.id !== student.id));
    setSelectedStudentForGroup(null);
  }, [setUnseatedStudents, setSelectedStudentForGroup]);

  useEffect(() => {
    const handleAddStudentToGroup = (event: CustomEvent) => {
      const { studentId, groupId } = event.detail;
      if (selectedStudentForGroup && selectedStudentForGroup.id === studentId) {
        addStudentToGroup(selectedStudentForGroup, groupId);
      }
    };

    window.addEventListener('addStudentToGroup', handleAddStudentToGroup as EventListener);
    return () => {
      window.removeEventListener('addStudentToGroup', handleAddStudentToGroup as EventListener);
    };
  }, [selectedStudentForGroup, addStudentToGroup]);

  const removeStudentFromGroup = (studentId: string, groupId: string) => {
    setGroupStudents(prev => {
      const newMap = new Map(prev);
      const groupStudentsList = newMap.get(groupId) || [];
      const removedStudent = groupStudentsList.find(s => s.id === studentId);
      
      if (removedStudent) {
        newMap.set(groupId, groupStudentsList.filter(s => s.id !== studentId));
        // Add back to unseated list
        setUnseatedStudents((prev: Student[]) => [...prev, removedStudent]);
      }
      return newMap;
    });
  };

  const handleCreateGroup = async () => {
    if (!selectedLayoutId) return;

    try {
      const supabase = createClient();
      
      // Get the next group number
      const nextGroupNumber = groups.length + 1;
      const groupName = `Group ${nextGroupNumber}`;
      
      // Get the max sort_order to place new group at the end
      const maxSortOrder = groups.length > 0 
        ? Math.max(...groups.map(g => g.sort_order))
        : -1;

      const { data, error: insertError } = await supabase
        .from('seating_groups')
        .insert({
          name: groupName,
          seating_chart_id: selectedLayoutId,
          sort_order: maxSortOrder + 1,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating seating group:', insertError);
        alert('Failed to create group. Please try again.');
        return;
      }

      if (data) {
        // Refresh groups
        await fetchGroups();
      }
    } catch (err) {
      console.error('Unexpected error creating seating group:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const handleCreateLayout = async (layoutName: string) => {
    try {
      const supabase = createClient();
      
      const { data, error: insertError } = await supabase
        .from('seating_charts')
        .insert({
          name: layoutName,
          class_id: classId,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating seating chart:', insertError);
        alert('Failed to create layout. Please try again.');
        return;
      }

      if (data) {
        // Refresh layouts and select the new one
        await fetchLayouts();
        setSelectedLayoutId(data.id);
        setIsCreateModalOpen(false);
      }
    } catch (err) {
      console.error('Unexpected error creating seating chart:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(groups);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sort_order for all items
    const updatedGroups = items.map((group, index) => ({
      ...group,
      sort_order: index,
    }));

    setGroups(updatedGroups);
  };

  const handleGroupClick = (groupId: string) => {
    if (selectedStudentForGroup) {
      addStudentToGroup(selectedStudentForGroup, groupId);
    } else {
      setTargetGroupId(groupId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-white text-xl">Loading seating charts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-white text-xl">{error}</p>
        <button
          onClick={fetchLayouts}
          className="px-6 py-2 bg-purple-400 text-white rounded-lg font-medium hover:bg-purple-500 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (layouts.length === 0) {
    return (
      <div className="p-6 sm:p-8 md:p-10">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="text-center">
            <h2 className="text-white text-2xl font-semibold mb-2">No seating charts yet</h2>
            <p className="text-white/80 text-lg">
              Create your first seating chart layout to get started.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-8 py-3 bg-purple-400 text-white rounded-lg font-semibold text-lg hover:bg-purple-500 transition-colors shadow-lg"
          >
            Create New Layout
          </button>
        </div>
        <CreateLayoutModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateLayout={handleCreateLayout}
        />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 md:p-10">
      <div className="space-y-6">
        {/* Layout Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <label className="text-white font-semibold text-lg whitespace-nowrap">
            Editing Layout:
          </label>
          <select
            value={selectedLayoutId || ''}
            onChange={(e) => setSelectedLayoutId(e.target.value)}
            className="flex-1 max-w-md px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-700"
          >
            {layouts.map((layout) => (
              <option key={layout.id} value={layout.id}>
                {layout.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-2 bg-purple-400 text-white rounded-lg font-medium hover:bg-purple-500 transition-colors"
          >
            Create New Layout
          </button>
        </div>

        {/* Seating Groups Canvas */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-xl font-semibold">
              Seating Groups {selectedStudentForGroup && (
                <span className="text-sm font-normal text-purple-200">
                  - Click a group to add &quot;{selectedStudentForGroup.first_name} {selectedStudentForGroup.last_name}&quot;
                </span>
              )}
            </h3>
            <button
              onClick={handleCreateGroup}
              className="px-6 py-2 bg-purple-400 text-white rounded-lg font-medium hover:bg-purple-500 transition-colors"
            >
              Add New Group
            </button>
          </div>

          {isLoadingGroups ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-white/80">Loading groups...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="p-8 bg-white/10 rounded-lg border border-white/20 text-center">
              <p className="text-white/80 mb-4">No groups yet. Create your first group to get started.</p>
              <button
                onClick={handleCreateGroup}
                className="px-6 py-2 bg-purple-400 text-white rounded-lg font-medium hover:bg-purple-500 transition-colors"
              >
                Create First Group
              </button>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="groups" direction="horizontal">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex flex-wrap gap-4 min-h-[200px]"
                  >
                    {groups.map((group, index) => {
                      const studentsInGroup = groupStudents.get(group.id) || [];
                      const isTarget = selectedStudentForGroup && targetGroupId === group.id;
                      
                      return (
                        <Draggable key={group.id} draggableId={group.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              onClick={() => handleGroupClick(group.id)}
                              className={`bg-white rounded-lg border-2 shadow-lg min-w-[300px] flex flex-col transition-all ${
                                snapshot.isDragging ? 'shadow-2xl rotate-2 border-purple-600' : 
                                isTarget ? 'border-purple-500 ring-4 ring-purple-300' :
                                selectedStudentForGroup ? 'border-purple-400 hover:border-purple-500 cursor-pointer' :
                                'border-gray-300'
                              }`}
                              style={provided.draggableProps.style}
                            >
                              {/* Group Header */}
                              <div
                                {...provided.dragHandleProps}
                                className="flex items-center justify-between p-4 border-b border-gray-200 bg-purple-50 rounded-t-lg cursor-grab active:cursor-grabbing"
                              >
                                <h4 className="font-semibold text-gray-800">{group.name}</h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">
                                    {studentsInGroup.length} student{studentsInGroup.length !== 1 ? 's' : ''}
                                  </span>
                                  <svg
                                    className="w-5 h-5 text-gray-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 8h16M4 16h16"
                                    />
                                  </svg>
                                </div>
                              </div>

                              {/* Group Content Area - Students */}
                              <div className="p-4 min-h-[150px] bg-gray-50 flex flex-col gap-2">
                                {studentsInGroup.length === 0 ? (
                                  <p className="text-gray-500 text-sm text-center py-4">
                                    {selectedStudentForGroup ? 'Click to add student' : 'No students yet'}
                                  </p>
                                ) : (
                                  studentsInGroup.map((student) => (
                                    <div
                                      key={student.id}
                                      className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 hover:bg-gray-50"
                                    >
                                      <div className="w-8 h-8 rounded-full overflow-hidden bg-[#FDF2F0] flex-shrink-0">
                                        <Image
                                          src={student.avatar || "/images/students/avatars/student_avatar_1.png"}
                                          alt={`${student.first_name} ${student.last_name}`}
                                          width={32}
                                          height={32}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate">
                                          {student.first_name} {student.last_name}
                                        </p>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeStudentFromGroup(student.id, group.id);
                                        }}
                                        className="text-red-500 hover:text-red-700 p-1"
                                        title="Remove from group"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>

      {/* Create Layout Modal */}
      <CreateLayoutModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateLayout={handleCreateLayout}
      />
    </div>
  );
}

