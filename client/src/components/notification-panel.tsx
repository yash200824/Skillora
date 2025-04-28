import { useNotifications, Notification } from "@/context/notification-context";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Bell, Check, CheckCircle, Users, FileText, FileCheck } from "lucide-react";
import { useEffect } from "react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { notifications, isLoading, markAsRead, refreshNotifications } = useNotifications();

  // Refresh notifications when panel opens
  useEffect(() => {
    if (isOpen) {
      refreshNotifications();
    }
  }, [isOpen, refreshNotifications]);

  const handleMarkAsRead = async (id: number) => {
    await markAsRead(id);
  };

  // Get the icon for the notification based on its type
  const getNotificationIcon = (type: string | null) => {
    switch (type) {
      case "application":
        return <Users className="h-5 w-5 text-primary-600" />;
      case "contract":
        return <FileCheck className="h-5 w-5 text-success-600" />;
      case "review":
        return <CheckCircle className="h-5 w-5 text-warning-600" />;
      default:
        return <Bell className="h-5 w-5 text-primary-600" />;
    }
  };

  // Get the route for the notification based on its type and id
  const getNotificationRoute = (notification: Notification) => {
    const { related_entity_type, related_entity_id } = notification;
    
    switch (related_entity_type) {
      case "application":
        return "/applications";
      case "contract":
        return "/contracts";
      case "review":
        return "/profile";
      default:
        return "/";
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto text-neutral-300" />
              <p className="mt-4 text-neutral-500">No notifications yet</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-120px)]">
              <div className="flow-root">
                <ul className="-my-5 divide-y divide-neutral-200">
                  {notifications.map((notification) => (
                    <li key={notification.id} className="py-5">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          {getNotificationIcon(notification.related_entity_type)}
                        </div>
                        
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${notification.read ? 'text-neutral-600' : 'text-neutral-900'}`}>
                              {notification.message}
                            </p>
                            <span className="ml-2 text-xs text-neutral-500">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          
                          <div className="mt-2 flex items-center">
                            <Link href={getNotificationRoute(notification)}>
                              <Button 
                                variant="link" 
                                className="p-0 h-auto text-sm text-primary-600 hover:text-primary-500"
                                onClick={onClose}
                              >
                                View Details
                              </Button>
                            </Link>
                            
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-3 text-xs"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Mark as read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
