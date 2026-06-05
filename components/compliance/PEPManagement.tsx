/**
 * PEP Management Component
 * 
 * Purpose: Manage Politically Exposed Persons and Enhanced Due Diligence
 * Location: components/compliance/PEPManagement.tsx
 * 
 * Features:
 * - Active PEP list
 * - EDD status tracking
 * - Guest screening interface
 * - PEP database management
 */

'use client';

import { useState, useEffect } from 'react';
import { Users, Shield, Search, FileCheck, AlertTriangle } from 'lucide-react';
import { securityLogger } from '@/lib/utils/security-logger.client';

interface PEPFlag {
  flag: {
    id: string;
    flagType: string;
    matchConfidence: string;
    eddCompleted: boolean;
    relationshipApproved: boolean;
    ongoingMonitoringLevel: string;
    createdAt: Date;
  };
  pep: {
    fullName: string;
    pepCategory: string;
    positionTitle: string;
    organization: string;
    riskLevel: string;
  } | null;
  guest: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

interface PEPManagementProps {
  tenantId: string;
}

export default function PEPManagement({ tenantId }: PEPManagementProps) {
  const [pepFlags, setPepFlags] = useState<PEPFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [guestIdToScreen, setGuestIdToScreen] = useState('');
  const [screeningResult, setScreeningResult] = useState<any>(null);

  useEffect(() => {
    fetchPEPFlags();
  }, [tenantId]);

  const fetchPEPFlags = async () => {
    try {
      const response = await fetch(`/api/compliance/aml/pep/screen?tenantId=${tenantId}`);
      const result = await response.json();
      
      if (result.success) {
        setPepFlags(result.data.pepFlags);
      }
    } catch (error) {
      securityLogger.error('Error fetching PEP flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScreenGuest = async () => {
    if (!guestIdToScreen) return;

    try {
      const response = await fetch('/api/compliance/aml/pep/screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: guestIdToScreen,
          tenantId,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setScreeningResult(result.data);
        if (result.data.isMatch) {
          fetchPEPFlags();
        }
      }
    } catch (error) {
      securityLogger.error('Error screening guest:', error);
    }
  };

  const filteredFlags = pepFlags.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.guest?.firstName?.toLowerCase().includes(searchLower) ||
      item.guest?.lastName?.toLowerCase().includes(searchLower) ||
      item.pep?.fullName?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            PEP Management
          </h1>
          <p className="text-base-content/70 mt-1">
            Enhanced Due Diligence per FIA Section 25
          </p>
        </div>
      </div>

      {/* Guest Screening Tool */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">
            <Search className="h-5 w-5" />
            Screen Guest for PEP Status
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Guest ID"
              className="input input-bordered flex-1"
              value={guestIdToScreen}
              onChange={(e) => setGuestIdToScreen(e.target.value)}
            />
            <button 
              onClick={handleScreenGuest} 
              className="btn btn-primary"
            >
              Screen Guest
            </button>
          </div>

          {screeningResult && (
            <div className={`alert ${
              screeningResult.isMatch ? 'alert-warning' : 'alert-success'
            } mt-4`}>
              {screeningResult.isMatch ? (
                <>
                  <AlertTriangle className="h-6 w-6" />
                  <div>
                    <h3 className="font-bold">PEP Match Found</h3>
                    <p className="text-sm">
                      Found {screeningResult.matches.length} potential match(es). 
                      Risk Level: {screeningResult.riskLevel}
                      {screeningResult.requiresEDD && ' - Enhanced Due Diligence Required'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <FileCheck className="h-6 w-6" />
                  <div>
                    <h3 className="font-bold">No PEP Match</h3>
                    <p className="text-sm">Guest cleared - No PEP matches found</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="stats shadow w-full">
        <div className="stat">
          <div className="stat-figure text-primary">
            <Users className="h-8 w-8" />
          </div>
          <div className="stat-title">Active PEP Flags</div>
          <div className="stat-value text-primary">{pepFlags.length}</div>
        </div>
        
        <div className="stat">
          <div className="stat-figure text-warning">
            <Shield className="h-8 w-8" />
          </div>
          <div className="stat-title">Pending EDD</div>
          <div className="stat-value text-warning">
            {pepFlags.filter(f => !f.flag.eddCompleted).length}
          </div>
        </div>
        
        <div className="stat">
          <div className="stat-figure text-success">
            <FileCheck className="h-8 w-8" />
          </div>
          <div className="stat-title">EDD Completed</div>
          <div className="stat-value text-success">
            {pepFlags.filter(f => f.flag.eddCompleted).length}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="form-control">
        <div className="input-group">
          <input
            type="text"
            placeholder="Search PEP flags..."
            className="input input-bordered w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-square">
            <Search className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* PEP Flags List */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Active PEP Flags</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>PEP Match</th>
                  <th>Category</th>
                  <th>Match Type</th>
                  <th>Confidence</th>
                  <th>EDD Status</th>
                  <th>Monitoring</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFlags.map((item) => (
                  <tr key={item.flag.id}>
                    <td>
                      <div>
                        <div className="font-bold">
                          {item.guest?.firstName} {item.guest?.lastName}
                        </div>
                        <div className="text-xs text-base-content/70">
                          {item.guest?.email}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="font-semibold">{item.pep?.fullName}</div>
                        <div className="text-xs text-base-content/70">
                          {item.pep?.positionTitle}
                        </div>
                        <div className="text-xs text-base-content/70">
                          {item.pep?.organization}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-primary">
                        {item.pep?.pepCategory}
                      </span>
                    </td>
                    <td>{item.flag.flagType.replace(/_/g, ' ')}</td>
                    <td>
                      <span className={`badge ${
                        parseFloat(item.flag.matchConfidence) >= 90 ? 'badge-error' :
                        parseFloat(item.flag.matchConfidence) >= 70 ? 'badge-warning' :
                        'badge-info'
                      }`}>
                        {item.flag.matchConfidence}%
                      </span>
                    </td>
                    <td>
                      {item.flag.eddCompleted ? (
                        <span className="badge badge-success">Completed</span>
                      ) : (
                        <span className="badge badge-warning">Pending</span>
                      )}
                    </td>
                    <td>
                      <span className="badge">
                        {item.flag.ongoingMonitoringLevel}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-xs btn-primary">
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
