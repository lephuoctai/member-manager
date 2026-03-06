import { useEffect } from "react";
import { useAtom } from "jotai";
import {
  currentStudentAtom,
  zaloUserAtom,
  isLoadingAtom,
  isRegisteredAtom,
} from "@/state/auth";
import { getZaloUser } from "@/lib/zalo";
import { getStudentByUid } from "@/services/student.service";
import { StatusEnum } from "@/types/member";

export function useAuth() {
  const [currentStudent, setCurrentStudent] = useAtom(currentStudentAtom);
  const [zaloUser, setZaloUser] = useAtom(zaloUserAtom);
  const [isLoading, setIsLoading] = useAtom(isLoadingAtom);
  const [isRegistered, setIsRegistered] = useAtom(isRegisteredAtom);

  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        const zUser = await getZaloUser();
        setZaloUser(zUser);

        const student = await getStudentByUid(zUser.id);
        if (student) {
          // Check if ban has expired
          if (
            student.status === StatusEnum.banned &&
            student.bannedUntil &&
            student.bannedUntil < Date.now()
          ) {
            // Auto unban
            const { updateStudent } = await import(
              "@/services/student.service"
            );
            await updateStudent(student.id!, {
              status: StatusEnum.active,
              bannedUntil: undefined,
            });
            student.status = StatusEnum.active;
            student.bannedUntil = undefined;
          }
          setCurrentStudent(student);
          setIsRegistered(true);
        } else {
          setIsRegistered(false);
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  return { currentStudent, zaloUser, isLoading, isRegistered };
}

