"use client";

import { TimeSlot, DoctorSummary } from "@/types";
import { Clock, User } from "lucide-react";

interface TimeSlotSelectorProps {
  timeSlots: TimeSlot[];
  doctors: DoctorSummary[];
  selectedSlot: string | null;
  onSelectSlot: (slotId: string, doctorId: string) => void;
  groupByDoctor?: boolean;
}

export default function TimeSlotSelector({
  timeSlots,
  doctors,
  selectedSlot,
  onSelectSlot,
  groupByDoctor = true,
}: TimeSlotSelectorProps) {
  if (timeSlots.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">Không có khung giờ khả dụng</p>
      </div>
    );
  }

  if (!groupByDoctor) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Chọn khung giờ khám</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {timeSlots.map((slot) => (
            <button
              key={slot.id}
              onClick={() => onSelectSlot(slot.id, "")}
              disabled={!slot.isAvailable}
              className={`
                p-3 rounded-lg border-2 transition-all text-center
                ${
                  selectedSlot === slot.id
                    ? "border-blue-600 bg-blue-50"
                    : slot.isAvailable
                      ? "border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                      : "border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
                }
              `}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="h-4 w-4" />
                <span className="font-medium">
                  {slot.startTime.substring(0, 5)}
                </span>
              </div>
              <span className="text-xs text-gray-600">
                {slot.isAvailable
                  ? `${slot.remainingCapacity} chỗ trống`
                  : "Đã đầy"}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Group by doctor
  const slotsByDoctor = doctors.map((doctor) => {
    const doctorSlots = timeSlots.filter((slot) => {
      // This would need to be adjusted based on how slots are linked to doctors
      return slot.isAvailable;
    });
    return { doctor, slots: doctorSlots };
  });

  return (
    <div className="space-y-4">
      {slotsByDoctor.map(({ doctor, slots }) => (
        <div key={doctor.id} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4 mb-4 pb-4 border-b">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{doctor.fullName}</h3>
              <p className="text-sm text-gray-600">{doctor.specialtyName}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {slots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => onSelectSlot(slot.id, doctor.id)}
                disabled={!slot.isAvailable}
                className={`
                  p-3 rounded-lg border-2 transition-all text-center
                  ${
                    selectedSlot === slot.id
                      ? "border-blue-600 bg-blue-50"
                      : slot.isAvailable
                        ? "border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                        : "border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
                  }
                `}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">
                    {slot.startTime.substring(0, 5)}
                  </span>
                </div>
                <span className="text-xs text-gray-600">
                  {slot.isAvailable
                    ? `${slot.remainingCapacity} chỗ`
                    : "Đã đầy"}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
