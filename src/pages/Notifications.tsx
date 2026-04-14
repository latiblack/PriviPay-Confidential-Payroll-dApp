import { Bell, Calendar, DollarSign, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  type: "announcement" | "payment" | "document" | "alert";
  title: string;
  message: string;
  date: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "announcement",
    title: "Payroll Update",
    message: "The monthly payroll for April 2026 has been processed. Please check your dashboard for details.",
    date: "2026-04-14",
    read: false,
  },
  {
    id: "2",
    type: "payment",
    title: "Bonus Payment",
    message: "Your Q1 performance bonus of $2,500 has been disbursed to your account.",
    date: "2026-04-10",
    read: false,
  },
  {
    id: "3",
    type: "document",
    title: "New Document Available",
    message: "Your updated tax certificate for FY 2025-26 is now available for download.",
    date: "2026-04-08",
    read: true,
  },
  {
    id: "4",
    type: "alert",
    title: "Action Required",
    message: "Please update your bank details by April 20th to ensure seamless salary disbursement.",
    date: "2026-04-05",
    read: true,
  },
  {
    id: "5",
    type: "announcement",
    title: "Policy Update",
    message: "New leave policy changes will be effective from May 1st. Please review the updated handbook.",
    date: "2026-04-01",
    read: true,
  },
];

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
  }
};

const Notifications = () => {
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

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
        {mockNotifications.map((notification) => (
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
        ))}
      </div>

      {mockNotifications.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No notifications</p>
            <p className="text-sm text-muted-foreground">You're all caught up!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Notifications;