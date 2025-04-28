import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export type Notification = {
  id: number;
  user_id: number;
  message: string;
  read: boolean;
  related_entity_type: string | null;
  related_entity_id: number | null;
  created_at: string;
};

interface NotificationContextType {
  notifications: Notification[];
  isLoading: boolean;
  error: Error | null;
  markAsRead: (id: number) => Promise<void>;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const {
    data: notifications = [],
    isLoading,
    error,
  } = useQuery<Notification[], Error>({
    queryKey: ["/api/notifications", refreshTrigger],
    enabled: !!user,
  });

  // Set up polling for notifications
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 30000); // Check for new notifications every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAsRead = async (id: number) => {
    await markAsReadMutation.mutateAsync(id);
  };

  const refreshNotifications = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        isLoading,
        error: error || null,
        markAsRead,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
