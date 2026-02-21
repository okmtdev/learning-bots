"use client";

import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Dialog } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast";
import { apiClient } from "@/lib/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface UserSettings {
  language: string;
  notificationsEnabled: boolean;
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings>({
    language: "ja",
    notificationsEnabled: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await apiClient.get<UserSettings>("/settings");
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
      await apiClient.put("/settings", settings);
      showToast("設定を保存しました", "success");
    } catch {
      showToast("保存に失敗しました", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await apiClient.delete("/settings/account");
      showToast("アカウントを削除しました", "success");
      logout();
      router.push("/ja");
    } catch {
      showToast("削除に失敗しました", "error");
    } finally {
      setShowDeleteAccount(false);
    }
  };

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">設定</h2>

        {/* User Info */}
        <Card title="アカウント情報">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              {user?.picture && (
                <img
                  src={user.picture}
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
        <Card title="表示設定">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                言語
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
              label="通知を受け取る"
              checked={settings.notificationsEnabled}
              onChange={(checked) =>
                setSettings({ ...settings, notificationsEnabled: checked })
              }
            />
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} loading={isSaving}>
              保存
            </Button>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card title="危険な操作">
          <p className="text-sm text-gray-600 mb-4">
            アカウントを削除すると、すべてのデータ（ボット、録画、設定）が完全に削除されます。
            この操作は取り消せません。
          </p>
          <Button
            variant="danger"
            onClick={() => setShowDeleteAccount(true)}
          >
            アカウントを削除
          </Button>
        </Card>
      </main>

      <Dialog
        isOpen={showDeleteAccount}
        title="アカウントを削除"
        message="本当にアカウントを削除しますか？すべてのデータが完全に消去されます。"
        confirmLabel="完全に削除する"
        variant="danger"
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteAccount(false)}
      />
    </>
  );
}
