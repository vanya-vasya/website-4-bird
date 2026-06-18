export const dynamic = "force-dynamic";
import Replicate from "replicate";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { incrementApiLimit, checkApiLimit } from "@/lib/api-limit";
import { MODEL_GENERATIONS_PRICE } from "@/constants";

// Client initialized lazily inside handler to avoid build-time errors

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const body = await req.json();
    const { prompt } = body;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!prompt) {
      return new NextResponse("Prompt is required", { status: 400 });
    }

    const apiGenerations = await checkApiLimit(
      MODEL_GENERATIONS_PRICE.speecGeneration
    );

    if (!apiGenerations) {
      return new NextResponse(
        "Your generation limit has been reached. Please purchase additional generations.",
        { status: 403 }
      );
    }

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });
    const response = await replicate.run(
      "adirik/styletts2:989cb5ea6d2401314eb30685740cb9f6fd1c9001b8940659b406f952837ab5ac",
      {
        input: {
          text: prompt,
        },
      }
    );

    await incrementApiLimit(MODEL_GENERATIONS_PRICE.speecGeneration);

    return NextResponse.json(response);
  } catch (error) {
    console.log("[SPEECH_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
