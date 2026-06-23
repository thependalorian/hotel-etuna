import React from 'react';
import StaffForm from '@/components/features/staff/StaffForm';

const NewStaffPage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="etuna-page-title mb-2">Add New Staff Member</h1>
        <p className="text-base-content/70">Add a new team member to your staff</p>
      </div>
      <div className="card bg-base-100 card-hover">
        <div className="card-body">
          <StaffForm />
        </div>
      </div>
    </div>
  );
};

export default NewStaffPage;
