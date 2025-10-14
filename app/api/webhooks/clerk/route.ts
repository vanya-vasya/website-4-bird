/* eslint-disable camelcase */

import { clerkClient, WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

import { createUser, deleteUser, updateUser } from "@/lib/actions/user.actions";

export async function POST(req: Request) {
  console.log('[WEBHOOK] Clerk webhook received');
  
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('[WEBHOOK] WEBHOOK_SECRET not set!');
    throw new Error(
      "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local"
    );
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('[WEBHOOK] Missing svix headers');
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET!);
  
  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
    console.log('[WEBHOOK] Signature verified successfully');
  } catch (err) {
    console.error("[WEBHOOK] Signature verification failed:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  // Get the ID and type
  const { id } = evt.data;
  const eventType = evt.type;
  console.log(`[WEBHOOK] Event type: ${eventType}, User ID: ${id}`);
  

  // CREATE
  if (eventType === "user.created") {
    console.log('[WEBHOOK] Processing user.created event');
    const { id, email_addresses, image_url, first_name, last_name } = evt.data;

    const user = {
      clerkId: id,
      email: email_addresses[0].email_address,
      firstName: first_name,
      lastName: last_name,
      photo: image_url,
      availableGenerations: 10, // Initialize new users with 10 tokens
    };

    console.log('[WEBHOOK] Creating user:', { clerkId: id, email: user.email });

    try {
      const newUser = await createUser(user);

      // Set public metadata
      if (newUser) {
        await clerkClient.users.updateUserMetadata(id, {
          publicMetadata: {
            userId: newUser.id,
          },
        });
        console.log('[WEBHOOK] User created successfully:', newUser.id);
      } else {
        console.error('[WEBHOOK] createUser returned undefined');
      }

      return NextResponse.json({ message: "OK", user: newUser });
    } catch (error) {
      console.error('[WEBHOOK] Error creating user:', error);
      // Return 500 to trigger Clerk retry
      return NextResponse.json({ message: "Error creating user", error: String(error) }, { status: 500 });
    }
  }

  // UPDATE
  if (eventType === "user.updated") {
    console.log('[WEBHOOK] Processing user.updated event');
    const { id, image_url, first_name, last_name } = evt.data;

    const user = {
      firstName: first_name,
      lastName: last_name,
      photo: image_url,
    };

    const updatedUser = await updateUser(id, user);
    console.log('[WEBHOOK] User updated:', id);

    return NextResponse.json({ message: "OK", user: updatedUser });
  }

  // DELETE
  if (eventType === "user.deleted") {
    console.log('[WEBHOOK] Processing user.deleted event');
    const { id } = evt.data;

    const deletedUser = await deleteUser(id!);
    console.log('[WEBHOOK] User deleted:', id);

    return NextResponse.json({ message: "OK", user: deletedUser });
  }

  console.log(`[WEBHOOK] Unhandled event type: ${eventType} for user ${id}`);

  return new Response("", { status: 200 });
}

export async function GET(req: Request) {
  // const user = { clerkId: "111", email:"text2@cfas.com", photo:"https://fsdfdsafasd.com2", firstName:"maris2", lastName:'rabisko2', username: 'test2'}
  // const newUser = await createUser(user);
  return NextResponse.json({ message: "OK" });
}