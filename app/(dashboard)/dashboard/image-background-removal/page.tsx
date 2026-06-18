export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserById } from "@/lib/actions/user.actions";
import TransformationForm from "@/components/shared/TransformationForm";
import { getUserAvailableGenerations } from "@/lib/utils";
import { FeatureContainer } from "@/components/feature-container";
import { contentStyles } from "@/components/ui/feature-styles";
import { MODEL_GENERATIONS_PRICE } from "@/constants";

const ImageObjectRemovePage = async () => {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const user = await getUserById(userId);

  if (!user) redirect("/sign-in");

  const balance = getUserAvailableGenerations(user);

  return (
    <div className="bg-white">
      <FeatureContainer
      title="Background Removal"
      description={`Quick background removal to bring your subject into focus\nPrice: ${MODEL_GENERATIONS_PRICE.imageGeneration} credits`}
      iconName="ImageMinus"
    >
      <div className={contentStyles.base}>
        <TransformationForm
          userId={"user_2wir9JIV6SLdhmLuKxuDOwcVphP"}
          type={"removeBackground" as TransformationTypeKey}
          creditBalance={balance}
          generationPrice={MODEL_GENERATIONS_PRICE.imageBackgroundRemoval}
        />
      </div>
    </FeatureContainer>
    </div>
  );
};

export default ImageObjectRemovePage;
