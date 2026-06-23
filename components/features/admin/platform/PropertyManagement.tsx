/**
 * Property Management Component
 * 
 * Purpose: Component for managing all properties across tenants
 * Location: components/features/admin/platform/PropertyManagement.tsx
 * 
 * Features:
 * - List all properties from all tenants
 * - Search and filter properties
 * - View property details
 * 
 * Database: Uses Drizzle ORM data passed from server component
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  Search, 
  Eye, 
  MapPin,
  Building2,
  Grid3X3,
  List,
  Star,
  DollarSign,
  Bed,
  Bath
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PropertyWithCounts {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  property_type: string | null;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  base_price: number | null;
  status: string;
  is_featured: boolean;
  tenant_id: string;
  created_at: string;
  tenant_name: string | null;
  room_count: number;
}

interface PropertyManagementProps {
  properties: PropertyWithCounts[];
  userRole: string;
}

export default function PropertyManagement({ properties: initialProperties, userRole }: PropertyManagementProps) {
  const router = useRouter();
  const [properties] = useState<PropertyWithCounts[]>(initialProperties);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithCounts | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const isSuperAdmin = userRole === 'super-admin';

  const filteredProperties = properties.filter(property => {
    const matchesSearch = searchQuery === '' || 
      property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (property.address && property.address.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === 'all' || property.property_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const propertyCounts = {
    total: properties.length,
    active: properties.filter(p => p.status === 'active').length,
    inactive: properties.filter(p => p.status === 'inactive').length,
    featured: properties.filter(p => p.is_featured).length,
  };

  const propertyTypes = [...new Set(properties.map(p => p.property_type).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat bg-base-100 rounded-etuna-input shadow">
          <div className="stat-title">Total Properties</div>
          <div className="stat-value text-primary">{propertyCounts.total}</div>
        </div>
        <div className="stat bg-base-100 rounded-etuna-input shadow">
          <div className="stat-title">Active</div>
          <div className="stat-value text-success">{propertyCounts.active}</div>
        </div>
        <div className="stat bg-base-100 rounded-etuna-input shadow">
          <div className="stat-title">Featured</div>
          <div className="stat-value text-warning">{propertyCounts.featured}</div>
        </div>
        <div className="stat bg-base-100 rounded-etuna-input shadow">
          <div className="stat-title">Avg. Price</div>
          <div className="stat-value text-info">
            ${properties.length > 0 
              ? Math.round(properties.reduce((sum, p) => sum + (p.base_price || 0), 0) / properties.length)
              : 0}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
            <input
              type="text"
              placeholder="Search properties..."
              className="input input-bordered pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <select 
            className="select select-bordered"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            {propertyTypes.map(type => (
              <option key={type} value={type!}>{type}</option>
            ))}
          </select>

          <select 
            className="select select-bordered"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Properties Grid/List */}
      {filteredProperties.length === 0 ? (
        <div className="p-8 text-center text-base-content/50 bg-base-100 rounded-etuna-input shadow">
          <Home className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No properties found</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <div key={property.id} className="card bg-base-100 transition-shadow">
              <figure className="relative h-48 bg-base-200">
                <div className="absolute top-2 right-2 z-10">
                  {property.is_featured && (
                    <span className="badge badge-warning">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-center h-full text-base-content/30">
                  <Home className="w-16 h-16" />
                </div>
              </figure>
              <div className="card-body">
                <h2 className="card-title text-lg">
                  {property.name}
                  {property.status === 'active' ? (
                    <span className="badge badge-success badge-sm">Active</span>
                  ) : (
                    <span className="badge badge-ghost badge-sm">Inactive</span>
                  )}
                </h2>
                <div className="text-sm text-base-content/60 flex items-center gap-1 mb-2">
                  <MapPin className="w-3 h-3" />
                  {property.address || 'No address'}, {property.city || ''}
                </div>
                <div className="flex flex-wrap gap-2 text-sm mb-3">
                  <span className="badge badge-outline">
                    <Bed className="w-3 h-3 mr-1" />
                    {property.bedrooms} beds
                  </span>
                  <span className="badge badge-outline">
                    <Bath className="w-3 h-3 mr-1" />
                    {property.bathrooms} baths
                  </span>
                  <span className="badge badge-outline">
                    <DollarSign className="w-3 h-3" />
                    {property.base_price || 0}/night
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-base-content/50 mb-3">
                  <Building2 className="w-3 h-3" />
                  {property.tenant_name || 'Unknown Tenant'}
                </div>
                <div className="card-actions justify-end flex-wrap gap-1">
                  <Button asChild size="sm">
                    <Link href={`/admin/platform/properties/${property.id}`}>
                      Open page
                    </Link>
                  </Button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm rounded-full px-4"
                    onClick={() => {
                      setSelectedProperty(property);
                      setShowDetailModal(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    Quick view
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-etuna-input shadow">
          <table className="table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Type</th>
                <th>Location</th>
                <th>Details</th>
                <th>Price</th>
                <th>Status</th>
                <th>Tenant</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProperties.map((property) => (
                <tr key={property.id}>
                  <td>
                    <div className="font-medium">{property.name}</div>
                    {property.is_featured && (
                      <span className="badge badge-warning badge-xs">
                        <Star className="w-2 h-2 mr-1" />
                        Featured
                      </span>
                    )}
                  </td>
                  <td>{property.property_type || 'N/A'}</td>
                  <td>
                    <div className="text-sm">
                      {property.city}, {property.country}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-2 text-sm">
                      <span>{property.bedrooms} bed</span>
                      <span>{property.bathrooms} bath</span>
                      <span>{property.max_guests} guests</span>
                    </div>
                  </td>
                  <td>${property.base_price || 0}</td>
                  <td>
                    <span className={`badge badge-sm ${
                      property.status === 'active' ? 'badge-success' : 'badge-ghost'
                    }`}>
                      {property.status}
                    </span>
                  </td>
                  <td className="text-sm">{property.tenant_name || 'N/A'}</td>
                  <td>
                    <div className="flex gap-1">
                      <Link
                        href={`/admin/platform/properties/${property.id}`}
                        className="btn btn-ghost btn-sm rounded-full px-4"
                        title="Open detail page"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm rounded-full px-4"
                        title="Quick view"
                        onClick={() => {
                          setSelectedProperty(property);
                          setShowDetailModal(true);
                        }}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Property Detail Modal */}
      {showDetailModal && selectedProperty && (
        <div className="modal modal-open">
          <div className="modal-box w-full max-w-lg mx-4 sm:mx-auto sm:max-w-2xl">
            <h3 className="font-bold text-lg mb-4">{selectedProperty.name}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <p className="text-base-content/70">{selectedProperty.property_type || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <p className="text-base-content/70">{selectedProperty.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Bedrooms</label>
                <p className="text-base-content/70">{selectedProperty.bedrooms}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Bathrooms</label>
                <p className="text-base-content/70">{selectedProperty.bathrooms}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Max Guests</label>
                <p className="text-base-content/70">{selectedProperty.max_guests}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Base Price</label>
                <p className="text-base-content/70">${selectedProperty.base_price || 0}/night</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Address</label>
                <p className="text-base-content/70">
                  {selectedProperty.address}, {selectedProperty.city}, {selectedProperty.country}
                </p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Description</label>
                <p className="text-base-content/70">{selectedProperty.description || 'No description'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Tenant</label>
                <p className="text-base-content/70">{selectedProperty.tenant_name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Created</label>
                <p className="text-base-content/70">
                  {new Date(selectedProperty.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="modal-action">
              <button 
                className="btn rounded-full px-6" 
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedProperty(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowDetailModal(false)}></div>
        </div>
      )}
    </div>
  );
}
