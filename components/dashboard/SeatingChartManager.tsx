'use client';

import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { createClient } from '@/lib/supabase/client';
import CreateLayoutModal from '@/components/modals/CreateLayoutModal';

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

interface SeatingChartManagerProps {
  classId: string;
}

export default function SeatingChartManager({ classId }: SeatingChartManagerProps) {
  const [layouts, setLayouts] = useState<SeatingChart[]>([]);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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

  return (
    <div className="p-6 sm:p-8 md:p-10">
      {layouts.length === 0 ? (
        // Empty state - No layouts exist
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
      ) : (
        // Layouts exist - Show selector and create button
        <div className="space-y-6">
          {/* Layout Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <label className="text-white font-semibold text-lg whitespace-nowrap">
              Select Layout:
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
          </div>

          {/* Create New Layout Button */}
          <div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-2 bg-purple-400 text-white rounded-lg font-medium hover:bg-purple-500 transition-colors"
            >
              Create New Layout
            </button>
          </div>

          {/* Seating Groups Drag-and-Drop Canvas */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-xl font-semibold">Seating Groups</h3>
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
                      {groups.map((group, index) => (
                        <Draggable key={group.id} draggableId={group.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`bg-white rounded-lg border-2 border-gray-300 shadow-lg min-w-[250px] flex flex-col ${
                                snapshot.isDragging ? 'shadow-2xl rotate-2' : ''
                              }`}
                              style={provided.draggableProps.style}
                            >
                              {/* Group Header */}
                              <div
                                {...provided.dragHandleProps}
                                className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg cursor-grab active:cursor-grabbing"
                              >
                                <h4 className="font-semibold text-gray-800">{group.name}</h4>
                                <button
                                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: Open settings modal for grid columns
                                  }}
                                  title="Edit group settings"
                                >
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
                                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                  </svg>
                                </button>
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
      )}

      {/* Create Layout Modal */}
      <CreateLayoutModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateLayout={handleCreateLayout}
      />
    </div>
  );
}

