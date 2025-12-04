// src/components/ui/SidebarTrigger.tsx
import React from "react";


import clsx from "clsx";
import { PanelLeftCloseIcon } from "lucide-react";
import { useSidebar } from "../../hook/useSidebar";
import { Button } from "./Button";

interface SidebarTriggerProps extends React.ComponentProps<typeof Button> {
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function SidebarTrigger({
  className,
  onClick,
  ...props
}: SidebarTriggerProps) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="xsm"
      className={clsx("max-w-min", className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeftCloseIcon />
    </Button>
  );
}
