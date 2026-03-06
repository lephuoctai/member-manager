import React from "react";
import { Page } from "zmp-ui";
import { useAtom } from "jotai";
import { currentStudentAtom } from "@/state/auth";
import { StatusEnum } from "@/types/member";
import QRCard from "@/components/qr-card";
import BannedNotice from "@/components/banned-notice";
import FloatingMenu from "@/components/floating-menu";

function HomePage() {
  const [currentStudent] = useAtom(currentStudentAtom);

  if (!currentStudent) return null;

  const isBanned = currentStudent.status === StatusEnum.banned;

  return (
    <Page className="flex flex-col bg-white" style={{ height: "100vh", overflow: "hidden"}}>
      {isBanned ? (
        <BannedNotice student={currentStudent} />
      ) : (
        <QRCard student={currentStudent} />
      )}
      <FloatingMenu />
    </Page>
  );
}

export default HomePage;

