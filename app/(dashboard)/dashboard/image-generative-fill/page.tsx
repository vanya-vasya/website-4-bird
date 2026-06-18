export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserById } from "@/lib/actions/user.actions";
import TransformationForm from "@/components/shared/TransformationForm";
import { getUserAvailableGenerations } from "@/lib/utils";
import { FeatureContainer } from "@/components/feature-container";
import { contentStyles } from "@/components/ui/feature-styles";
import { MODEL_GENERATIONS_PRICE } from "@/constants";

const ImageGenerativeFillPage = async () => {
  const {userId} = auth();
  
  if(!userId) redirect('/sign-in');
  
  const user = await getUserById(userId);  

  if(!user) redirect('/sign-in');
  
  const balance = getUserAvailableGenerations(user);

    return (
    <div className="bg-white">
      <FeatureContainer
      title="Generative Fill"
      description={`Automatically adjust and fill your images to fit any aspect ratio\nPrice: ${MODEL_GENERATIONS_PRICE.imageGenerativeFill} credits`}
      iconName={"PaintBucket"}
    >
      <div className={contentStyles.base}>
        <TransformationForm 
          userId={user.id}
          type={"fill" as TransformationTypeKey}
          creditBalance={balance}
          generationPrice={MODEL_GENERATIONS_PRICE.imageGenerativeFill}
        />
      </div>
    </FeatureContainer>
    </div>
   );
}
 
export default ImageGenerativeFillPage;