export interface StaffData {
  propertyId: string;
  userId?: string;
  employeeNumber?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  hireDate: Date;
  terminationDate?: Date;
  position: string;
  department?: string;
  salary?: number;
  currency?: string;
  employmentType?: string;
  status?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}
