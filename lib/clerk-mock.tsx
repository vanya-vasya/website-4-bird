"use client";

import React from "react";

const MOCK_USER = {
  id: "mock_user_id",
  firstName: "Dev",
  lastName: "User",
  fullName: "Dev User",
  username: "devuser",
  emailAddresses: [{ emailAddress: "dev@localhost.com" }],
  imageUrl: "",
  publicMetadata: {},
};

export const ClerkProvider = ({ children }: { children: React.ReactNode }) =>
  <>{children}</>;

export const SignedIn = ({ children }: { children: React.ReactNode }) =>
  <>{children}</>;

export const SignedOut = (_: { children: React.ReactNode }) => null;

export const SignIn = () => <div>SignIn (Clerk disabled)</div>;
export const SignUp = () => <div>SignUp (Clerk disabled)</div>;

export const UserButton = () => (
  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold">
    D
  </div>
);

export const useAuth = () => ({
  isLoaded: true,
  isSignedIn: true,
  userId: MOCK_USER.id,
  sessionId: "mock_session_id",
  getToken: async () => "mock_token",
  signOut: async () => {},
});

export const useUser = () => ({
  isLoaded: true,
  isSignedIn: true,
  user: MOCK_USER,
});

export const useClerk = () => ({
  signOut: async () => {},
  openSignIn: () => {},
  openSignUp: () => {},
});
