import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BotStatus from "@/components/BotStatus";
import BotStatistics from "@/components/BotStatistics";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/AdminLayout";
import { BarChart, Box, LineChart } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Bot status interface - matches the API response
interface BotStatusType {
  status: string;
  version: string;
  uptime: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
  };
}

// Statistics interface - matches the API response
interface StatsType {
  totalUsers: number;
  totalCcoin: number;
  totalCrystals: number;
  totalClans: number;
}

// Generic type for resources that have length property
interface Resource {
  length: number;
}

// Helper function to format bytes to a human-readable format
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function Admin() {
  const { toast } = useToast();
  
  const { data: botStatus, isLoading: statusLoading } = useQuery<BotStatusType>({
    queryKey: ['/api/bot/status']
  });
  
  const { data: stats, isLoading: statsLoading } = useQuery<StatsType>({
    queryKey: ['/api/stats']
  });
  
  const { data: users, isLoading: usersLoading } = useQuery<Resource>({
    queryKey: ['/api/users']
  });
  
  const { data: items, isLoading: itemsLoading } = useQuery<Resource>({
    queryKey: ['/api/items']
  });
  
  const { data: clans, isLoading: clansLoading } = useQuery<Resource>({
    queryKey: ['/api/clans']
  });
  
  const { data: quests, isLoading: questsLoading } = useQuery<Resource>({
    queryKey: ['/api/quests']
  });
  
  return (
    <AdminLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="border-indigo-500/20 shadow-md shadow-indigo-200/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="bg-indigo-500/10 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <span>کاربران</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mt-2 mb-2">
              {statsLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                stats?.totalUsers || "0"
              )}
            </div>
            <Progress value={65} className="h-1.5" />
            <p className="text-muted-foreground text-xs mt-2">
              افزایش 12% نسبت به ماه گذشته
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-cyan-500/20 shadow-md shadow-cyan-200/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="bg-cyan-500/10 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <span>کوئست‌ها</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mt-2 mb-2">
              {questsLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                quests?.length || "0"
              )}
            </div>
            <Progress value={40} className="h-1.5" />
            <p className="text-muted-foreground text-xs mt-2">
              افزایش 5% نسبت به ماه گذشته
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-amber-500/20 shadow-md shadow-amber-200/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="bg-amber-500/10 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M2 20h.01"/><path d="M7 20v-6m-5 6h8v-6M22 20h.01"/><path d="M17 20v-6m-5 6h8v-6"/><path d="M7 11V4h10v7"/><path d="M12 4v7"/></svg>
              </div>
              <span>کلن‌ها</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mt-2 mb-2">
              {clansLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                clans?.length || "0"
              )}
            </div>
            <Progress value={75} className="h-1.5" />
            <p className="text-muted-foreground text-xs mt-2">
              افزایش 18% نسبت به ماه گذشته
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-emerald-500/20 shadow-md shadow-emerald-200/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="bg-emerald-500/10 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </div>
              <span>آیتم‌ها</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mt-2 mb-2">
              {itemsLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                items?.length || "0"
              )}
            </div>
            <Progress value={50} className="h-1.5" />
            <p className="text-muted-foreground text-xs mt-2">
              افزایش 8% نسبت به ماه گذشته
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-primary" />
              آمار
            </CardTitle>
            <CardDescription>آمار مصرف منابع و فعالیت‌های ربات</CardDescription>
          </CardHeader>
          <CardContent>
            <BotStatistics isLoading={statsLoading} stats={stats} detailed={true} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Box className="h-5 w-5 text-primary" />
              وضعیت ربات
            </CardTitle>
            <CardDescription>وضعیت عملیاتی فعلی</CardDescription>
          </CardHeader>
          <CardContent>
            <BotStatus isLoading={statusLoading} status={botStatus} />
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-primary" />
              مصرف منابع
            </CardTitle>
            <CardDescription>وضعیت مصرف حافظه</CardDescription>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-6 bg-gray-200 rounded w-full"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-2/3"></div>
              </div>
            ) : botStatus ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Heap Used</span>
                    <span className="font-medium">{formatBytes(botStatus.memoryUsage.heapUsed)}</span>
                  </div>
                  <Progress value={(botStatus.memoryUsage.heapUsed / botStatus.memoryUsage.heapTotal) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Heap Total</span>
                    <span className="font-medium">{formatBytes(botStatus.memoryUsage.heapTotal)}</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>RSS</span>
                    <span className="font-medium">{formatBytes(botStatus.memoryUsage.rss)}</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>External</span>
                    <span className="font-medium">{formatBytes(botStatus.memoryUsage.external)}</span>
                  </div>
                  <Progress value={30} className="h-2" />
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">اطلاعاتی در دسترس نیست</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>فعالیت‌های اخیر</CardTitle>
            <CardDescription>آخرین فعالیت‌های انجام شده</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center 
                    ${i % 4 === 0 ? 'bg-blue-100 text-blue-600' : 
                      i % 4 === 1 ? 'bg-green-100 text-green-600' : 
                      i % 4 === 2 ? 'bg-amber-100 text-amber-600' : 
                      'bg-purple-100 text-purple-600'}`}>
                    {i % 4 === 0 ? '👤' : i % 4 === 1 ? '💰' : i % 4 === 2 ? '🏆' : '🎮'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {i % 4 === 0 ? 'کاربر جدید ثبت نام کرد' : 
                        i % 4 === 1 ? 'تراکنش موفق انجام شد' : 
                        i % 4 === 2 ? 'دستاورد جدید باز شد' : 
                        'بازی جدید شروع شد'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {i * 12 + 5} دقیقه پیش
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}