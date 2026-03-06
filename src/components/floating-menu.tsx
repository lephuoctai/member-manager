import React, { useState, useRef, useCallback } from "react";
import { Box, Icon, Sheet, Text } from "zmp-ui";
import { useNavigate } from "zmp-ui";
import { useAtom } from "jotai";
import { currentStudentAtom } from "@/state/auth";
import { RoleEnum } from "@/types/member";

function FloatingMenu() {
  const [visible, setVisible] = useState(false);
  const [currentStudent] = useAtom(currentStudentAtom);
  const navigate = useNavigate();

  // Draggable state
  const [position, setPosition] = useState({ x: window.innerWidth - 68, y: window.innerHeight - 160 });
  const isDragging = useRef(false);
  const hasMoved = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const btnSize = 56;

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    isDragging.current = true;
    hasMoved.current = false;
    dragStart.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
  }, [position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const touch = e.touches[0];
    const newX = clamp(touch.clientX - dragStart.current.x, 0, window.innerWidth - btnSize);
    const newY = clamp(touch.clientY - dragStart.current.y, 0, window.innerHeight - btnSize);
    hasMoved.current = true;
    setPosition({ x: newX, y: newY });
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    // Snap to nearest edge (left or right)
    setPosition((prev) => {
      const centerX = prev.x + btnSize / 2;
      const snapX = centerX < window.innerWidth / 2 ? 8 : window.innerWidth - btnSize - 8;
      return { ...prev, x: snapX };
    });
  }, []);

  const handleClick = () => {
    if (!hasMoved.current) {
      setVisible(true);
    }
  };

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
      {/* Draggable Floating Action Button */}
      <div
        style={{
          position: "fixed",
          zIndex: 50,
          left: position.x,
          top: position.y,
          padding: 14,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #f97316, #ef4444)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
          lineHeight: 0,
          touchAction: "none",
          cursor: "grab",
          transition: "left 0.3s ease",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white" style={{ display: "block" }}>
          <circle cx="4" cy="4" r="2.5" />
          <circle cx="12" cy="4" r="2.5" />
          <circle cx="20" cy="4" r="2.5" />
          <circle cx="4" cy="12" r="2.5" />
          <circle cx="12" cy="12" r="2.5" />
          <circle cx="20" cy="12" r="2.5" />
          <circle cx="4" cy="20" r="2.5" />
          <circle cx="12" cy="20" r="2.5" />
          <circle cx="20" cy="20" r="2.5" />
        </svg>
      </div>

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
                  <Box className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Icon icon={item.icon} className="text-orange-600" size={22} />
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

