"use client";

/**
 * Service Suggestion Card
 */

import { useRouter } from "next/navigation";
import { Calendar, TrendingUp } from "lucide-react";
import type { ServiceSuggestion } from "@/types/chat";
import { createSummary } from "@/lib/api/chatApi";

interface ServiceSuggestionCardProps {
  suggestion: ServiceSuggestion;
  sessionId: string;
}

export function ServiceSuggestionCard({
  suggestion,
  sessionId,
}: ServiceSuggestionCardProps) {
  const router = useRouter();

  const handleBooking = async () => {
    try {
      // Create summary before booking
      await createSummary(sessionId);

      // Navigate to booking page with service and session info
      router.push(
        `/patient/appointments/book/by-specialty/select-date?serviceId=${suggestion.serviceId}&sessionId=${sessionId}`,
      );
    } catch (error) {
      console.error("Failed to create summary:", error);
      // Still navigate even if summary fails
      router.push(
        `/patient/appointments/book/by-specialty/select-date?serviceId=${suggestion.serviceId}&sessionId=${sessionId}`,
      );
    }
  };

  return (
    <div className="bg-white border border-blue-200 rounded-lg p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">
            {suggestion.serviceName}
          </h4>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span>{Math.round(suggestion.confidence * 100)}% phù hợp</span>
          </div>
          {suggestion.estimatedPrice && (
            <p className="text-sm text-gray-500 mt-1">
              💰 {suggestion.estimatedPrice}
            </p>
          )}
        </div>
        <button
          onClick={handleBooking}
          className="ml-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
        >
          <Calendar className="w-4 h-4" />
          Đặt lịch
        </button>
      </div>
    </div>
  );
}
