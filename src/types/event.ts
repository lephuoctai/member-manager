export interface AttendanceEvent {
  eventId: string; // title + timestamp
  title: string;
  desc: string;
  attendee: Record<string, number>; // studentId -> scan timestamp
  date: number; // creation timestamp
  exp: number | null; // closing timestamp, null = no expiry
  status: string;
}

export const EventStatusEnum = {
  open: "Đang mở",
  paused: "Tạm đóng",
  closed: "Đã đóng",
} as const;

export const EVENT_STATUS_LIST = [
  EventStatusEnum.open,
  EventStatusEnum.paused,
  EventStatusEnum.closed,
];

export type EventStatusType =
  (typeof EventStatusEnum)[keyof typeof EventStatusEnum];

