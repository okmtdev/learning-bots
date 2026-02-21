"use client";

import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Dialog } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { localePath } from "@/lib/navigation";

interface UserSettings {
  language: string;
  notificationsEnabled: boolean;
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const currentLocale = useLocale();
  const [settings, setSettings] = useState<UserSettings>({
    language: currentLocale,
    notificationsEnabled: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.get<UserSettings>("/settings");
        setSettings(data);
      } catch {
        // default settings
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put("/settings", settings);
      showToast(t("saved"), "success");

      // If language changed, navigate to new locale
      if (settings.language !== currentLocale) {
        router.push(localePath("/settings", settings.language));
      }
    } catch {
      showToast(tc("saveFailed"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete("/settings/account");
      showToast(t("deleteAccount"), "success");
      logout();
      router.push(localePath("/", currentLocale));
    } catch {
      showToast(tc("deleteFailed"), "error");
    } finally {
      setShowDeleteAccount(false);
    }
  };

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">{t("title")}</h2>

        {/* User Info */}
        <Card title={t("account")}>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              {user?.avatarUrl && (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <p className="font-medium text-gray-900">{user?.displayName}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Language */}
        <Card title={t("displaySettings")}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("language")}
              </label>
              <select
                value={settings.language}
                onChange={(e) =>
                  setSettings({ ...settings, language: e.target.value })
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-full"
              >
                <option value="ja">日本語</option>
                <option value="en">English</option>
              </select>
            </div>
            <Toggle
              label={t("notifications")}
              checked={settings.notificationsEnabled}
              onChange={(e) =>
                setSettings({ ...settings, notificationsEnabled: e.target.checked })
              }
            />
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} loading={isSaving}>
              {tc("save")}
            </Button>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card title={t("dangerZone")}>
          <p className="text-sm text-gray-600 mb-4">
            {t("dangerZoneDescription")}
          </p>
          <Button
            variant="danger"
            onClick={() => setShowDeleteAccount(true)}
          >
            {t("deleteAccount")}
          </Button>
        </Card>
      </main>

      <Dialog
        open={showDeleteAccount}
        title={t("deleteAccountTitle")}
        confirmLabel={t("deleteAccountAction")}
        cancelLabel={tc("cancel")}
        variant="danger"
        onConfirm={handleDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
      >
        {t("deleteAccountConfirm")}
      </Dialog>
    </>
  );
}
