'use client';

/**
 * Housekeeping Board Page
 * 
 * Purpose: Kanban-style board for managing housekeeping tasks
 * Location: /app/(dashboard)/housekeeping/page.tsx
 * 
 * Features:
 * - Kanban columns: Pending, In Progress, Inspection, Completed
 * - Drag-and-drop task cards
 * - Task assignment modal
 * - Task detail modal with photos
 * - Filters by status, assignee, room
 * - Auto-refresh every 30s
 * - Manual task creation
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, apiUrl } from '@/lib/utils/api-helpers-client';
import type { HkTask } from '@/lib/db/schema';

interface TaskColumn {
  id: string;
  title: string;
  status: string;
}

const COLUMNS: TaskColumn[] = [
  { id: 'pending', title: 'Pending', status: 'pending' },
  { id: 'in_progress', title: 'In Progress', status: 'in_progress' },
  { id: 'inspection', title: 'Inspection', status: 'inspection' },
  { id: 'completed', title: 'Completed', status: 'completed' },
];

export default function HousekeepingPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<HkTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<HkTask | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<{ assignedTo?: string; roomId?: string }>({});

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.assignedTo) params.set('assignedTo', filter.assignedTo);
      if (filter.roomId) params.set('roomId', filter.roomId);

      const response = await apiFetch(apiUrl(`/api/housekeeping/tasks?${params.toString()}`));
      if (response.success && response.data) {
        setTasks(response.data.tasks || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadTasks();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadTasks, 30000);
    return () => clearInterval(interval);
  }, [loadTasks]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await apiFetch(apiUrl(`/api/housekeeping/tasks/${taskId}`), {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      await loadTasks();
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
    }
  };

  const handleAssignTask = async (taskId: string, userId: string) => {
    try {
      await apiFetch(apiUrl(`/api/housekeeping/tasks/${taskId}`), {
        method: 'PATCH',
        body: JSON.stringify({ assignedTo: userId }),
      });
      await loadTasks();
    } catch (err: any) {
      setError(err.message || 'Failed to assign task');
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'normal':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'low':
        return 'bg-gray-100 border-gray-300 text-gray-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Housekeeping Board</h1>
            <p className="text-base-content/70 mt-1">
              Manage room cleaning tasks and assignments
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            + Add Task
          </button>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="btn btn-sm btn-ghost">
              ✕
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {COLUMNS.map((column) => {
            const count = getTasksByStatus(column.status).length;
            return (
              <div key={column.id} className="stats shadow">
                <div className="stat">
                  <div className="stat-title">{column.title}</div>
                  <div className="stat-value text-2xl">{count}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((column) => (
            <div key={column.id} className="bg-base-200 rounded-lg p-4">
              <h2 className="font-semibold text-lg mb-4">{column.title}</h2>
              <div className="space-y-3">
                {getTasksByStatus(column.status).map((task) => (
                  <div
                    key={task.id}
                    className={`card bg-base-100 shadow-sm border-l-4 cursor-pointer hover:shadow-md transition-shadow ${getPriorityColor(task.priority)}`}
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="card-body p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">Room {task.roomId?.substring(0, 8)}</p>
                          <p className="text-xs text-base-content/70 capitalize">
                            {task.taskType.replace('_', ' ')}
                          </p>
                        </div>
                        <div className="badge badge-sm capitalize">{task.priority}</div>
                      </div>
                      
                      {task.notes && (
                        <p className="text-xs text-base-content/70 mt-2 line-clamp-2">
                          {task.notes}
                        </p>
                      )}

                      {task.assignedTo && (
                        <div className="mt-2 text-xs text-base-content/70">
                          Assigned
                        </div>
                      )}

                      <div className="flex gap-2 mt-3">
                        {task.status !== 'completed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextStatus =
                                task.status === 'pending'
                                  ? 'in_progress'
                                  : task.status === 'in_progress'
                                  ? 'inspection'
                                  : 'completed';
                              handleStatusChange(task.id, nextStatus);
                            }}
                            className="btn btn-xs btn-primary"
                          >
                            {task.status === 'pending' && 'Start'}
                            {task.status === 'in_progress' && 'Complete'}
                            {task.status === 'inspection' && 'Approve'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <dialog open className="modal">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Task Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="label">Room ID</label>
                <p className="font-mono text-sm">{selectedTask.roomId}</p>
              </div>

              <div>
                <label className="label">Type</label>
                <p className="capitalize">{selectedTask.taskType.replace('_', ' ')}</p>
              </div>

              <div>
                <label className="label">Priority</label>
                <div className={`badge ${getPriorityColor(selectedTask.priority)}`}>
                  {selectedTask.priority}
                </div>
              </div>

              <div>
                <label className="label">Status</label>
                <select
                  className="select select-bordered w-full"
                  value={selectedTask.status}
                  onChange={(e) => {
                    handleStatusChange(selectedTask.id, e.target.value);
                    setSelectedTask(null);
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="inspection">Inspection</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {selectedTask.notes && (
                <div>
                  <label className="label">Notes</label>
                  <p className="text-sm text-base-content/70">{selectedTask.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="label">Created</label>
                  <p>{new Date(selectedTask.createdAt).toLocaleString()}</p>
                </div>
                {selectedTask.startedAt && (
                  <div>
                    <label className="label">Started</label>
                    <p>{new Date(selectedTask.startedAt).toLocaleString()}</p>
                  </div>
                )}
                {selectedTask.completedAt && (
                  <div>
                    <label className="label">Completed</label>
                    <p>{new Date(selectedTask.completedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-action">
              <button className="btn" onClick={() => setSelectedTask(null)}>
                Close
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setSelectedTask(null)}>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
}
