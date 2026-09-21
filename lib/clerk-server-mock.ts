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

export const auth = () => ({
  userId: MOCK_USER.id,
  sessionId: "mock_session_id",
  protect: () => {},
  getToken: async () => "mock_token",
});

export const currentUser = async () => MOCK_USER;

export const clerkMiddleware = (handler?: unknown) => handler;

export const createRouteMatcher = (_patterns: string[]) => (_req: unknown) => false;

export const clerkClient = {
  users: {
    updateUserMetadata: async () => MOCK_USER,
    getUser: async () => MOCK_USER,
  },
};

export type WebhookEvent = {
  type: string;
  data: Record<string, any>;
};
