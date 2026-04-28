export interface BookingData {
  propertyId: string;
  guestId: string;
  checkInDate: Date;
  checkOutDate: Date;
  roomCount: number;
  adultCount: number;
  childCount: number;
  totalAmount: number;
  specialRequests?: string;
  roomId: string;
}

export interface GuestData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  country?: string;
  idNumber?: string;
}
