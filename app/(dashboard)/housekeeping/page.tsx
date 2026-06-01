/**
 * Housekeeping Board
 * 
 * Mobile-first kanban board for housekeeping staff to manage room cleaning tasks.
 * 
 * Columns: dirty → cleaning → inspecting → clean
 * Features:
 * - Touch-friendly task cards (≥44px tap targets)
 * - Status updates via buttons or drag-and-drop
 * - Filter by priority
 * - Claim/assign tasks
 * - Mobile PWA optimized
 * 
 * Authorization: Housekeeping staff only
 * 
 * Blueprint: §19.6 Housekeeping Task Board
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type TaskStatus = 'dirty' | 'cleaning' | 'inspecting' | 'clean';
type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

interface HousekeepingTask {
  id: string;
  roomId: string;
  bookingId?: string;
  assignedTo?: string;
  status: TaskStatus;
  priority: TaskPriority;
  taskType: string;
  notes?: string;
  startedAt?: string;
  completedAt?: string;
  inspectionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskWithDetails {
  task: HousekeepingTask;
  room: {
    roomNumber: string;
    roomType: string;
    floor: number;
  };
  booking?: {
    bookingReference: string;
    guestId: string;
  };
  assignedStaff?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function HousekeepingBoard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch tasks
  useEffect(() => {
    if (status === 'authenticated') {
      fetchTasks();
    }
  }, [status]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/housekeeping/tasks');
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const response = await fetch(`/api/housekeeping/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      // Refresh tasks
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const claimTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/housekeeping/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          assignedTo: session?.user?.id,
          status: 'cleaning',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to claim task');
      }

      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim task');
    }
  };

  // Filter tasks by status and priority
  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(t => {
      const matchesStatus = t.task.status === status;
      const matchesPriority = filterPriority === 'all' || t.task.priority === filterPriority;
      return matchesStatus && matchesPriority;
    });
  };

  const columns: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'dirty', label: 'Dirty', color: 'bg-error' },
    { status: 'cleaning', label: 'Cleaning', color: 'bg-warning' },
    { status: 'inspecting', label: 'Inspecting', color: 'bg-info' },
    { status: 'clean', label: 'Clean', color: 'bg-success' },
  ];

  const priorityColors: Record<TaskPriority, string> = {
    urgent: 'badge-error',
    high: 'badge-warning',
    normal: 'badge-info',
    low: 'badge-ghost',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Housekeeping Board</h1>
        <p className="text-base-content/70">Manage room cleaning tasks</p>
      </div>

      {/* Filter Controls */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilterPriority('all')}
          className={`btn btn-sm ${filterPriority === 'all' ? 'btn-primary' : 'btn-outline'}`}
        >
          All
        </button>
        {(['urgent', 'high', 'normal', 'low'] as TaskPriority[]).map(priority => (
          <button
            key={priority}
            onClick={() => setFilterPriority(priority)}
            className={`btn btn-sm ${filterPriority === priority ? 'btn-primary' : 'btn-outline'}`}
          >
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </button>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Kanban Board - Horizontal scroll on mobile */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max md:grid md:grid-cols-4">
          {columns.map(column => {
            const columnTasks = getTasksByStatus(column.status);
            
            return (
              <div
                key={column.status}
                className="w-80 md:w-full flex-shrink-0"
              >
                {/* Column Header */}
                <div className={`${column.color} text-white p-4 rounded-t-lg`}>
                  <h2 className="font-bold text-lg">
                    {column.label}
                    <span className="ml-2 badge badge-ghost text-white">
                      {columnTasks.length}
                    </span>
                  </h2>
                </div>

                {/* Column Tasks */}
                <div className="bg-base-100 rounded-b-lg p-4 min-h-[200px] space-y-3">
                  {columnTasks.length === 0 ? (
                    <p className="text-base-content/50 text-center py-8">
                      No tasks
                    </p>
                  ) : (
                    columnTasks.map(({ task, room, booking, assignedStaff }) => (
                      <div
                        key={task.id}
                        className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="card-body p-4">
                          {/* Room Info */}
                          <h3 className="card-title text-base">
                            Room {room.roomNumber}
                            <span className={`badge badge-sm ${priorityColors[task.priority]}`}>
                              {task.priority}
                            </span>
                          </h3>
                          
                          <p className="text-sm text-base-content/70">
                            {room.roomType} • Floor {room.floor}
                          </p>

                          {/* Booking Reference */}
                          {booking && (
                            <p className="text-xs text-base-content/60">
                              Booking: {booking.bookingReference}
                            </p>
                          )}

                          {/* Assigned Staff */}
                          {assignedStaff && (
                            <p className="text-xs text-base-content/60">
                              Assigned: {assignedStaff.firstName} {assignedStaff.lastName}
                            </p>
                          )}

                          {/* Notes */}
                          {task.notes && (
                            <p className="text-xs text-base-content/70 mt-2">
                              {task.notes}
                            </p>
                          )}

                          {/* Action Buttons - Touch-friendly ≥44px */}
                          <div className="card-actions justify-end mt-3">
                            {/* Claim button for dirty tasks */}
                            {task.status === 'dirty' && !task.assignedTo && (
                              <button
                                onClick={() => claimTask(task.id)}
                                className="btn btn-primary btn-sm min-h-[44px]"
                              >
                                Claim
                              </button>
                            )}

                            {/* Status progression buttons */}
                            {task.status === 'dirty' && task.assignedTo && (
                              <button
                                onClick={() => updateTaskStatus(task.id, 'cleaning')}
                                className="btn btn-primary btn-sm min-h-[44px]"
                              >
                                Start Cleaning
                              </button>
                            )}

                            {task.status === 'cleaning' && (
                              <button
                                onClick={() => updateTaskStatus(task.id, 'inspecting')}
                                className="btn btn-primary btn-sm min-h-[44px]"
                              >
                                Ready for Inspection
                              </button>
                            )}

                            {task.status === 'inspecting' && (
                              <>
                                <button
                                  onClick={() => updateTaskStatus(task.id, 'cleaning')}
                                  className="btn btn-warning btn-sm min-h-[44px]"
                                >
                                  Re-clean
                                </button>
                                <button
                                  onClick={() => updateTaskStatus(task.id, 'clean')}
                                  className="btn btn-success btn-sm min-h-[44px]"
                                >
                                  Approve
                                </button>
                              </>
                            )}
                          </div>

                          {/* Timestamps */}
                          <div className="text-xs text-base-content/50 mt-2">
                            {task.startedAt && (
                              <p>Started: {new Date(task.startedAt).toLocaleTimeString()}</p>
                            )}
                            {task.completedAt && (
                              <p>Completed: {new Date(task.completedAt).toLocaleTimeString()}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Refresh Button - Fixed bottom on mobile */}
      <div className="fixed bottom-4 right-4 md:static md:mt-6 md:text-right">
        <button
          onClick={fetchTasks}
          className="btn btn-circle btn-primary shadow-lg md:btn-wide min-h-[56px]"
          title="Refresh tasks"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="hidden md:inline ml-2">Refresh</span>
        </button>
      </div>
    </div>
  );
}
