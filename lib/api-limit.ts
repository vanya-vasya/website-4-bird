import { auth, currentUser } from "@clerk/nextjs/server";

import prismadb from "@/lib/prismadb";
import { Transaction } from "@prisma/client";
import { createOrGetUser } from "@/lib/actions/user.actions";

export const incrementApiLimit = async (value: number) => {
  const { userId } = auth();

  if (!userId) {
    return;
  }

  const userApiLimit = await prismadb.user.findUnique({
    where: { clerkId: userId },
  });

  if (userApiLimit) {
    await prismadb.user.update({
      where: { clerkId: userId },
      data: { usedGenerations: userApiLimit.usedGenerations + value },
    });
  }
};

export const checkApiLimit = async (generationPrice: number) => {
  const { userId } = auth();

  if (!userId) {
    return false;
  }

  const userApiLimit = await prismadb.user.findUnique({
    where: { clerkId: userId },
  });
  if (
    userApiLimit &&
    userApiLimit.usedGenerations < userApiLimit.availableGenerations &&
    userApiLimit.availableGenerations - userApiLimit.usedGenerations >=
      generationPrice
  ) {
    return true;
  } else {
    return false;
  }
};

export const getApiAvailableGenerations = async () => {
  try {
    const { userId } = auth();

    if (!userId) {
      return 0;
    }

    let userApiLimit = await prismadb.user.findUnique({
      where: {
        clerkId: userId,
      },
    });

    // FALLBACK: If user not in DB, create them (happens with OAuth sign-in)
    if (!userApiLimit) {
      console.log('[API_LIMIT] User not found in DB, creating via fallback...');
      const clerkUser = await currentUser();
      
      if (clerkUser) {
        userApiLimit = await createOrGetUser({
          clerkId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          photo: clerkUser.imageUrl || '',
        });
        console.log('[API_LIMIT] User created via fallback:', userApiLimit?.id);
      }
    }

    if (!userApiLimit) {
      return 0;
    }

    return userApiLimit.availableGenerations;
  } catch (error) {
    console.error("[GET_API_AVAILABLE_GENERATIONS] Error:", error);
    return 0;
  }
};

export const getApiUsedGenerations = async () => {
  try {
    const { userId } = auth();
    if (!userId) {
      return 0;
    }

    let userApiLimit = await prismadb.user.findUnique({
      where: {
        clerkId: userId,
      },
    });

    // FALLBACK: If user not in DB, create them (happens with OAuth sign-in)
    if (!userApiLimit) {
      console.log('[API_LIMIT] User not found in DB, creating via fallback...');
      const clerkUser = await currentUser();
      
      if (clerkUser) {
        userApiLimit = await createOrGetUser({
          clerkId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          photo: clerkUser.imageUrl || '',
        });
        console.log('[API_LIMIT] User created via fallback:', userApiLimit?.id);
      }
    }

    if (!userApiLimit) {
      return 0;
    }

    return userApiLimit.usedGenerations;
  } catch (error) {
    console.error("[GET_API_USED_GENERATIONS] Error:", error);
    return 0;
  }
};

export async function fetchPaymentHistory(): Promise<Transaction[] | null> {
  try {
    const { userId } = auth();

    if (!userId) {
      return null;
    }
    const transactions = await prismadb.transaction.findMany({
      where: {
        userId: userId,
      },
    });
    return transactions;
  } catch (error) {
    // console.error("[FETCH_PAYMENT_HISTORY_ERROR]", error);
    // throw new Error("Failed to fetch payment history");
    return null;
  }
}
