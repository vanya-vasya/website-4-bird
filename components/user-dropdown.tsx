"use client";

import { UserButton } from "@clerk/nextjs";

export const UserDropdown = () => {
  return (
    <UserButton
      appearance={{
        elements: {
          avatarBox: "w-9 h-9",
          userButtonTrigger: "focus:shadow-none focus:outline-none",
          userButtonPopoverCard: {
            zIndex: 99999,
            overflow: "visible",
          },
          userButtonPopoverMain: {
            display: "flex",
            flexDirection: "column",
          },
          userPreview: {
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "12px",
            padding: "16px",
          },
          userPreviewTextContainer: {
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "4px",
          },
          userPreviewMainIdentifier: {
            position: "static",
            display: "block",
          },
          userPreviewSecondaryIdentifier: {
            position: "static",
            display: "block",
          },
          userButtonPopoverActions: {
            display: "flex",
            flexDirection: "column",
            position: "static",
          },
          userButtonPopoverActionButton: {
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            position: "static",
          },
        },
      }}
    />
  );
};
