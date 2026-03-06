import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AttendanceEvent, EventStatusEnum } from "@/types/event";

const COLLECTION_NAME = "events";

export async function createEvent(
  data: AttendanceEvent
): Promise<AttendanceEvent> {
  const ref = doc(db, COLLECTION_NAME, data.eventId);
  await setDoc(ref, data);
  return data;
}

export async function getAllEvents(): Promise<AttendanceEvent[]> {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  return snapshot.docs.map((d) => d.data() as AttendanceEvent);
}

export async function getEventById(
  eventId: string
): Promise<AttendanceEvent | null> {
  const ref = doc(db, COLLECTION_NAME, eventId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as AttendanceEvent;
}

export async function updateEvent(
  eventId: string,
  data: Partial<Omit<AttendanceEvent, "eventId" | "title">>
): Promise<void> {
  const ref = doc(db, COLLECTION_NAME, eventId);
  await updateDoc(ref, data as any);
}

export async function deleteEvents(eventIds: string[]): Promise<void> {
  await Promise.all(
    eventIds.map((id) => deleteDoc(doc(db, COLLECTION_NAME, id)))
  );
}

export async function addAttendee(
  eventId: string,
  studentId: string,
  timestamp: number
): Promise<void> {
  const ref = doc(db, COLLECTION_NAME, eventId);
  await updateDoc(ref, {
    [`attendee.${studentId}`]: timestamp,
  });
}

export async function removeAttendees(
  eventId: string,
  studentIds: string[]
): Promise<void> {
  const ref = doc(db, COLLECTION_NAME, eventId);
  const updates: Record<string, any> = {};
  studentIds.forEach((sid) => {
    updates[`attendee.${sid}`] = deleteField();
  });
  await updateDoc(ref, updates);
}

