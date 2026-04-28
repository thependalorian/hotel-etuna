export interface GuestData {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: Date;
  nationality?: string;
  passportNumber?: string;
  idNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  preferences?: Record<string, unknown>;
  marketingConsent?: boolean;
  isSignedUp?: boolean;
}
