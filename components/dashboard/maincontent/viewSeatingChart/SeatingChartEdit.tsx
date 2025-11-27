'use client';

import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { createClient } from '@/lib/supabase/client';

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

interface SeatingChartEditProps {
  classId: string;
}

export default function SeatingChartEdit({ classId }: SeatingChartEditProps) {
  const [layouts, setLayouts] = useState<SeatingChart[]>([]);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<SeatingGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

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
      } else {
        setGroups([]);
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
    }
  }, [selectedLayoutId, fetchGroups]);

  // Listen for randomize event
  useEffect(() => {
    const handleRandomize = () => {
      // TODO: Implement randomize logic
      console.log('Randomize seating chart');
    };

    window.addEventListener('seatingChartRandomize', handleRandomize);
    return () => {
      window.removeEventListener('seatingChartRandomize', handleRandomize);
    };
  }, []);

  // Listen for save event
  useEffect(() => {
    const handleSave = async () => {
      // Save the updated groups order to the database
      if (!selectedLayoutId || groups.length === 0) return;

      try {
        const supabase = createClient();
        
        // Update sort_order for all groups
        const updates = groups.map((group, index) => ({
          id: group.id,
          sort_order: index,
        }));

        for (const update of updates) {
          const { error: updateError } = await supabase
            .from('seating_groups')
            .update({ sort_order: update.sort_order })
            .eq('id', update.id);

          if (updateError) {
            console.error('Error updating group order:', updateError);
            alert('Failed to save changes. Please try again.');
            return;
          }
        }

        // Refresh groups to ensure we have the latest data
        await fetchGroups();
      } catch (err) {
        console.error('Unexpected error saving seating chart:', err);
        alert('An unexpected error occurred. Please try again.');
      }
    };

    window.addEventListener('seatingChartSave', handleSave);
    return () => {
      window.removeEventListener('seatingChartSave', handleSave);
    };
  }, [groups, selectedLayoutId, fetchGroups]);

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-center">
          <h2 className="text-white text-2xl font-semibold mb-2">No seating charts yet</h2>
          <p className="text-white/80 text-lg">
            Please create a seating chart layout first before editing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 md:p-10">
      <div className="space-y-6">
        {/* Layout Selector - Read-only in edit mode */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <label className="text-white font-semibold text-lg whitespace-nowrap">
            Editing Layout:
          </label>
          <select
            value={selectedLayoutId || ''}
            onChange={(e) => setSelectedLayoutId(e.target.value)}
            className="flex-1 max-w-md px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-700"
            disabled
          >
            {layouts.map((layout) => (
              <option key={layout.id} value={layout.id}>
                {layout.name}
              </option>
            ))}
          </select>
        </div>

        {/* Seating Groups Drag-and-Drop Canvas - Editable */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-xl font-semibold">Seating Groups (Drag to reorder)</h3>
          </div>

          {isLoadingGroups ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-white/80">Loading groups...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="p-8 bg-white/10 rounded-lg border border-white/20 text-center">
              <p className="text-white/80">No groups in this layout.</p>
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
                    {groups.map((group, index) => (
                      <Draggable key={group.id} draggableId={group.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`bg-white rounded-lg border-2 border-purple-400 shadow-lg min-w-[250px] flex flex-col ${
                              snapshot.isDragging ? 'shadow-2xl rotate-2 border-purple-600' : ''
                            }`}
                            style={provided.draggableProps.style}
                          >
                            {/* Group Header */}
                            <div
                              {...provided.dragHandleProps}
                              className="flex items-center justify-between p-4 border-b border-gray-200 bg-purple-50 rounded-t-lg cursor-grab active:cursor-grabbing"
                            >
                              <h4 className="font-semibold text-gray-800">{group.name}</h4>
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

                            {/* Group Content Area */}
                            <div className="p-4 min-h-[150px] flex items-center justify-center bg-gray-50">
                              <p className="text-gray-500 text-sm text-center">
                                Students will appear here
                              </p>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>
    </div>
  );
}

