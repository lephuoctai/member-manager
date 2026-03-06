import React, { useRef } from "react";
import { Box, Text } from "zmp-ui";
import { AttendanceEvent, EventStatusEnum } from "@/types/event";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface EventCardProps {
  event: AttendanceEvent;
  onClick: () => void;
  selectionMode?: boolean;
  selected?: boolean;
  onLongPress?: () => void;
  onToggleSelect?: () => void;
}

function EventCard({
  event,
  onClick,
  selectionMode = false,
  selected = false,
  onLongPress,
  onToggleSelect,
}: EventCardProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const movedRef = useRef(false);

  const handleTouchStart = () => {
    movedRef.current = false;
    timerRef.current = setTimeout(() => {
      if (!movedRef.current && onLongPress) {
        onLongPress();
      }
      timerRef.current = null;
    }, 500);
  };

  const handleTouchMove = () => {
    movedRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = () => {
    if (selectionMode) {
      onToggleSelect?.();
    } else {
      onClick();
    }
  };

  const statusColor =
    event.status === EventStatusEnum.open
      ? "bg-green-400"
      : event.status === EventStatusEnum.paused
      ? "bg-yellow-400"
      : "bg-red-400";

  const statusBgColor =
    event.status === EventStatusEnum.open
      ? "bg-green-50 text-green-700"
      : event.status === EventStatusEnum.paused
      ? "bg-yellow-50 text-yellow-700"
      : "bg-red-50 text-red-700";

  return (
    <Box
      className={`flex items-center p-4 bg-white rounded-xl shadow-sm border-2 cursor-pointer active:bg-gray-50 transition-all ${
        selected ? "border-orange-400 bg-orange-50" : "border-gray-100"
      }`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <Box className="flex-shrink-0 mr-3">
          <Box
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              selected
                ? "bg-orange-500 border-orange-500"
                : "border-gray-300 bg-white"
            }`}
          >
            {selected && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M3 7L6 10L11 4"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </Box>
        </Box>
      )}

      <Box className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
        <Text className="text-purple-600 font-bold text-lg">
          {event.title.charAt(0).toUpperCase()}
        </Text>
      </Box>
      <Box className="flex-1 min-w-0">
        <Text className="font-semibold text-base truncate">{event.title}</Text>
        <Text className="text-gray-500 text-sm">
          {event.exp
            ? `Đóng: ${format(new Date(event.exp), "dd/MM/yyyy HH:mm", {
                locale: vi,
              })}`
            : "Không giới hạn"}
        </Text>
      </Box>
      <Box className="flex-shrink-0 flex items-center gap-1">
        <Box className={`w-2 h-2 rounded-full ${statusColor}`} />
        <Text className={`text-xs px-2 py-0.5 rounded-full ${statusBgColor}`}>
          {event.status}
        </Text>
      </Box>
    </Box>
  );
}

export default EventCard;

