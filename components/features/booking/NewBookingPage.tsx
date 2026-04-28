import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BedDouble, Building, Calendar, CreditCard, Home, Hotel, Mail, Phone, Star, User, Users } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { apiUrl } from '@/lib/utils/api-url';

interface Property {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
}

interface Room {
  id: string;
  number: string;
  type: string;
  capacity: number;
  pricePerNight: number;
  amenities: string[];
}

interface GuestData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  country?: string;
  idNumber?: string;
}

const roomTypeIcons = {
  standard: Hotel,
  deluxe: Star,
  suite: BedDouble,
} as const;

function RoomTypeGlyph({ type }: { type: string }) {
  const Icon = roomTypeIcons[type.toLowerCase() as keyof typeof roomTypeIcons] ?? Home;
  return <Icon className="w-6 h-6 text-primary" aria-hidden />;
}

export default function NewBookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [bookingData, setBookingData] = useState({
    checkInDate: '',
    checkOutDate: '',
    adultCount: 1,
    childCount: 0,
    specialRequests: '',
  });
  const [guestData, setGuestData] = useState<GuestData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'NA',
    idNumber: '',
  });

  // Available data
  const [properties, setProperties] = useState<Property[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    setLoadingProperties(true);
    try {
      const response = await fetch(apiUrl('/api/properties'));
      if (!response.ok) throw new Error('Failed to fetch properties');
      const data = await response.json();
      setProperties(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setLoadingProperties(false);
    }
  }

  useEffect(() => {
    async function fetchAvailableRooms() {
      if (!selectedProperty || !bookingData.checkInDate || !bookingData.checkOutDate) return;

      setLoadingRooms(true);
      try {
        const checkIn = new Date(bookingData.checkInDate);
        const checkOut = new Date(bookingData.checkOutDate);

        const response = await fetch(
          apiUrl(`/api/rooms/available?propertyId=${selectedProperty.id}&checkIn=${checkIn.toISOString()}&checkOut=${checkOut.toISOString()}`)
        );
        if (!response.ok) throw new Error('Failed to fetch available rooms');
        const data = await response.json();
        setAvailableRooms(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred.');
        }
      } finally {
        setLoadingRooms(false);
      }
    }

    if (selectedProperty && bookingData.checkInDate && bookingData.checkOutDate) {
      fetchAvailableRooms();
    }
  }, [selectedProperty, bookingData.checkInDate, bookingData.checkOutDate]);

  const calculateTotalAmount = () => {
    if (!selectedRoom || !bookingData.checkInDate || !bookingData.checkOutDate) return 0;

    const checkIn = new Date(bookingData.checkInDate);
    const checkOut = new Date(bookingData.checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    return selectedRoom.pricePerNight * nights;
  };

  const validateStep = (currentStep: number) => {
    switch (currentStep) {
      case 1:
        if (!selectedProperty) {
          setError('Please select a property');
          return false;
        }
        if (!bookingData.checkInDate || !bookingData.checkOutDate) {
          setError('Please select check-in and check-out dates');
          return false;
        }
        break;
      case 2:
        if (!selectedRoom) {
          setError('Please select a room');
          return false;
        }
        break;
      case 3:
        if (!guestData.firstName || !guestData.lastName || !guestData.email || !guestData.phone) {
          setError('Please fill in all required guest information');
          return false;
        }
        break;
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep(step)) return;
    setError('');
    setStep(step + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const totalAmount = calculateTotalAmount();
      
      const payload = {
        propertyId: selectedProperty!.id,
        roomId: selectedRoom!.id,
        checkInDate: bookingData.checkInDate,
        checkOutDate: bookingData.checkOutDate,
        adultCount: bookingData.adultCount,
        childCount: bookingData.childCount,
        totalAmount,
        specialRequests: bookingData.specialRequests,
        guestData,
      };

      const response = await fetch(apiUrl('/api/bookings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Booking created successfully!');
        setTimeout(() => {
          router.push('/bookings');
        }, 2000);
      } else {
        setError(data.message || 'Failed to create booking');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-NA', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">New Booking</h2>
        <p className="text-base-content/70">Create a new hotel booking for your guests</p>
      </div>

      {/* Progress Steps */}
      <div className="card bg-base-100 shadow-lg mb-6">
        <div className="card-body">
          <ul className="steps w-full">
            <li className={`step ${step >= 1 ? 'step-primary' : ''}`}>
              <div className="text-center">
                <Building className="w-4 h-4" />
                <div className="text-xs mt-1">Property & Dates</div>
              </div>
            </li>
            <li className={`step ${step >= 2 ? 'step-primary' : ''}`}>
              <div className="text-center">
                <Calendar className="w-4 h-4" />
                <div className="text-xs mt-1">Room Selection</div>
              </div>
            </li>
            <li className={`step ${step >= 3 ? 'step-primary' : ''}`}>
              <div className="text-center">
                <User className="w-4 h-4" />
                <div className="text-xs mt-1">Guest Details</div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {error && <div className="alert alert-error mb-6">{error}</div>}
      {success && <div className="alert alert-success mb-6">{success}</div>}

      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Property & Dates */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Select Property & Dates</h3>

                {/* Property Selection */}
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Property *</span>
                  </label>
                  {loadingProperties ? (
                    <LoadingSpinner size="md" />
                  ) : (
                    <select
                      className="select select-bordered w-full"
                      value={selectedProperty?.id || ''}
                      onChange={(e) => {
                        const property = properties.find(p => p.id === e.target.value);
                        setSelectedProperty(property || null);
                        setSelectedRoom(null);
                      }}
                      required
                    >
                      <option value="">Select a property</option>
                      {properties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.name} - {property.type} ({property.city})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Date Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">Check-in Date *</span>
                    </label>
                    <input
                      type="date"
                      className="input input-bordered w-full min-h-[44px]"
                      value={bookingData.checkInDate}
                      onChange={(e) => setBookingData({ ...bookingData, checkInDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                    {bookingData.checkInDate && (
                      <div className="text-sm text-base-content/60 mt-1">
                        {formatDate(bookingData.checkInDate)}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">Check-out Date *</span>
                    </label>
                    <input
                      type="date"
                      className="input input-bordered w-full min-h-[44px]"
                      value={bookingData.checkOutDate}
                      onChange={(e) => setBookingData({ ...bookingData, checkOutDate: e.target.value })}
                      min={bookingData.checkInDate || new Date().toISOString().split('T')[0]}
                      required
                    />
                    {bookingData.checkOutDate && (
                    <div className="text-sm text-base-content/60 mt-1">
                      {formatDate(bookingData.checkOutDate)}
                    </div>
                    )}
                  </div>
                </div>

                {/* Guest Count */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">Adults *</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered w-full min-h-[44px]"
                      value={bookingData.adultCount}
                      onChange={(e) => setBookingData({ ...bookingData, adultCount: parseInt(e.target.value) || 1 })}
                      min="1"
                      max="10"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">Children</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered w-full min-h-[44px]"
                      value={bookingData.childCount}
                      onChange={(e) => setBookingData({ ...bookingData, childCount: parseInt(e.target.value) || 0 })}
                      min="0"
                      max="10"
                    />
                  </div>
                </div>

                {/* Special Requests */}
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Special Requests</span>
                  </label>
                  <textarea
                      className="textarea textarea-bordered w-full h-24 min-h-[120px]"
                    placeholder="Any special requests or requirements..."
                    value={bookingData.specialRequests}
                    onChange={(e) => setBookingData({ ...bookingData, specialRequests: e.target.value })}
                  ></textarea>
                </div>
              </div>
            )}

            {/* Step 2: Room Selection */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Select Room</h3>

                {selectedProperty && (
                  <div className="alert alert-info">
                    <Building className="w-4 h-4" />
                    <div>
                      <strong>{selectedProperty.name}</strong>
                      <div className="text-sm">
                        {formatDate(bookingData.checkInDate)} - {formatDate(bookingData.checkOutDate)}
                        {' • '}
                        {bookingData.adultCount} adult{bookingData.adultCount > 1 ? 's' : ''}
                        {bookingData.childCount > 0 && ` + ${bookingData.childCount} child${bookingData.childCount > 1 ? 'ren' : ''}`}
                      </div>
                    </div>
                  </div>
                )}

                {loadingRooms ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : availableRooms.length === 0 ? (
                  <EmptyState
                    icon={<Calendar className="w-16 h-16 text-base-content/40" />}
                    title="No Available Rooms"
                    description="No rooms are available for the selected dates. Please try different dates or contact the property directly."
                    size="md"
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableRooms.map((room) => (
                      <div
                        key={room.id}
                        className={`card cursor-pointer transition-all ${
                          selectedRoom?.id === room.id
                            ? 'ring-2 ring-primary bg-primary/5'
                            : 'hover:shadow-lg'
                        }`}
                        onClick={() => setSelectedRoom(room)}
                      >
                        <div className="card-body">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <RoomTypeGlyph type={room.type} />
                              <div>
                                <h4 className="font-semibold">Room {room.number}</h4>
                                <div className="text-sm text-base-content/60">{room.type}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-primary">N$ {room.pricePerNight}</div>
                              <div className="text-xs text-base-content/60">per night</div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-base-content/70">
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>Capacity: {room.capacity}</span>
                            </div>
                          </div>

                          {room.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {room.amenities.slice(0, 3).map((amenity, index) => (
                                <span key={index} className="badge badge-sm badge-outline">
                                  {amenity}
                                </span>
                              ))}
                              {room.amenities.length > 3 && (
                                <span className="badge badge-sm badge-ghost">
                                  +{room.amenities.length - 3} more
                                </span>
                              )}
                            </div>
                          )}

                          {selectedRoom?.id === room.id && (
                            <div className="badge badge-primary badge-sm mt-2">
                              Selected
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedRoom && (
                  <div className="alert alert-success mt-4">
                    <CreditCard className="w-4 h-4" />
                    <div>
                      <strong>Total Amount: N$ {calculateTotalAmount().toLocaleString()}</strong>
                      <div className="text-sm">
                        {selectedRoom.pricePerNight} × {Math.ceil((new Date(bookingData.checkOutDate).getTime() - new Date(bookingData.checkInDate).getTime()) / (1000 * 60 * 60 * 24))} nights
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Guest Details */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Guest Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">First Name *</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full min-h-[44px]"
                      placeholder="John"
                      value={guestData.firstName}
                      onChange={(e) => setGuestData({ ...guestData, firstName: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">Last Name *</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full min-h-[44px]"
                      placeholder="Doe"
                      value={guestData.lastName}
                      onChange={(e) => setGuestData({ ...guestData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">Email *</span>
                    </label>
                    <div className="input-group">
                      <span><Mail className="w-4 h-4" /></span>
                      <input
                        type="email"
                        className="input input-bordered flex-1"
                        placeholder="john.doe@example.com"
                        value={guestData.email}
                        onChange={(e) => setGuestData({ ...guestData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">Phone *</span>
                    </label>
                    <div className="input-group">
                      <span><Phone className="w-4 h-4" /></span>
                      <input
                        type="tel"
                        className="input input-bordered flex-1"
                        placeholder="+264 81 123 4567"
                        value={guestData.phone}
                        onChange={(e) => setGuestData({ ...guestData, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Address</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="123 Main Street"
                    value={guestData.address}
                    onChange={(e) => setGuestData({ ...guestData, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">City</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full min-h-[44px]"
                      placeholder="Windhoek"
                      value={guestData.city}
                      onChange={(e) => setGuestData({ ...guestData, city: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">ID Number</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full min-h-[44px]"
                      placeholder="1234567890"
                      value={guestData.idNumber}
                      onChange={(e) => setGuestData({ ...guestData, idNumber: e.target.value })}
                    />
                  </div>
                </div>

                {/* Booking Summary */}
                <div className="divider">Booking Summary</div>
                <div className="bg-base-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Property & Room</h4>
                      <div className="text-sm space-y-1">
                        <div><strong>{selectedProperty?.name}</strong></div>
                        <div>Room {selectedRoom?.number} ({selectedRoom?.type})</div>
                        <div>{formatDate(bookingData.checkInDate)} - {formatDate(bookingData.checkOutDate)}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Guests & Amount</h4>
                      <div className="text-sm space-y-1">
                        <div>
                          {bookingData.adultCount} adult{bookingData.adultCount > 1 ? 's' : ''}
                          {bookingData.childCount > 0 && ` + ${bookingData.childCount} child${bookingData.childCount > 1 ? 'ren' : ''}`}
                        </div>
                        <div className="text-lg font-bold text-primary">
                          Total: N$ {calculateTotalAmount().toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="card-actions justify-between mt-8">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => step > 1 ? prevStep() : router.back()}
                disabled={loading}
              >
                {step > 1 ? 'Previous' : 'Cancel'}
              </button>

              <div className="space-x-2">
                {step < 3 ? (
                  <button
                    type="button"
                    className="btn btn-primary min-h-[44px]"
                    onClick={nextStep}
                    disabled={loading}
                    aria-label="Continue to next step"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="btn btn-primary min-h-[44px]"
                    disabled={loading}
                    aria-label={loading ? 'Creating booking...' : 'Create booking'}
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Creating Booking...
                      </>
                    ) : (
                      'Create Booking'
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
