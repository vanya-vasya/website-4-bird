export const dynamic = "force-dynamic";
import { Settings } from "lucide-react";

import { Heading } from "@/components/heading";

const SettingsPage = async () => {
  return (
    <div className="bg-white">
      <Heading
        title="Settings"
        description="Manage account settings."
        icon={Settings}
      />
      <div className="px-4 lg:px-8 space-y-4">
        <p className="text-muted-foreground text-sm">
          Account settings are managed here. eSIM orders and receipts are listed
          under Billing &amp; Payments.
        </p>
      </div>
    </div>
  );
}

export default SettingsPage;