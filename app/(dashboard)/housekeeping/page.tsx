/**
 * Housekeeping Board
 *
 * Mobile-first kanban board for housekeeping staff at Hotel Etuna.
 * Columns: dirty → cleaning → inspecting → clean
 * RLS: All API calls go through withApiAuth which sets app.tenant_id.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type TaskStatus = 'dirty' | 'cleaning' | 'inspecting' | 'clean';
type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

interface TaskWithDetails {
  task: {
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
  };
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

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') fetchTasks();
  }, [status]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/housekeeping/tasks');
      if (!response.ok) throw new Error('Failed to fetch tasks');
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
      if (!response.ok) throw new Error('Failed to update task');
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
        body: JSON.stringify({ assignedTo: session?.user?.id, status: 'cleaning' }),
      });
      if (!response.ok) throw new Error('Failed to claim task');
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim task');
    }
  };

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter(t => t.task.status === status && (filterPriority === 'all' || t.task.priority === filterPriority));

  const columns: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'dirty', label: 'Dirty', color: 'bg-semantic-error' },
    { status: 'cleaning', label: 'Cleaning', color: 'bg-semantic-warning' },
    { status: 'inspecting', label: 'Inspecting', color: 'bg-semantic-info' },
    { status: 'clean', label: 'Clean', color: 'bg-semantic-success' },
  ];

  const priorityColors: Record<TaskPriority, string> = {
    urgent: 'bg-semantic-error text-white',
    high: 'bg-semantic-warning text-white',
    normal: 'bg-nude-300 text-ink-800',
    low: 'bg-nude-100 text-ink-600',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-ci-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nude-50 p-4 md:p-6">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-ink-900 mb-2">Housekeeping Board</h1>
        <p className="text-ink-600">Manage room cleaning tasks at Hotel Etuna</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilterPriority('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium min-h-[44px] transition-colors ${
            filterPriority === 'all'
              ? 'bg-ci-primary text-ci-cream'
              : 'bg-white border border-nude-200 text-ink-700 hover:bg-nude-100'
          }`}
        >
          All
        </button>
        {(['urgent', 'high', 'normal', 'low'] as TaskPriority[]).map(priority => (
          <button
            key={priority}
            onClick={() => setFilterPriority(priority)}
            className={`px-4 py-2 rounded-full text-sm font-medium min-h-[44px] transition-colors ${
              filterPriority === priority
                ? 'bg-ci-primary text-ci-cream'
                : 'bg-white border border-nude-200 text-ink-700 hover:bg-nude-100'
            }`}
          >
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-semantic-error-light border border-semantic-error text-semantic-error-dark rounded-etuna-input p-4 mb-4">
          <p className="font-medium">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max md:grid md:grid-cols-4">
          {columns.map(column => {
            const columnTasks = getTasksByStatus(column.status);
            return (
              <div key={column.status} className="w-80 md:w-full flex-shrink-0">
                <div className={`${column.color} text-white p-4 rounded-t-lg`}>
                  <h2 className="font-bold text-lg">
                    {column.label}
                    <span className="ml-2 bg-white/30 text-white px-2 py-0.5 rounded-full text-sm">
                      {columnTasks.length}
                    </span>
                  </h2>
                </div>
                <div className="bg-white rounded-b-lg p-4 min-h-[200px] space-y-3 border-x border-b border-nude-200">
                  {columnTasks.length === 0 ? (
                    <p className="text-ink-500 text-center py-8">No tasks</p>
                  ) : (
                    columnTasks.map(({ task, room, booking, assignedStaff }) => (
                      <div key={task.id} className="bg-nude-50 rounded-etuna-input p-4 border border-nude-200 transition-shadow">
                        <h3 className="font-semibold text-ink-900 text-base mb-1">
                          Room {room.roomNumber}
                          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
                            {task.priority}
                          </span>
                        </h3>
                        <p className="text-sm text-ink-600 mb-1">{room.roomType}</p>
                        {booking && (
                          <p className="text-xs text-ink-500 mb-1">Booking: {booking.bookingReference}</p>
                        )}
                        {assignedStaff && (
                          <p className="text-xs text-ink-500 mb-1">
                            Assigned: {assignedStaff.firstName} {assignedStaff.lastName}
                          </p>
                        )}
                        {task.notes && (
                          <p className="text-xs text-ink-600 mt-2 italic">{task.notes}</p>
                        )}
                        <div className="flex gap-2 mt-3">
                          {task.status === 'dirty' && !task.assignedTo && (
                            <button onClick={() => claimTask(task.id)} className="px-4 py-2 rounded-full bg-ci-primary text-ci-cream font-medium text-sm hover:bg-ci-primary/90 transition-colors min-h-[44px]">
                              Claim
                            </button>
                          )}
                          {task.status === 'dirty' && task.assignedTo && (
                            <button onClick={() => updateTaskStatus(task.id, 'cleaning')} className="px-4 py-2 rounded-full bg-ci-primary text-ci-cream font-medium text-sm hover:bg-ci-primary/90 transition-colors min-h-[44px]">
                              Start Cleaning
                            </button>
                          )}
                          {task.status === 'cleaning' && (
                            <button onClick={() => updateTaskStatus(task.id, 'inspecting')} className="px-4 py-2 rounded-full bg-ci-primary text-ci-cream font-medium text-sm hover:bg-ci-primary/90 transition-colors min-h-[44px]">
                              Ready for Inspection
                            </button>
                          )}
                          {task.status === 'inspecting' && (
                            <>
                              <button onClick={() => updateTaskStatus(task.id, 'cleaning')} className="px-4 py-2 rounded-full border border-semantic-warning text-semantic-warning-dark font-medium text-sm hover:bg-semantic-warning-light transition-colors min-h-[44px]">
                                Re-clean
                              </button>
                              <button onClick={() => updateTaskStatus(task.id, 'clean')} className="px-4 py-2 rounded-full bg-semantic-success text-white font-medium text-sm hover:bg-semantic-success-dark transition-colors min-h-[44px]">
                                Approve
                              </button>
                            </>
                          )}
                        </div>
                        <div className="text-xs text-nude-400 mt-2">
                          {task.startedAt && <p>Started: {new Date(task.startedAt).toLocaleTimeString()}</p>}
                          {task.completedAt && <p>Completed: {new Date(task.completedAt).toLocaleTimeString()}</p>}
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

      <div className="fixed bottom-4 right-4 md:static md:mt-6 md:text-right">
        <button
          onClick={fetchTasks}
          className="w-14 h-14 md:w-auto md:px-6 md:py-3 rounded-full bg-ci-primary text-ci-cream shadow-lg hover:bg-ci-primary/90 transition-colors flex items-center justify-center md:gap-2 min-h-[44px]"
          title="Refresh tasks"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="hidden md:inline">Refresh</span>
        </button>
      </div>
    </div>
  );
}
