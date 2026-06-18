export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { OpenAI } from "openai";

// import { checkSubscription } from "@/lib/subscription";
import { incrementApiLimit, checkApiLimit } from "@/lib/api-limit";
import { MODEL_GENERATIONS_PRICE } from "@/constants";

// Client initialized lazily inside handler

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const body = await req.json();
    const {
      prompt,
      amount = 1,
      resolution = "1024x1024",
      model = "dall-e-3",
    } = body;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!process.env.OPEN_API_KEY) {
      return new NextResponse("OpenAI API Key not configured.", { status: 500 });
    }

    if (!prompt) {
      return new NextResponse("Prompt is required", { status: 400 });
    }

    if (!amount) {
      return new NextResponse("Amount is required", { status: 400 });
    }

    if (!resolution) {
      return new NextResponse("Resolution is required", { status: 400 });
    }

    const apiGenerations = await checkApiLimit(
      MODEL_GENERATIONS_PRICE.imageGeneration
    );

    if (!apiGenerations) {
      return new NextResponse(
        "Your generation limit has been reached. Please purchase additional generations.",
        { status: 403 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPEN_API_KEY });
    const response = await openai.images.generate({
      prompt,
      n: parseInt(amount, 10),
      size: resolution,
      model: model, // Add the model parameter here
    });

    await incrementApiLimit(MODEL_GENERATIONS_PRICE.imageGeneration);

    return NextResponse.json(response.data);
  } catch (error) {
    console.log("[CONVERSATION_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
