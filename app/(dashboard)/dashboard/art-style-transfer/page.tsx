export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserById } from "@/lib/actions/user.actions";
import TransformationForm from "@/components/shared/TransformationForm";
import { FeatureContainer } from "@/components/feature-container";
import { contentStyles } from "@/components/ui/feature-styles";
import { MODEL_GENERATIONS_PRICE } from "@/constants";
import { getUserAvailableGenerations } from "@/lib/utils";

// Кастомные плейсхолдеры для полей ввода
const customPlaceholders = {
  prompt:
    "Portrait painting in the style of Van Gogh with vibrant colors and swirling brushstrokes",
  color: "Van Gogh style", // Используем это поле для дополнительных указаний стиля
};

const ArtStyleTransferPage = async () => {
  const { userId } = auth();

  if (!userId) redirect("/sign-in");

  const user = await getUserById(userId);

  if (!user) redirect("/sign-in");

  const balance = getUserAvailableGenerations(user);

  return (
    <div className="bg-white">
      <FeatureContainer
      title="Art Style Transfer"
      description={`Transform your artworks with different artistic styles and techniques using GPT Image\nPrice: ${MODEL_GENERATIONS_PRICE.imageObjectRecolor} credits`}
      iconName={"Wand2"}

    >
      <div className={contentStyles.base}>
        <TransformationForm
          userId={user.id}
          type={"recolor" as TransformationTypeKey}
          creditBalance={balance}
          generationPrice={MODEL_GENERATIONS_PRICE.imageObjectRecolor}
          data={customPlaceholders}
          useStyleTransfer={true} // Флаг для использования нового API вместо Cloudinary
        />
      </div>
    </FeatureContainer>
    </div>
  );
};

export default ArtStyleTransferPage;
