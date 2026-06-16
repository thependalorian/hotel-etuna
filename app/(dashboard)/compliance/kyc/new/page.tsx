/**
 * Create KYC/KYB case — form
 *
 * Purpose: Collect subject metadata and optional profile; links to detail for documents
 * Location: /app/(dashboard)/compliance/kyc/new/page.tsx
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';

export default function NewComplianceCasePage() {
  const router = useRouter();
  const [subjectType, setSubjectType] = useState('staff');
  const [subjectId, setSubjectId] = useState('');
  const [subjectParty, setSubjectParty] = useState('individual');
  const [kycTier, setKycTier] = useState('lite');
  const [fullName, setFullName] = useState('');
  const [nationality, setNationality] = useState('');
  const [nationalIdOrPassport, setNationalIdOrPassport] = useState('');
  const [residentialAddress, setResidentialAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyRegistration, setCompanyRegistration] = useState('');
  const [natureOfBusiness, setNatureOfBusiness] = useState('');
  const [businessLocation, setBusinessLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search);
    const sid = q.get('subjectId');
    if (sid) setSubjectId(sid);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const profile: Record<string, string> = {
      fullName,
      nationality,
      nationalIdOrPassport,
    };
    if (kycTier === 'full') {
      if (residentialAddress) profile.residentialAddress = residentialAddress;
      if (email) profile.email = email;
      if (phone) profile.phone = phone;
    }
    if (subjectParty === 'business') {
      if (companyRegistration) profile.companyRegistration = companyRegistration;
      if (kycTier === 'full') {
        if (natureOfBusiness) profile.natureOfBusiness = natureOfBusiness;
        if (businessLocation) profile.businessLocation = businessLocation;
      }
    }

    try {
      const res = await fetch('/api/compliance/kyc-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectType,
          subjectId: subjectId || undefined,
          subjectParty,
          kycTier,
          profile,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error?.message || 'Failed to create case');
        return;
      }
      const id = json?.data?.case?.id;
      if (id) router.push(`/compliance/kyc/${id}`);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="New verification case"
        description="Create a case, then attach scanned documents on the next screen."
        actions={
          <Link href="/compliance/kyc" className="btn btn-ghost min-h-[44px]">
            Back to queue
          </Link>
        }
      />

      <form onSubmit={onSubmit} className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body gap-4">
          {error && (
            <div className="alert alert-error text-sm" role="alert">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="form-control w-full">
              <span className="label-text">Subject type</span>
              <select
                className="select select-bordered w-full"
                value={subjectType}
                onChange={(e) => setSubjectType(e.target.value)}
              >
                <option value="staff">staff</option>
                <option value="user">user</option>
                <option value="tenant_business">tenant_business</option>
              </select>
            </label>
            <label className="form-control w-full">
              <span className="label-text">Subject ID (UUID, optional)</span>
              <input
                className="input input-bordered w-full"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                placeholder="e.g. staff id"
              />
            </label>
            <label className="form-control w-full">
              <span className="label-text">Party</span>
              <select
                className="select select-bordered w-full"
                value={subjectParty}
                onChange={(e) => setSubjectParty(e.target.value)}
              >
                <option value="individual">individual (KYC)</option>
                <option value="business">business (KYB-style)</option>
              </select>
            </label>
            <label className="form-control w-full">
              <span className="label-text">KYC tier</span>
              <select
                className="select select-bordered w-full"
                value={kycTier}
                onChange={(e) => setKycTier(e.target.value)}
              >
                <option value="lite">lite</option>
                <option value="full">full</option>
              </select>
            </label>
          </div>

          <div className="divider">Profile</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="form-control w-full md:col-span-2">
              <span className="label-text">Full name</span>
              <input
                className="input input-bordered w-full"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>
            <label className="form-control w-full">
              <span className="label-text">Nationality</span>
              <input
                className="input input-bordered w-full"
                required
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
              />
            </label>
            <label className="form-control w-full">
              <span className="label-text">National ID or passport</span>
              <input
                className="input input-bordered w-full"
                required
                value={nationalIdOrPassport}
                onChange={(e) => setNationalIdOrPassport(e.target.value)}
              />
            </label>
            {kycTier === 'full' && (
              <>
                <label className="form-control w-full md:col-span-2">
                  <span className="label-text">Residential address</span>
                  <input
                    className="input input-bordered w-full"
                    value={residentialAddress}
                    onChange={(e) => setResidentialAddress(e.target.value)}
                  />
                </label>
                <label className="form-control w-full">
                  <span className="label-text">Email</span>
                  <input
                    type="email"
                    className="input input-bordered w-full"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label className="form-control w-full">
                  <span className="label-text">Phone</span>
                  <input
                    className="input input-bordered w-full"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>
              </>
            )}
            {subjectParty === 'business' && (
              <>
                <label className="form-control w-full md:col-span-2">
                  <span className="label-text">Company registration</span>
                  <input
                    className="input input-bordered w-full"
                    value={companyRegistration}
                    onChange={(e) => setCompanyRegistration(e.target.value)}
                  />
                </label>
                {kycTier === 'full' && (
                  <>
                    <label className="form-control w-full">
                      <span className="label-text">Nature of business</span>
                      <input
                        className="input input-bordered w-full"
                        value={natureOfBusiness}
                        onChange={(e) => setNatureOfBusiness(e.target.value)}
                      />
                    </label>
                    <label className="form-control w-full">
                      <span className="label-text">Business location</span>
                      <input
                        className="input input-bordered w-full"
                        value={businessLocation}
                        onChange={(e) => setBusinessLocation(e.target.value)}
                      />
                    </label>
                  </>
                )}
              </>
            )}
          </div>

          <Button type="submit" isLoading={loading}>
            Create case
          </Button>
        </div>
      </form>
    </div>
  );
}
