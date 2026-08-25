"use client";

import * as z from "zod";
import axios from "axios";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Loader } from "@/components/loader";
import { Empty } from "@/components/ui/empty";
import { useProModal } from "@/hooks/use-pro-modal";
import { FeatureContainer } from "@/components/feature-container";
import { inputStyles, buttonStyles, contentStyles, loadingStyles, cardStyles } from "@/components/ui/feature-styles";
import { cn } from "@/lib/utils";

import { formSchema } from "./constants";
import { MODEL_GENERATIONS_PRICE } from "@/constants";

// Конфигурация для разных типов инструментов
const toolConfigs = {
  'speech-generation': {
    title: 'Speech Generation',
    description: `Turn your prompt into speech. Generation can take from 1 to 5 minutes\nPrice: ${MODEL_GENERATIONS_PRICE.speecGeneration} points`,
    iconName: 'Mic',
    iconColor: 'text-fuchsia-600',
    bgColor: 'bg-fuchsia-600/10',
    placeholder: 'Text to be read aloud...'
  },


};

const SpeechPage = () => {
  const proModal = useProModal();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toolId = searchParams.get('toolId') || 'speech-generation';
  const [speechList, setSpeechList] = useState<string[]>([]);

  // Получаем конфигурацию для текущего инструмента
  const currentTool = toolConfigs[toolId as keyof typeof toolConfigs] || toolConfigs['speech-generation'];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    }
  });

  // Обновляем placeholder при изменении toolId
  useEffect(() => {
    form.reset({ prompt: "" });
  }, [toolId, form]);

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await axios.post('/api/speech', values);
      setSpeechList((prev) => [...prev, response.data]);
      form.reset();
    } catch (error: any) {
      if (error?.response?.status === 403) {
        proModal.onOpen();
      } else {
        toast.error("Something went wrong.");
      }
    } finally {
      router.refresh();
    }
  }

    return (
    <div className="bg-white">
      <FeatureContainer
      title={currentTool.title}
      description={currentTool.description}
      iconName={currentTool.iconName as keyof typeof import("lucide-react")}

    >
      <div className={contentStyles.base}>
        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            className={cn(
              inputStyles.container,
              "grid grid-cols-12 gap-2"
            )}
          >
            <FormField
              name="prompt"
              render={({ field }) => (
                <FormItem className="col-span-12 lg:col-span-10">
                  <FormControl className="m-0 p-0">
                    <Input
                      className={inputStyles.base}
                      disabled={isLoading} 
                      placeholder={currentTool.placeholder}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              className={cn(
                buttonStyles.base,
                "col-span-12 lg:col-span-2 w-full"
              )}
              type="submit"
              disabled={isLoading}
              size="icon"
            >
              Generate
            </Button>
          </form>
        </Form>
        <div className={contentStyles.section}>
          {isLoading && (
            <div className={loadingStyles.container}>
              <Loader />
            </div>
          )}
          {speechList.length === 0 && !isLoading && (
            <Empty label="No speech generated yet" />
          )}
          <div className="space-y-4">
            {speechList.map((speech, index) => (
              <div
                key={index}
                className={cn(cardStyles.base, "p-4")}
              >
                <p className="mb-2 font-semibold">Audio {index + 1}</p>
                <audio controls className="w-full">
                  <source src={speech} />
                  Your browser does not support the audio element.
                </audio>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FeatureContainer>
    </div>
  );
}
 
export default SpeechPage;
