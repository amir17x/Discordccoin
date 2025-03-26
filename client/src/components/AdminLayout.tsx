import { useState, useEffect, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarProvider, 
  SidebarTrigger,
  SidebarSeparator
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  TrendingUp, 
  Ticket, 
  DollarSign, 
  Shield, 
  Gamepad2, 
  Package, 
  Target, 
  Castle, 
  Gift, 
  ShoppingCart,
  UsersRound,
  UserX,
  MessageCircle,
  Trophy,
  ArrowLeft,
  FileCode,
  Webhook,
  Settings,
  LogOut,
  BoxIcon
} from "lucide-react";
import BotStatus from "@/components/BotStatus";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [_, setLocation] = useLocation();
  const [location] = useLocation();
  const { toast } = useToast();
  
  const { data: botStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/bot/status']
  });

  // Function to check if a menu item is active
  const isActive = (path: string) => {
    return location === path;
  };
  
  // Helper for menu button styling
  const getMenuButtonClass = (path: string) => {
    return `transition-all duration-300 ${isActive(path) ? "bg-gradient-to-r from-blue-600/50 to-purple-600/50 text-white font-medium" : "hover:bg-white/5"}`;
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar 
          className="bg-discord-dark border-discord-border shadow-lg transition-all duration-300 ease-in-out" 
          side="right" 
          collapsible="icon"
        >
          <SidebarHeader className="h-16 flex items-center justify-between px-4 border-b border-discord-border bg-gradient-to-br from-discord-dark to-discord-darker">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bot">
                  <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>
                </svg>
              </div>
              <span className="font-bold text-white">پنل مدیریت</span>
            </div>
            <SidebarTrigger className="text-white hover:bg-discord-primary/20 transition-all duration-300 rounded-md p-1.5" />
          </SidebarHeader>

          <SidebarContent className="p-2">
            {/* Main Section */}
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/admin">
                  <SidebarMenuButton 
                    isActive={isActive("/admin")}
                    className={getMenuButtonClass("/admin")}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>داشبورد</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin/users">
                  <SidebarMenuButton 
                    isActive={isActive("/admin/users")}
                    className={getMenuButtonClass("/admin/users")}
                  >
                    <Users className="h-4 w-4" />
                    <span>کاربران</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>

            <SidebarSeparator className="my-2" />

            {/* Economy Section */}
            <div className="px-3 py-2 text-xs text-gray-500">اقتصاد</div>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/admin/transactions">
                  <SidebarMenuButton
                    isActive={isActive("/admin/transactions")}
                    className={getMenuButtonClass("/admin/transactions")}
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>تراکنش‌ها</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin/stocks">
                  <SidebarMenuButton
                    isActive={isActive("/admin/stocks")}
                    className={getMenuButtonClass("/admin/stocks")}
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>سهام</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin/lottery">
                  <SidebarMenuButton
                    isActive={isActive("/admin/lottery")}
                    className={getMenuButtonClass("/admin/lottery")}
                  >
                    <Ticket className="h-4 w-4" />
                    <span>لاتاری</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin/economy">
                  <SidebarMenuButton
                    isActive={isActive("/admin/economy")}
                    className={getMenuButtonClass("/admin/economy")}
                  >
                    <DollarSign className="h-4 w-4" />
                    <span>مدیریت اقتصاد</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin/robbery">
                  <SidebarMenuButton
                    isActive={isActive("/admin/robbery")}
                    className={getMenuButtonClass("/admin/robbery")}
                  >
                    <Shield className="h-4 w-4" />
                    <span>تنظیمات سرقت</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>

            <SidebarSeparator className="my-2" />

            {/* Gameplay Section */}
            <div className="px-3 py-2 text-xs text-gray-500">گیم‌پلی</div>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/admin/games">
                  <SidebarMenuButton 
                    isActive={isActive("/admin/games")}
                    className={getMenuButtonClass("/admin/games")}
                  >
                    <Gamepad2 className="h-4 w-4" />
                    <span>بازی‌ها</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin/items">
                  <SidebarMenuButton 
                    isActive={isActive("/admin/items")}
                    className={getMenuButtonClass("/admin/items")}
                  >
                    <Package className="h-4 w-4" />
                    <span>آیتم‌ها</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin/quests">
                  <SidebarMenuButton 
                    isActive={isActive("/admin/quests")}
                    className={getMenuButtonClass("/admin/quests")}
                  >
                    <Target className="h-4 w-4" />
                    <span>ماموریت‌ها</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin/clans">
                  <SidebarMenuButton 
                    isActive={isActive("/admin/clans")}
                    className={getMenuButtonClass("/admin/clans")}
                  >
                    <Castle className="h-4 w-4" />
                    <span>کلن‌ها</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin/rewards">
                  <SidebarMenuButton 
                    isActive={isActive("/admin/rewards")}
                    className={getMenuButtonClass("/admin/rewards")}
                  >
                    <Gift className="h-4 w-4" />
                    <span>جایزه‌ها</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin/shop">
                  <SidebarMenuButton 
                    isActive={isActive("/admin/shop")}
                    className={getMenuButtonClass("/admin/shop")}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>فروشگاه</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>

            <SidebarSeparator className="my-2" />

            {/* Social Section */}
            <div className="px-3 py-2 text-xs text-gray-500">اجتماعی</div>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/admin/friends">
                  <SidebarMenuButton 
                    isActive={isActive("/admin/friends")}
                    className={getMenuButtonClass("/admin/friends")}
                  >
                    <UsersRound className="h-4 w-4" />
                    <span>سیستم دوستی</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin/blocked">
                  <SidebarMenuButton 
                    isActive={isActive("/admin/blocked")}
                    className={getMenuButtonClass("/admin/blocked")}
                  >
                    <UserX className="h-4 w-4" />
                    <span>کاربران بلاک شده</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin/chats">
                  <SidebarMenuButton 
                    isActive={isActive("/admin/chats")}
                    className={getMenuButtonClass("/admin/chats")}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>چت‌های خصوصی</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin/leaderboard">
                  <SidebarMenuButton 
                    isActive={isActive("/admin/leaderboard")}
                    className={getMenuButtonClass("/admin/leaderboard")}
                  >
                    <Trophy className="h-4 w-4" />
                    <span>رتبه‌بندی</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>

            <SidebarSeparator className="my-2" />

            {/* Development Section */}
            <div className="px-3 py-2 text-xs text-gray-500">توسعه</div>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/admin/api">
                  <SidebarMenuButton 
                    isActive={isActive("/admin/api")}
                    className={getMenuButtonClass("/admin/api")}
                  >
                    <FileCode className="h-4 w-4" />
                    <span>API مستندات</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin/webhooks">
                  <SidebarMenuButton 
                    isActive={isActive("/admin/webhooks")}
                    className={getMenuButtonClass("/admin/webhooks")}
                  >
                    <Webhook className="h-4 w-4" />
                    <span>وب‌هوک‌ها</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin/settings">
                  <SidebarMenuButton 
                    isActive={isActive("/admin/settings")}
                    className={getMenuButtonClass("/admin/settings")}
                  >
                    <Settings className="h-4 w-4" />
                    <span>تنظیمات</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-discord-border bg-gradient-to-br from-discord-dark to-discord-darker">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-2 rounded-full shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div className="text-sm">
                  <div className="font-medium text-white">مدیر</div>
                  <div className="text-xs text-gray-400">دسترسی کامل</div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-red-500 hover:text-red-400 hover:bg-red-900/30 transition-colors duration-300"
                onClick={() => setLocation("/admin/logout")}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-discord-darker">
          <header className="bg-gradient-to-r from-discord-dark to-discord-darker py-4 shadow-lg border-b border-discord-border/30">
            <div className="container mx-auto px-4 flex justify-between items-center">
              <div className="flex items-center gap-4 rtl:space-x-reverse">
                <Link href="/">
                  <Button variant="ghost" size="icon" className="text-white hover:bg-discord-primary/20">
                    <ArrowLeft />
                  </Button>
                </Link>
                <h1 className="text-white text-xl font-bold">پنل مدیریت Ccoin</h1>
              </div>
              <div className="flex items-center gap-4">
                <BotStatus isLoading={statusLoading} status={botStatus as any} compact={true} />
              </div>
            </div>
          </header>
          
          <main className="flex-1 container mx-auto px-4 py-6 bg-discord-darker text-white">
            {children}
          </main>
          
          <footer className="bg-gradient-to-r from-discord-darker to-discord-dark py-4 border-t border-discord-border/30">
            <div className="container mx-auto px-4 text-center text-white/60">
              <p className="text-sm">پنل مدیریت Ccoin &copy; {new Date().getFullYear()} - Vision UI Dashboard</p>
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}