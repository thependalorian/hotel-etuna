/**
 * Recent Activity Component
 * 
 * Purpose: Display recent activity feed
 * Location: /components/features/RecentActivity.tsx
 * 
 * Features:
 * - List of recent activities
 * - Status badges
 * - Staggered animations
 * - View all link
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-200
 * 
 * Accessibility:
 * - Semantic HTML structure
 * - Proper heading hierarchy (h2)
 * 
 * @param {Array} activities - Array of activity objects
 * 
 * @module RecentActivity
 */

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Activity {
  id: string;
  type: string;
  description: string;
  time: string;
  status: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="card bg-base-100 shadow-lg card-hover animate-slide-up" style={{ animationDelay: '100ms' }}>
      <div className="card-body">
        <h2 className="card-title text-xl font-display mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div 
              key={activity.id} 
              className="flex items-start gap-3 p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors duration-200 animate-fade-in"
              style={{ animationDelay: `${(index + 1) * 50}ms` }}
            >
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-base-content">{activity.description}</p>
                <p className="text-xs text-base-content/50 mt-1">{activity.time}</p>
              </div>
              <div className={`badge badge-sm flex-shrink-0 ${
                activity.status === 'confirmed' ? 'badge-success' :
                activity.status === 'completed' ? 'badge-info' : 'badge-warning'
              }`}>
                {activity.status}
              </div>
            </div>
          ))}
        </div>
        <div className="card-actions justify-end mt-4">
          <Button asChild size="sm" className="gentle-lift">
            <Link href="/analytics">
              View All Activity
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
