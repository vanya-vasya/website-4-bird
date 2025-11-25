"use server";

import { revalidatePath } from "next/cache";
// NOTE: Keep imports minimal; we do not auto-create users here to avoid backend logic changes.
import prismadb from "@/lib/prismadb";

// CREATE OR GET - Upsert user (create if not exists, return if exists)
export async function createOrGetUser(clerkUser: {
  clerkId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  photo: string;
}) {
  try {
    console.log('[CREATE_OR_GET_USER] Starting for clerkId:', clerkUser.clerkId);
    
    // Try to find existing user
    const existingUser = await prismadb.user.findUnique({
      where: { clerkId: clerkUser.clerkId },
    });

    if (existingUser) {
      console.log('[CREATE_OR_GET_USER] User exists:', existingUser.id);
      return existingUser;
    }

    // User doesn't exist, create new
    console.log('[CREATE_OR_GET_USER] Creating new user');
    const newUser = await prismadb.user.create({
      data: {
        clerkId: clerkUser.clerkId,
        email: clerkUser.email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        photo: clerkUser.photo,
        availableGenerations: 10,
        usedGenerations: 0,
      },
    });

    console.log('[CREATE_OR_GET_USER] Created user:', newUser.id);
    return newUser;
    
  } catch (error) {
    console.error('[CREATE_OR_GET_USER] Error:', error);
    throw error;
  }
}

// CREATE
export async function createUser(user: any) {
  try {
    console.log('[CREATE_USER] Attempting to create user:', {
      clerkId: user.clerkId,
      email: user.email,
    });

    const newUser = await prismadb.user.create({
      data: user,
    });

    console.log('[CREATE_USER] Success! Created user:', newUser.id);
    return newUser;
    
  } catch (error: any) {
    console.error('[CREATE_USER] FAILED:', {
      code: error.code,
      message: error.message,
      clerkId: user.clerkId,
      email: user.email,
    });
    
    // If user already exists (unique constraint), try to return existing
    if (error.code === 'P2002') {
      console.log('[CREATE_USER] User already exists, fetching...');
      try {
        const existing = await prismadb.user.findUnique({
          where: { clerkId: user.clerkId },
        });
        return existing;
      } catch (findError) {
        console.error('[CREATE_USER] Could not find existing user:', findError);
      }
    }
    
    throw error; // Re-throw to trigger webhook retry
  }
}

// READ
export async function getUserById(userId: string){
  try {
    const user = await prismadb.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) throw new Error("User not found");

    return user;
  } catch (error) {
    console.error(error);
  }
}


// UPDATE
export async function updateUser(clerkId: string, user: any){
  try {
    const updatedUser = await prismadb.user.update({
      where: { clerkId },
      data: user,
    });

    if (!updatedUser) throw new Error("User update failed");

    return updatedUser;
  } catch (error) {
    console.error(error);
  }
}

// DELETE
export async function deleteUser(clerkId: string) {
  try {
    // Find user to delete
    const userToDelete = await prismadb.user.findUnique({
      where: { clerkId },
    });

    if (!userToDelete) {
      throw new Error("User not found");
    }

    // Delete user
    const deletedUser = await prismadb.user.delete({
      where: { id: userToDelete.id },
    });

    revalidatePath("/");

    return deletedUser;
  } catch (error) {
    console.error(error);
  }
}

// USE CREDITS
export async function updateCredits(userId: string, creditFee: number) {
  try {
    const updatedUserCredits = await prismadb.user.update({
      where: { id: userId },
      data: {
        usedGenerations: {
          increment: creditFee,
        },
      },
    });

    if (!updatedUserCredits) throw new Error("User credits update failed");

    return updatedUserCredits;
  } catch (error) {
    console.error(error);
  }
}