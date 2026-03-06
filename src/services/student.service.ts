import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  deleteField,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Student, StatusEnum } from "@/types/member";

const COLLECTION_NAME = "students";

export async function getStudentByUid(
  uidZalo: string
): Promise<Student | null> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("uidZalo", "==", uidZalo)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Student;
}

export async function createStudent(
  data: Omit<Student, "id">
): Promise<Student> {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), data);
  return { id: docRef.id, ...data };
}

export async function updateStudent(
  docId: string,
  data: Partial<Student>
): Promise<void> {
  const ref = doc(db, COLLECTION_NAME, docId);
  const { id, ...updateData } = data as any;
  await updateDoc(ref, updateData);
}

export async function getAllStudents(): Promise<Student[]> {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Student));
}

export async function getStudentById(docId: string): Promise<Student | null> {
  const ref = doc(db, COLLECTION_NAME, docId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Student;
}

export async function banStudent(
  docId: string,
  until: number | null
): Promise<void> {
  await updateStudent(docId, {
    status: StatusEnum.banned,
    bannedUntil: until,
  });
}

export async function unbanStudent(docId: string): Promise<void> {
  const ref = doc(db, COLLECTION_NAME, docId);
  await updateDoc(ref, {
    status: StatusEnum.active,
    bannedUntil: deleteField(),
  });
}

export async function batchBanStudents(
  docIds: string[],
  until: number | null
): Promise<void> {
  await Promise.all(docIds.map((id) => banStudent(id, until)));
}

export async function batchUnbanStudents(docIds: string[]): Promise<void> {
  await Promise.all(docIds.map((id) => unbanStudent(id)));
}

