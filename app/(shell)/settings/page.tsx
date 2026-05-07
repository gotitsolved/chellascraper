import { getSettings } from "@/lib/api";
import { SettingsPageClient } from "@/components/settings-page-client";
import { Settings } from "lucide-react";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure API keys, pipeline options, and scoring rules.
          </p>
        </div>
      </div>

      <SettingsPageClient settings={settings} />
    </div>
  );
}
