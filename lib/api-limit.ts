import { auth } from "@clerk/nextjs/server";

import prismadb from "@/lib/prismadb";
import { Transaction } from "@prisma/client";

export const incrementApiLimit = async (value: number) => {
  const { userId } = auth();

  if (!userId) {
    return;
  }

  const userApiLimit = await prismadb.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      clerkId: true,
      email: true,
      photo: true,
      firstName: true,
      lastName: true,
      usedGenerations: true,
      availableGenerations: true,
    },
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
    select: {
      id: true,
      clerkId: true,
      usedGenerations: true,
      availableGenerations: true,
    },
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
  const { userId } = auth();

  if (!userId) {
    return 0;
  }

  const userApiLimit = await prismadb.user.findUnique({
    where: {
      clerkId: userId,
    },
    select: {
      availableGenerations: true,
    },
  });

  if (!userApiLimit) {
    return 0;
  }

  return userApiLimit.availableGenerations;
};

export const getApiUsedGenerations = async () => {
  const { userId } = auth();
  if (!userId) {
    return 0;
  }

  const userApiLimit = await prismadb.user.findUnique({
    where: {
      clerkId: userId,
    },
    select: {
      usedGenerations: true,
    },
  });

  if (!userApiLimit) {
    return 0;
  }

  return userApiLimit.usedGenerations;
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
