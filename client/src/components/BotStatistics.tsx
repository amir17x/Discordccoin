import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface BotStatisticsProps {
  isLoading: boolean;
  stats?: {
    totalUsers: number;
    totalCcoin: number;
    totalCrystals: number;
    totalClans: number;
  };
  detailed?: boolean;
}

export default function BotStatistics({ isLoading, stats, detailed = false }: BotStatisticsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="w-full h-8" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="w-full h-16" />
          <Skeleton className="w-full h-16" />
          <Skeleton className="w-full h-16" />
          <Skeleton className="w-full h-16" />
        </div>
      </div>
    );
  }
  
  if (!stats) {
    return (
      <div className="text-center text-muted-foreground">
        No statistics available
      </div>
    );
  }
  
  if (detailed) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            title="Total Users" 
            value={stats.totalUsers.toLocaleString()} 
            description="Registered users"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            }
          />
          
          <StatCard 
            title="Total Ccoin" 
            value={stats.totalCcoin.toLocaleString()} 
            description="In circulation"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-coins"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>
            }
          />
          
          <StatCard 
            title="Total Crystals" 
            value={stats.totalCrystals.toLocaleString()} 
            description="Premium currency"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-gem"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>
            }
          />
          
          <StatCard 
            title="Total Clans" 
            value={stats.totalClans.toLocaleString()} 
            description="Active clans"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-castle"><path d="M22 20v-9H2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2Z"/><path d="M18 11V4H6v7"/><path d="M15 22v-4a3 3 0 0 0-6 0v4"/><path d="M22 11V9"/><path d="M2 11V9"/><path d="M6 4v4"/><path d="M18 4v4"/><path d="M10 4v4"/><path d="M14 4v4"/></svg>
            }
          />
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Average Ccoin per User</span>
            <span className="text-sm">
              {stats.totalUsers > 0 
                ? Math.round(stats.totalCcoin / stats.totalUsers).toLocaleString() 
                : 0}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Users in Clans</span>
              <span className="text-sm">
                {stats.totalClans > 0 && stats.totalUsers > 0
                  ? `${Math.min(100, Math.round((stats.totalClans * 5 / stats.totalUsers) * 100))}%`
                  : '0%'}
              </span>
            </div>
            <Progress 
              value={stats.totalClans > 0 && stats.totalUsers > 0
                ? Math.min(100, Math.round((stats.totalClans * 5 / stats.totalUsers) * 100))
                : 0
              } 
            />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">Users</span>
          <span className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">Ccoin</span>
          <span className="text-2xl font-bold">{stats.totalCcoin.toLocaleString()}</span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">Crystals</span>
          <span className="text-2xl font-bold">{stats.totalCrystals.toLocaleString()}</span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">Clans</span>
          <span className="text-2xl font-bold">{stats.totalClans.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <div className="flex items-center space-x-4 rounded-lg border p-4">
      <div className="p-2 bg-primary/10 rounded-full text-primary">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
