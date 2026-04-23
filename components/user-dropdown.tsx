"use client";

import { UserButton } from "@clerk/nextjs";

export const UserDropdown = () => {
  return (
    <UserButton
      appearance={{
        elements: {
          avatarBox: "w-9 h-9",
          userButtonTrigger: "focus:shadow-none focus:outline-none",
          userButtonPopoverCard: "!z-[99999]",
          userButtonPopoverRootBox: "!z-[99999]",
        },
      }}
    />
  );
};
