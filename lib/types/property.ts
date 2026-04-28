// PropertyType enum doesn't exist - using string instead

export interface PropertyData {
  name: string;
  type: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  roomCount?: number;
  amenities?: string[];
  images?: string[];
  checkInTime?: string;
  checkOutTime?: string;
}
