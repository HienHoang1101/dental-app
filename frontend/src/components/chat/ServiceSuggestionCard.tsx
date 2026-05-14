"use client";

/**
 * Service Suggestion Card - Modern button-like design
 */

import { useRouter } from "next/navigation";
import { Calendar, ChevronRight, Sparkles } from "lucide-react";
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
      // If we have specialtyId, go directly to date selection
      if (suggestion.specialtyId) {
        router.push(
          `/patient/appointments/book/by-specialty/select-date?specialtyId=${suggestion.specialtyId}&serviceId=${suggestion.serviceId}&sessionId=${sessionId}`,
        );
      } else {
        // Fallback to specialty selection if specialtyId is missing
        router.push(
          `/patient/appointments/book/by-specialty?serviceId=${suggestion.serviceId}&sessionId=${sessionId}`,
        );
      }
    } catch (error) {
      console.error("Failed to create summary:", error);
      router.push(
        `/patient/appointments/book/by-specialty/select-date?specialtyId=${suggestion.specialtyId}&serviceId=${suggestion.serviceId}&sessionId=${sessionId}`,
      );
    }
  };

  return (
    <button
      onClick={handleBooking}
      className="w-full bg-white border border-blue-100 rounded-xl p-3 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center gap-3 text-left group shadow-sm hover:shadow-md"
    >
      <div className="bg-blue-100 p-2 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
        <Sparkles className="w-4 h-4" />
      </div>
      
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900 text-sm">
            {suggestion.serviceName}
          </h4>
          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">
            {Math.round(suggestion.confidence * 100)}%
          </span>
        </div>
        
        <div className="flex items-center gap-3 mt-1">
          {suggestion.estimatedPrice && (
            <span className="text-xs text-blue-600 font-medium">
              {suggestion.estimatedPrice}
            </span>
          )}
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Nhấn để đặt lịch
          </span>
        </div>
      </div>
      
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
    </button>
  );
}
