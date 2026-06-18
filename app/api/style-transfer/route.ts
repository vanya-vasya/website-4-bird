export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { OpenAI } from "openai";

import { incrementApiLimit, checkApiLimit } from "@/lib/api-limit";
import { MODEL_GENERATIONS_PRICE } from "@/constants";

// Client initialized lazily inside handler

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const body = await req.json();
    const {
      imageUrl, // URL загруженного пользователем изображения
      prompt, // Стиль, который пользователь хочет применить
      resolution = "1024x1024",
    } = body;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!process.env.OPEN_API_KEY) {
      return new NextResponse("OpenAI API Key not configured.", {
        status: 500,
      });
    }

    if (!prompt) {
      return new NextResponse("Prompt is required", { status: 400 });
    }

    if (!imageUrl) {
      return new NextResponse("Image URL is required", { status: 400 });
    }

    const apiGenerations = await checkApiLimit(
      MODEL_GENERATIONS_PRICE.imageObjectRecolor  // Используем тот же price как было раньше
    );

    if (!apiGenerations) {
      return new NextResponse(
        "Your generation limit has been reached. Please purchase additional generations.",
        { status: 403 }
      );
    }

    // Формируем улучшенный промпт
    const enhancedPrompt = `Transform the provided reference image in the style of ${prompt}. Maintain the original composition and subject matter, but apply the artistic style transformation. Make it look like ${prompt}.`;

    // Вызываем API с моделью gpt-image-1 для создания изображения по референсу
    const openai = new OpenAI({ apiKey: process.env.OPEN_API_KEY });
    // Документация: https://platform.openai.com/docs/guides/image-generation?image-generation-model=gpt-image-1
    const response = await openai.images.generate({
      prompt: enhancedPrompt,
      model: "gpt-image-1", // Новая модель для генерации по референсу
      n: 1,
      size: resolution,
      // @ts-ignore - GPT Image API еще не полностью типизирован
      reference_images: [imageUrl], // Массив URL референсных изображений
    });

    await incrementApiLimit(MODEL_GENERATIONS_PRICE.imageObjectRecolor);

    return NextResponse.json(response.data);
  } catch (error) {
    console.log("[STYLE_TRANSFER_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 