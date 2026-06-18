export const dynamic = "force-dynamic";
import Replicate from "replicate";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { incrementApiLimit, checkApiLimit } from "@/lib/api-limit";
import { MODEL_GENERATIONS_PRICE } from "@/constants";

// Client initialized lazily inside handler

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const body = await req.json();
    const { prompt, duration } = body;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!prompt) {
      return new NextResponse("Prompt is required", { status: 400 });
    }

    const apiGenerations = await checkApiLimit(
      MODEL_GENERATIONS_PRICE.musicGeneration
    );
    if (!apiGenerations) {
      return new NextResponse(
        "Your generation limit has been reached. Please purchase additional generations.",
        { status: 403 }
      );
    }

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });
    const response = await replicate.run(
      "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
      {
        input: {
          prompt,
          duration: parseInt(duration),
        },
      }
    );

    await incrementApiLimit(MODEL_GENERATIONS_PRICE.musicGeneration);

    return NextResponse.json(response);
  } catch (error) {
    console.log("[MUSIC_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
