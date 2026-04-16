import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Settings, Globe, Palette, Bell, Shield, Moon, Sun, Monitor
} from "lucide-react";

const SettingsPage = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    currency: "USD",
    language: "en",
    theme: "light",
    emailNotifications: true,
    pushNotifications: true,
  });

  const handleSave = () => {
    toast({ title: "Settings Saved", description: "Your preferences have been updated" });
  };

  if (!profile?.currentOrganization) {
    return <div className="p-6">No organization found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your organization preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Currency & Language */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" /> Regional Settings
            </CardTitle>
            <CardDescription>Configure currency and language</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Currency</Label>
              <Select value={settings.currency} onValueChange={(v) => setSettings({...settings, currency: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Language</Label>
              <Select value={settings.language} onValueChange={(v) => setSettings({...settings, language: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" /> Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Button 
                  variant={settings.theme === "light" ? "default" : "outline"}
                  className="gap-2"
                  onClick={() => setSettings({...settings, theme: "light"})}
                >
                  <Sun className="h-4 w-4" /> Light
                </Button>
                <Button 
                  variant={settings.theme === "dark" ? "default" : "outline"}
                  className="gap-2"
                  onClick={() => setSettings({...settings, theme: "dark"})}
                >
                  <Moon className="h-4 w-4" /> Dark
                </Button>
                <Button 
                  variant={settings.theme === "system" ? "default" : "outline"}
                  className="gap-2"
                  onClick={() => setSettings({...settings, theme: "system"})}
                >
                  <Monitor className="h-4 w-4" /> System
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Notifications
            </CardTitle>
            <CardDescription>Manage notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
              <Button 
                variant={settings.emailNotifications ? "default" : "outline"}
                size="sm"
                onClick={() => setSettings({...settings, emailNotifications: !settings.emailNotifications})}
              >
                {settings.emailNotifications ? "Enabled" : "Disabled"}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Receive updates on your device</p>
              </div>
              <Button 
                variant={settings.pushNotifications ? "default" : "outline"}
                size="sm"
                onClick={() => setSettings({...settings, pushNotifications: !settings.pushNotifications})}
              >
                {settings.pushNotifications ? "Enabled" : "Disabled"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" /> Security
            </CardTitle>
            <CardDescription>Security and privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Button variant="outline" size="sm">Setup</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Connected Wallet</p>
                <p className="text-sm text-muted-foreground">{profile.walletAddress}</p>
              </div>
              <Button variant="outline" size="sm">Disconnect</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
};

export default SettingsPage;