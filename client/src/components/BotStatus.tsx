import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface BotStatusProps {
  isLoading: boolean;
  status?: {
    status: string;
    version: string;
    uptime: number;
  };
  compact?: boolean;
}

export default function BotStatus({ isLoading, status, compact = false }: BotStatusProps) {
  if (isLoading) {
    return compact ? (
      <Skeleton className="w-24 h-6" />
    ) : (
      <div className="space-y-2">
        <Skeleton className="w-full h-8" />
        <Skeleton className="w-3/4 h-8" />
      </div>
    );
  }
  
  if (!status) {
    return (
      <Badge variant="destructive">
        Offline
      </Badge>
    );
  }
  
  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };
  
  if (compact) {
    return (
      <Badge variant={status.status === "online" ? "success" : "warning"}>
        {status.status === "online" ? "Online" : "Maintenance"}
      </Badge>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant={status.status === "online" ? "success" : "warning"} className="text-sm">
          {status.status === "online" ? "Online" : "Maintenance"}
        </Badge>
        <span className="text-sm text-muted-foreground">Version {status.version}</span>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Uptime</span>
        <span className="text-sm">{formatUptime(status.uptime)}</span>
      </div>
    </div>
  );
}
