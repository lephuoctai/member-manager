import { atom } from "jotai";
import { Student } from "@/types/member";
import { ZaloUser } from "@/lib/zalo";

export const currentStudentAtom = atom<Student | null>(null);
export const zaloUserAtom = atom<ZaloUser | null>(null);
export const isLoadingAtom = atom<boolean>(true);
export const isRegisteredAtom = atom<boolean>(false);

