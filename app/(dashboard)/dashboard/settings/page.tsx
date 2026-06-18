export const dynamic = "force-dynamic";
import { Settings } from "lucide-react";

import { Heading } from "@/components/heading";
import { getApiAvailableGenerations, getApiUsedGenerations } from "@/lib/api-limit";
import { BuyGenerationsButton } from "@/components/buy-generations";

const SettingsPage = async () => {
  
  const apiUsedGenerations = await getApiUsedGenerations();
  const apiAvailableGenerations = await getApiAvailableGenerations();

  return ( 
    <div className="bg-white">
      <Heading
        title="Settings"
        description="Manage account settings."
        icon={Settings}

      />
      <div className="px-4 lg:px-8 space-y-4">
        <div className="text-muted-foreground text-sm">
          You have {apiAvailableGenerations-apiUsedGenerations} available tokens.
        </div>
        <BuyGenerationsButton/>
      </div>
    </div>
   );
}
 
export default SettingsPage;
