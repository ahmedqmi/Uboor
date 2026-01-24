import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useTravelContext } from '../context/TravelContext';
import type { Passenger, TravelRequest } from '../types';
import './TravelerPage.css';

interface PassengerForm {
  id: string;
  name: string;
  documentType: 'passport' | 'id_card';
  documentNumber: string;
}

export function TravelerPage() {
  const { addTravelRequest } = useTravelContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Car details
  const [carPlateNumber, setCarPlateNumber] = useState('');
  const [carType, setCarType] = useState('');
  const [carColor, setCarColor] = useState('');

  // Passengers
  const [passengers, setPassengers] = useState<PassengerForm[]>([
    { id: uuidv4(), name: '', documentType: 'passport', documentNumber: '' },
  ]);

  const addPassenger = () => {
    setPassengers([
      ...passengers,
      { id: uuidv4(), name: '', documentType: 'passport', documentNumber: '' },
    ]);
  };

  const removePassenger = (id: string) => {
    if (passengers.length > 1) {
      setPassengers(passengers.filter((p) => p.id !== id));
    }
  };

  const updatePassenger = (id: string, field: keyof PassengerForm, value: string) => {
    setPassengers(
      passengers.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate form
    if (!carPlateNumber || !carType || !carColor) {
      alert('يرجى إدخال جميع بيانات السيارة');
      setIsSubmitting(false);
      return;
    }

    const invalidPassengers = passengers.some(
      (p) => !p.name || !p.documentNumber
    );
    if (invalidPassengers) {
      alert('يرجى إدخال جميع بيانات المسافرين');
      setIsSubmitting(false);
      return;
    }

    const travelRequest: TravelRequest = {
      id: uuidv4(),
      carPlateNumber,
      carType,
      carColor,
      passengers: passengers as Passenger[],
      submittedAt: new Date(),
      status: 'pending',
    };

    try {
      await addTravelRequest(travelRequest);

      // Reset form
      setCarPlateNumber('');
      setCarType('');
      setCarColor('');
      setPassengers([
        { id: uuidv4(), name: '', documentType: 'passport', documentNumber: '' },
      ]);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to submit travel request:', error);
      alert('حدث خطأ أثناء إرسال الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="traveler-page">
      <div className="page-header">
        <h1>مسافر</h1>
        <p>أدخل بيانات السيارة والمسافرين للعبور</p>
      </div>

      {showSuccess && (
        <>
          <div className="success-overlay" onClick={() => setShowSuccess(false)}></div>
          <div className="success-message">
            <span className="success-icon">✓</span>
            <h3>تم الإرسال بنجاح!</h3>
            <p>تم إرسال طلب العبور وسيتم مراجعته من قبل الإدارة</p>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="travel-form">
        {/* Car Details Section */}
        <section className="form-section">
          <div className="section-header">
            <span className="section-icon">🚗</span>
            <h2>بيانات السيارة</h2>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="carPlate">رقم اللوحة</label>
              <input
                type="text"
                id="carPlate"
                value={carPlateNumber}
                onChange={(e) => setCarPlateNumber(e.target.value)}
                placeholder="أدخل رقم لوحة السيارة"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="carType">نوع السيارة</label>
              <input
                type="text"
                id="carType"
                value={carType}
                onChange={(e) => setCarType(e.target.value)}
                placeholder="مثال: تويوتا كامري"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="carColor">لون السيارة</label>
              <input
                type="text"
                id="carColor"
                value={carColor}
                onChange={(e) => setCarColor(e.target.value)}
                placeholder="مثال: أبيض"
                required
              />
            </div>
          </div>
        </section>

        {/* Passengers Section */}
        <section className="form-section">
          <div className="section-header">
            <span className="section-icon">👥</span>
            <h2>بيانات المسافرين</h2>
            <span className="passenger-count">{passengers.length} مسافر</span>
          </div>

          <div className="passengers-list">
            {passengers.map((passenger, index) => (
              <div key={passenger.id} className="passenger-card">
                <div className="passenger-header">
                  <span className="passenger-number">المسافر {index + 1}</span>
                  {passengers.length > 1 && (
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removePassenger(passenger.id)}
                    >
                      حذف
                    </button>
                  )}
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>الاسم الكامل</label>
                    <input
                      type="text"
                      value={passenger.name}
                      onChange={(e) =>
                        updatePassenger(passenger.id, 'name', e.target.value)
                      }
                      placeholder="أدخل الاسم الكامل"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>نوع الوثيقة</label>
                    <select
                      value={passenger.documentType}
                      onChange={(e) =>
                        updatePassenger(
                          passenger.id,
                          'documentType',
                          e.target.value as 'passport' | 'id_card'
                        )
                      }
                    >
                      <option value="passport">جواز سفر</option>
                      <option value="id_card">بطاقة هوية</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      {passenger.documentType === 'passport'
                        ? 'رقم جواز السفر'
                        : 'رقم بطاقة الهوية'}
                    </label>
                    <input
                      type="text"
                      value={passenger.documentNumber}
                      onChange={(e) =>
                        updatePassenger(
                          passenger.id,
                          'documentNumber',
                          e.target.value
                        )
                      }
                      placeholder="أدخل رقم الوثيقة"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button type="button" className="add-passenger-btn" onClick={addPassenger}>
            <span>+</span> إضافة مسافر
          </button>
        </section>

        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          {isSubmitting ? 'جاري الإرسال...' : 'إرسال طلب العبور'}
        </button>
      </form>
    </div>
  );
}
