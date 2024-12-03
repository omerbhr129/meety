import { io, Socket } from 'socket.io-client';
import { useToast } from "@/components/ui/use-toast";

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private userId: string | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect(userId: string) {
    if (this.socket?.connected && this.userId === userId) {
      return;
    }

    this.userId = userId;
    this.socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002', {
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
      this.socket?.emit('join-user-room', userId);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });

    this.setupNotificationHandlers();
  }

  private setupNotificationHandlers() {
    if (!this.socket) return;

    this.socket.on('notification', (data: {
      type: string;
      data: any;
    }) => {
      const { toast } = useToast();

      switch (data.type) {
        case 'new-booking':
          toast({
            title: "פגישה חדשה!",
            description: `נקבעה פגישה חדשה: ${data.data.meetingTitle} עם ${data.data.attendee.name}`,
          });
          break;

        case 'booking-cancelled':
          toast({
            title: "פגישה בוטלה",
            description: `הפגישה ${data.data.meetingTitle} בוטלה על ידי ${data.data.attendee.name}`,
            variant: "destructive"
          });
          break;

        case 'booking-reminder':
          toast({
            title: "תזכורת לפגישה",
            description: `יש לך פגישה ${data.data.meetingTitle} בעוד שעה`,
          });
          break;
      }

      // Trigger any additional callbacks that might be registered
      this.notifyListeners(data.type, data.data);
    });
  }

  private listeners: { [key: string]: ((data: any) => void)[] } = {};

  public addListener(event: string, callback: (data: any) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  public removeListener(event: string, callback: (data: any) => void) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  private notifyListeners(event: string, data: any) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(data));
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
    }
  }
}

export const socketService = SocketService.getInstance();

// Hook for using socket in components
export const useSocket = (userId: string) => {
  const connect = () => {
    socketService.connect(userId);
  };

  const disconnect = () => {
    socketService.disconnect();
  };

  const addListener = (event: string, callback: (data: any) => void) => {
    socketService.addListener(event, callback);
    return () => socketService.removeListener(event, callback);
  };

  return {
    connect,
    disconnect,
    addListener
  };
};
