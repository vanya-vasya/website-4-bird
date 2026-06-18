export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";

import { incrementApiLimit, checkApiLimit } from "@/lib/api-limit";
import { MODEL_GENERATIONS_PRICE } from "@/constants";

const instructionMessage = {
  role: "system",
  content:
    "You are a code generator. You must answer only in markdown code snippets. Use code comments for explanations.",
};

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const body = await req.json();
    const { messages } = body;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!process.env.OPEN_API_KEY) {
      return new NextResponse("OpenAI API Key not configured.", { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPEN_API_KEY });

    if (!messages) {
      return new NextResponse("Messages are required", { status: 400 });
    }

    const apiGenerations = await checkApiLimit(
      MODEL_GENERATIONS_PRICE.codeGeneration
    );

    if (!apiGenerations) {
      return new NextResponse(
        "Your generation limit has been reached. Please purchase additional generations.",
        { status: 403 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [instructionMessage, ...messages],
    });

    await incrementApiLimit(MODEL_GENERATIONS_PRICE.codeGeneration);

    return NextResponse.json(response.choices[0].message);
  } catch (error) {
    console.log("[CONVERSATION_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
