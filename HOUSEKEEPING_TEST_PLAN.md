# Housekeeping System Test Plan

**Agent**: A8  
**Branch**: `agent-8-housekeeping`  
**Date**: Monday Jun 1, 2026

## Overview

This document outlines the comprehensive test plan for the housekeeping task management system.

## Components Implemented

### 1. Database (Migration 0024)
- ✅ `hk_tasks` table with enums and indexes
- ✅ `hk_task_photos` table 
- ✅ RLS policies for tenant isolation
- ✅ Triggers for `updated_at` timestamps

### 2. Services
- ✅ `HousekeepingService.ts` with full CRUD operations
- ✅ Task creation, assignment, status updates
- ✅ Photo management (max 5 per task)
- ✅ Room status sync on task completion

### 3. API Endpoints
- ✅ `GET /api/housekeeping/tasks` - List tasks with filters
- ✅ `POST /api/housekeeping/tasks` - Create task
- ✅ `PATCH /api/housekeeping/tasks/[id]` - Update status/assignment
- ✅ `POST /api/housekeeping/tasks/[id]/photos` - Upload photo
- ✅ `GET /api/housekeeping/tasks/[id]/photos` - Get task photos

### 4. UI Components
- ✅ `/housekeeping` - Kanban board page
- ✅ Sidebar navigation link (Operations section)
- ✅ Task cards with priority colors
- ✅ Task detail modal
- ✅ Status update buttons
- ✅ Auto-refresh every 30s

### 5. Integration
- ✅ Auto-generate task on booking checkout
- ✅ Room status updated to 'available' on task completion

## Test Scenarios

### Test 1: Migration Application
```bash
# Apply migration 0024
psql $DATABASE_URL -f database/drizzle/0024_housekeeping_tasks.sql

# Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('hk_tasks', 'hk_task_photos');

# Expected: 2 rows
```

### Test 2: Checkout Auto-Generation
1. Create a booking for Room 101
2. Check in the guest
3. Check out the guest
4. Verify housekeeping task created:
   - Task type: `checkout_clean`
   - Priority: `high`
   - Status: `pending`
   - Room linked correctly

**Expected Result**: Task auto-created with correct attributes

### Test 3: Task Lifecycle
1. Navigate to `/housekeeping`
2. Verify task appears in "Pending" column
3. Click "Start" button
4. Verify task moves to "In Progress" column
5. Click "Complete" button
6. Verify task moves to "Inspection" column
7. Click "Approve" button
8. Verify task moves to "Completed" column
9. Verify room status updated to 'available'

**Expected Result**: Task progresses through all states correctly

### Test 4: Task Assignment
1. Open task detail modal
2. Assign task to a housekeeper
3. Verify assignment reflected in UI
4. Filter by assigned user
5. Verify only assigned tasks show

**Expected Result**: Assignment and filtering work correctly

### Test 5: Photo Upload
1. Open task detail
2. Upload photo (mock URL)
3. Add caption
4. Verify photo appears in list
5. Upload 5 photos total
6. Attempt 6th photo upload
7. Verify rejection (max 5)

**Expected Result**: Photo upload and limit enforcement work

### Test 6: Manual Task Creation
1. Click "+ Add Task" button
2. Fill form:
   - Room: Select from dropdown
   - Type: `maintenance`
   - Priority: `urgent`
   - Notes: "Broken AC unit"
3. Submit form
4. Verify task appears in board

**Expected Result**: Manual tasks can be created

### Test 7: Auto-Refresh
1. Open `/housekeeping` in two browser tabs
2. In tab 1, create a new task
3. Wait 30 seconds
4. Verify tab 2 auto-refreshes and shows new task

**Expected Result**: Auto-refresh works

### Test 8: Tenant Isolation (RLS)
1. Set tenant context in SQL:
   ```sql
   SET app.current_tenant_id = '<tenant-1-id>';
   SELECT * FROM hk_tasks;
   ```
2. Verify only tenant-1 tasks visible
3. Change context to tenant-2
4. Verify only tenant-2 tasks visible

**Expected Result**: RLS enforces tenant isolation

### Test 9: Status Validation
1. Attempt invalid status transition via API:
   ```bash
   curl -X PATCH /api/housekeeping/tasks/{id} \
     -d '{"status": "invalid_status"}'
   ```
2. Verify 400 error returned

**Expected Result**: Invalid statuses rejected

### Test 10: Photo Limit Enforcement
```bash
# Upload 5 photos
for i in {1..5}; do
  curl -X POST /api/housekeeping/tasks/{id}/photos \
    -d "{\"photoUrl\": \"https://example.com/photo$i.jpg\"}"
done

# Attempt 6th photo
curl -X POST /api/housekeeping/tasks/{id}/photos \
  -d '{"photoUrl": "https://example.com/photo6.jpg"}'
```

**Expected Result**: 6th upload returns 400 error

## Integration Points to Verify

1. **BookingService Checkout**
   - Check `lib/services/booking/BookingService.ts` line ~425
   - Verify `HousekeepingService.createTask()` called on checkout

2. **Room Status Sync**
   - Check `lib/services/housekeeping/HousekeepingService.ts`
   - Verify `updateTaskStatus()` sets room to 'available' on completion

3. **Sidebar Navigation**
   - Check `components/shared/Sidebar.tsx`
   - Verify "Housekeeping" link in Operations section

## Performance Considerations

1. **Index Usage**
   - Verify indexes on `tenant_id, status, created_at`
   - Check query plans for list operations

2. **Auto-Refresh Load**
   - Monitor server load with multiple users
   - Consider WebSocket for real-time updates (future enhancement)

## Security Checklist

- ✅ RLS policies on both tables
- ✅ Tenant context validation in API routes
- ✅ Input validation with Zod schemas
- ✅ Authentication required on all endpoints
- ✅ Photo upload limit enforced server-side

## Known Limitations

1. **No Drag-and-Drop**: Currently using click-based status changes
   - Future: Implement react-beautiful-dnd or similar

2. **No Real-time Updates**: Using 30s polling
   - Future: Implement WebSocket for instant updates

3. **Basic Photo Management**: No actual file upload
   - Future: Integrate with cloud storage (S3, Cloudflare R2)

4. **No Task Comments**: No collaboration features
   - Future: Add comment threads per task

## Success Criteria

✅ Migration 0024 applied successfully  
✅ All API endpoints functional  
✅ Kanban board displays tasks correctly  
✅ Tasks auto-generate on checkout  
✅ Status transitions work correctly  
✅ Room status syncs with task completion  
✅ Photo upload with limit enforcement  
✅ Tenant isolation verified  
✅ Zero TypeScript compilation errors  
✅ Sidebar link present and functional  

## Next Steps (Post-Launch)

1. Add drag-and-drop functionality
2. Implement WebSocket for real-time updates
3. Add file upload for photos
4. Create mobile PWA view
5. Add task comment threads
6. Implement task templates
7. Add reporting and analytics
8. Integrate with staff scheduling

## Rollback Plan

If issues arise:

1. Remove housekeeping link from sidebar
2. Revert BookingService checkout changes
3. Drop migration tables:
   ```sql
   DROP TABLE IF EXISTS hk_task_photos CASCADE;
   DROP TABLE IF EXISTS hk_tasks CASCADE;
   DROP TYPE IF EXISTS hk_task_type CASCADE;
   DROP TYPE IF EXISTS hk_task_status CASCADE;
   DROP TYPE IF EXISTS hk_task_priority CASCADE;
   ```
4. Delete housekeeping files and directories
5. Revert to previous commit

---

**Agent A8 Sign-off**: Ready for production testing
