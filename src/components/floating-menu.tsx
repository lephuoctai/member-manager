import React, { useState } from "react";
import { Box, Icon, Sheet, Text } from "zmp-ui";
import { useNavigate } from "zmp-ui";
import { useAtom } from "jotai";
import { currentStudentAtom } from "@/state/auth";
import { RoleEnum } from "@/types/member";

function FloatingMenu() {
  const [visible, setVisible] = useState(false);
  const [currentStudent] = useAtom(currentStudentAtom);
  const navigate = useNavigate();

  const isAdmin = currentStudent?.role === RoleEnum.admin;

  const menuItems = [
    {
      label: "Cài đặt",
      icon: "zi-setting" as const,
      path: "/settings",
      show: true,
    },
    {
      label: "Thành viên",
      icon: "zi-group" as const,
      path: "/members",
      show: isAdmin,
    },
  ];

  const handleNavigate = (path: string) => {
    setVisible(false);
    navigate(path);
  };

  return (
    <>
      {/* Floating Action Button */}
      <Box
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg cursor-pointer active:scale-95 transition-transform"
        onClick={() => setVisible(true)}
      >
        <Icon icon="zi-setting" className="text-white" size={28} />
      </Box>

      {/* Menu Sheet */}
      <Sheet
        visible={visible}
        onClose={() => setVisible(false)}
        autoHeight
        mask
        handler
        swipeToClose
      >
        <Box className="p-4 pb-8">
          <Text.Title size="normal" className="mb-4 text-center font-bold">
            Menu
          </Text.Title>
          <Box className="space-y-2">
            {menuItems
              .filter((item) => item.show)
              .map((item) => (
                <Box
                  key={item.path}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => handleNavigate(item.path)}
                >
                  <Box className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Icon icon={item.icon} className="text-blue-600" size={22} />
                  </Box>
                  <Text className="font-medium text-base">{item.label}</Text>
                  <Box className="ml-auto">
                    <Icon icon="zi-chevron-right" size={20} className="text-gray-400" />
                  </Box>
                </Box>
              ))}
          </Box>
        </Box>
      </Sheet>
    </>
  );
}

export default FloatingMenu;

