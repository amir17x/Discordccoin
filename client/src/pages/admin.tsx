import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, Coins, Trophy, Settings, RefreshCw, Shield, ShoppingBag, Target, Megaphone, Database, BarChart3 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function Admin() {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [coinAmount, setCoinAmount] = useState("");

  // Fetch admin data with disabled auto-refetch
  const { data: adminStats, isLoading: statsLoading, refetch: refetchStats } = useQuery<{
    totalUsers: number;
    totalCoins: number;
    totalCrystals: number;
    totalClans: number;
  }>({
    queryKey: ['/api/admin/stats'],
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: Infinity,
  });

  const { data: usersList, isLoading: usersLoading, refetch: refetchUsers } = useQuery<Array<{
    discordId: string;
    username?: string;
    wallet: number;
    bank: number;
    crystals: number;
    banned: boolean;
    level: number;
    clanId?: string;
  }>>({
    queryKey: ['/api/admin/users'],
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: Infinity,
  });

  // Manual refresh function
  const handleRefresh = () => {
    refetchStats();
    refetchUsers();
  };

  // Mutations for admin actions
  const addCoinsMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      const response = await fetch('/api/admin/add-coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount }),
      });
      if (!response.ok) throw new Error('Failed to add coins');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setCoinAmount("");
      setSelectedUserId("");
    },
  });

  const resetEconomyMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/reset-economy', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to reset economy');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
  });

  const handleAddCoins = () => {
    if (selectedUserId && coinAmount) {
      addCoinsMutation.mutate({
        userId: selectedUserId,
        amount: parseInt(coinAmount),
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">پنل مدیریت Ccoin Bot</h1>
            <p className="text-muted-foreground">مدیریت کاربران، اقتصاد و تنظیمات ربات</p>
          </div>
          <Button 
            onClick={handleRefresh}
            disabled={statsLoading || usersLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${(statsLoading || usersLoading) ? 'animate-spin' : ''}`} />
            {(statsLoading || usersLoading) ? 'در حال بروزرسانی...' : 'بروزرسانی اطلاعات'}
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">کل کاربران</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : adminStats?.totalUsers?.toLocaleString() || "0"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">کل سکه‌ها</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : adminStats?.totalCoins?.toLocaleString() || "0"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">کل کریستال‌ها</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : adminStats?.totalCrystals?.toLocaleString() || "0"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">کل کلن‌ها</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : adminStats?.totalClans || "0"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="users">👥 کاربران</TabsTrigger>
            <TabsTrigger value="economy">💰 اقتصاد</TabsTrigger>
            <TabsTrigger value="items">🛒 آیتم‌ها</TabsTrigger>
            <TabsTrigger value="clans">🏰 کلن‌ها</TabsTrigger>
            <TabsTrigger value="broadcast">📢 اطلاع‌رسانی</TabsTrigger>
            <TabsTrigger value="settings">⚙️ تنظیمات</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>لیست کاربران</CardTitle>
                <CardDescription>مدیریت و مشاهده کاربران ربات</CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <p>در حال بارگیری...</p>
                ) : (
                  <div className="space-y-4">
                    {usersList?.slice(0, 10)?.map((user) => (
                      <div
                        key={user.discordId}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{user.username || user.discordId}</p>
                          <p className="text-sm text-muted-foreground">
                            💰 سکه: {user.wallet?.toLocaleString() || 0} | 
                            🏦 بانک: {user.bank?.toLocaleString() || 0} | 
                            💎 کریستال: {user.crystals?.toLocaleString() || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            🏆 سطح: {user.level || 1} | 
                            {user.clanId ? `🏰 کلن: ${user.clanId}` : 'بدون کلن'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={user.banned ? "destructive" : "default"}>
                            {user.banned ? "مسدود" : "فعال"}
                          </Badge>
                          <Button variant="outline" size="sm">
                            مدیریت
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="economy">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>اضافه کردن سکه</CardTitle>
                  <CardDescription>سکه به کاربر مورد نظر اضافه کنید</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="userId">شناسه کاربر (Discord ID)</Label>
                    <Input
                      id="userId"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      placeholder="مثال: 123456789012345678"
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">مقدار سکه</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={coinAmount}
                      onChange={(e) => setCoinAmount(e.target.value)}
                      placeholder="مثال: 1000"
                    />
                  </div>
                  <Button 
                    onClick={handleAddCoins}
                    disabled={addCoinsMutation.isPending || !selectedUserId || !coinAmount}
                    className="w-full"
                  >
                    {addCoinsMutation.isPending ? "در حال اضافه کردن..." : "اضافه کردن سکه"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>عملیات اقتصادی</CardTitle>
                  <CardDescription>عملیات خطرناک روی اقتصاد ربات</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant="destructive"
                    onClick={() => resetEconomyMutation.mutate()}
                    disabled={resetEconomyMutation.isPending}
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {resetEconomyMutation.isPending ? "در حال بازنشانی..." : "بازنشانی کل اقتصاد"}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    ⚠️ این عمل تمام سکه‌ها و کریستال‌های کاربران را پاک می‌کند
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="clans">
            <Card>
              <CardHeader>
                <CardTitle>مدیریت کلن‌ها</CardTitle>
                <CardDescription>مشاهده و مدیریت کلن‌های موجود</CardDescription>
              </CardHeader>
              <CardContent>
                <p>این بخش در حال توسعه است...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="items">
            <Card>
              <CardHeader>
                <CardTitle>مدیریت آیتم‌ها</CardTitle>
                <CardDescription>مشاهده و مدیریت آیتم‌های موجود در فروشگاه</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">اضافه کردن آیتم جدید</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="itemName">نام آیتم</Label>
                        <Input id="itemName" placeholder="مثال: جایزه ویژه" />
                      </div>
                      <div>
                        <Label htmlFor="itemPrice">قیمت (سکه)</Label>
                        <Input id="itemPrice" type="number" placeholder="1000" />
                      </div>
                      <div>
                        <Label htmlFor="itemDescription">توضیحات</Label>
                        <Input id="itemDescription" placeholder="توضیح آیتم..." />
                      </div>
                      <Button className="w-full">
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        اضافه کردن آیتم
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">آیتم‌های موجود</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">در حال بارگیری آیتم‌ها...</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="broadcast">
            <Card>
              <CardHeader>
                <CardTitle>سیستم اطلاع‌رسانی</CardTitle>
                <CardDescription>ارسال پیام به تمام کاربران یا سرورها</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">ارسال اطلاعیه عمومی</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="broadcastTitle">عنوان اطلاعیه</Label>
                        <Input id="broadcastTitle" placeholder="عنوان..." />
                      </div>
                      <div>
                        <Label htmlFor="broadcastMessage">متن پیام</Label>
                        <textarea 
                          id="broadcastMessage"
                          className="w-full p-2 border rounded-md"
                          rows={4}
                          placeholder="متن اطلاعیه..."
                        />
                      </div>
                      <Button className="w-full" variant="destructive">
                        <Megaphone className="w-4 h-4 mr-2" />
                        ارسال به همه سرورها
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">آمار اطلاع‌رسانی</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p>📊 تعداد سرورهای فعال: در حال بارگیری...</p>
                        <p>👥 تعداد کاربران دریافت‌کننده: در حال محاسبه...</p>
                        <p>📅 آخرین اطلاع‌رسانی: هنوز ارسال نشده</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>تنظیمات ربات</CardTitle>
                <CardDescription>تنظیمات عمومی و پیکربندی ربات</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">تنظیمات اقتصادی</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>پاداش روزانه پیش‌فرض</Label>
                        <Input className="w-24" defaultValue="100" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>نرخ بهره بانک (%)</Label>
                        <Input className="w-24" defaultValue="2" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>حداکثر وام</Label>
                        <Input className="w-24" defaultValue="10000" />
                      </div>
                      <Button className="w-full">ذخیره تنظیمات</Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">تنظیمات سیستم</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>حالت نگهداری</Label>
                        <Button variant="outline" size="sm">غیرفعال</Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>سطح لاگ</Label>
                        <Button variant="outline" size="sm">INFO</Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>پشتیبان‌گیری خودکار</Label>
                        <Button variant="outline" size="sm">فعال</Button>
                      </div>
                      <Button className="w-full">
                        <Database className="w-4 h-4 mr-2" />
                        پشتیبان‌گیری دستی
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}