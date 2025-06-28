import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, Coins, Trophy, Settings, RefreshCw } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function Admin() {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [coinAmount, setCoinAmount] = useState("");

  // Fetch admin data
  const { data: adminStats, isLoading: statsLoading } = useQuery<{
    totalUsers: number;
    totalCoins: number;
    totalCrystals: number;
    totalClans: number;
  }>({
    queryKey: ['/api/admin/stats'],
  });

  const { data: usersList, isLoading: usersLoading } = useQuery<Array<{
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
  });

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">پنل مدیریت Ccoin Bot</h1>
          <p className="text-muted-foreground">مدیریت کاربران، اقتصاد و تنظیمات ربات</p>
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">مدیریت کاربران</TabsTrigger>
            <TabsTrigger value="economy">مدیریت اقتصاد</TabsTrigger>
            <TabsTrigger value="clans">مدیریت کلن‌ها</TabsTrigger>
            <TabsTrigger value="settings">تنظیمات</TabsTrigger>
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
                        <div>
                          <p className="font-medium">{user.username || user.discordId}</p>
                          <p className="text-sm text-muted-foreground">
                            سکه: {user.wallet?.toLocaleString() || 0} | 
                            بانک: {user.bank?.toLocaleString() || 0}
                          </p>
                        </div>
                        <Badge variant={user.banned ? "destructive" : "default"}>
                          {user.banned ? "مسدود" : "فعال"}
                        </Badge>
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

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>تنظیمات ربات</CardTitle>
                <CardDescription>تنظیمات عمومی و پیکربندی ربات</CardDescription>
              </CardHeader>
              <CardContent>
                <p>این بخش در حال توسعه است...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}