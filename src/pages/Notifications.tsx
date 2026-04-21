import { useState, useEffect } from "react";
import { Bell, Calendar, DollarSign, FileText, AlertCircle, CheckCircle2, Loader2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  type: "announcement" | "payment" | "document" | "alert" | "join_request" | "join_approved" | "join_rejected";
  title: string;
  message: string;
  date: string;
  read: boolean;
}

const getIcon = (type: Notification["type"]) => {
  switch (type) {
    case "announcement":
      return <Bell className="h-5 w-5" />;
    case "payment":
      return <DollarSign className="h-5 w-5" />;
    case "document":
      return <FileText className="h-5 w-5" />;
    case "alert":
      return <AlertCircle className="h-5 w-5" />;
    case "join_request":
      return <Users className="h-5 w-5" />;
    case "join_approved":
      return <CheckCircle2 className="h-5 w-5" />;
    case "join_rejected":
      return <AlertCircle className="h-5 w-5" />;
  }
};

const getBadgeColor = (type: Notification["type"]) => {
  switch (type) {
    case "announcement":
      return "bg-blue-500";
    case "payment":
      return "bg-green-500";
    case "document":
      return "bg-purple-500";
    case "alert":
      return "bg-orange-500";
    case "join_request":
      return "bg-amber-500";
    case "join_approved":
      return "bg-green-500";
    case "join_rejected":
      return "bg-red-500";
  }
};

const Notifications = () => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!profile?.currentOrganization?.id || !profile.walletAddress) {
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from("notifications" as any)
          .select("*")
          .eq("organization_id", profile.currentOrganization.id)
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        
        const formatted: Notification[] = (data || []).map((n: any) => ({
          id: n.id,
          type: n.type as Notification["type"],
          title: n.title,
          message: n.message || "",
          date: new Date(n.created_at).toISOString().split("T")[0],
          read: n.read || false,
        }));
        
        setNotifications(formatted);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, [profile?.currentOrganization?.id, profile?.walletAddress]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with the latest announcements and alerts</p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="text-sm">
            {unreadCount} unread
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm text-muted-foreground">You're all caught up!</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all hover:shadow-md ${
                !notification.read ? "border-l-4 border-l-primary" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      notification.type === "announcement"
                        ? "bg-blue-100 text-blue-600"
                        : notification.type === "payment"
                        ? "bg-green-100 text-green-600"
                        : notification.type === "document"
                        ? "bg-purple-100 text-purple-600"
                        : notification.type === "join_request"
                        ? "bg-amber-100 text-amber-600"
                        : notification.type === "join_approved"
                        ? "bg-green-100 text-green-600"
                        : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{notification.title}</p>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {notification.date}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <div className="flex items-center gap-2 pt-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white ${getBadgeColor(
                          notification.type
                        )}`}
                      >
                        {notification.type}
                      </span>
                      {!notification.read && (
                        <span className="flex items-center gap-1 text-xs text-primary">
                          <CheckCircle2 className="h-3 w-3" />
                          New
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;