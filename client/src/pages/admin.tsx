import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import { 
  ArrowLeft, 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  Trophy, 
  Castle, 
  Target 
} from "lucide-react";

export default function Admin() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const { data: botStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/bot/status'],
    onError: () => {
      toast({
        title: "Connection Error",
        description: "Failed to fetch bot status",
        variant: "destructive",
      });
    }
  });
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats'],
    onError: () => {
      toast({
        title: "Connection Error",
        description: "Failed to fetch statistics",
        variant: "destructive",
      });
    }
  });
  
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    onError: () => {
      toast({
        title: "Connection Error",
        description: "Failed to fetch users data",
        variant: "destructive",
      });
    }
  });
  
  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['/api/items'],
    onError: () => {
      toast({
        title: "Connection Error",
        description: "Failed to fetch items data",
        variant: "destructive",
      });
    }
  });
  
  const { data: clans, isLoading: clansLoading } = useQuery({
    queryKey: ['/api/clans'],
    onError: () => {
      toast({
        title: "Connection Error",
        description: "Failed to fetch clans data",
        variant: "destructive",
      });
    }
  });
  
  const { data: quests, isLoading: questsLoading } = useQuery({
    queryKey: ['/api/quests'],
    onError: () => {
      toast({
        title: "Connection Error",
        description: "Failed to fetch quests data",
        variant: "destructive",
      });
    }
  });
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-discord-darker py-4 shadow-lg">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-white">
                <ArrowLeft />
              </Button>
            </Link>
            <h1 className="text-white text-xl font-bold">Admin Panel</h1>
          </div>
          <div className="flex items-center space-x-2">
            <BotStatus isLoading={statusLoading} status={botStatus} compact={true} />
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-6 flex-grow">
        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-6 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="items" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Items</span>
            </TabsTrigger>
            <TabsTrigger value="quests" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Quests</span>
            </TabsTrigger>
            <TabsTrigger value="clans" className="flex items-center gap-2">
              <Castle className="h-4 w-4" />
              <span className="hidden sm:inline">Clans</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Achievements</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bot Status</CardTitle>
                  <CardDescription>Current operational status</CardDescription>
                </CardHeader>
                <CardContent>
                  <BotStatus isLoading={statusLoading} status={botStatus} />
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                  <CardDescription>Bot usage and economy metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <BotStatistics isLoading={statsLoading} stats={stats} detailed={true} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Memory Usage</CardTitle>
                  <CardDescription>Current resource utilization</CardDescription>
                </CardHeader>
                <CardContent>
                  {statusLoading ? (
                    <div className="animate-pulse h-20 bg-gray-200 rounded"></div>
                  ) : botStatus ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Heap Used:</span>
                        <span>{formatBytes(botStatus.memoryUsage.heapUsed)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Heap Total:</span>
                        <span>{formatBytes(botStatus.memoryUsage.heapTotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>RSS:</span>
                        <span>{formatBytes(botStatus.memoryUsage.rss)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>External:</span>
                        <span>{formatBytes(botStatus.memoryUsage.external)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">No data available</div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest bot interactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-gray-500">
                    Activity log will be available in future updates
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all users</CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="animate-pulse space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-10 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : users && users.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Wallet</TableHead>
                        <TableHead>Bank</TableHead>
                        <TableHead>Crystals</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Clan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.id}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.wallet}</TableCell>
                          <TableCell>{user.bank}</TableCell>
                          <TableCell>{user.crystals}</TableCell>
                          <TableCell>{user.economyLevel}</TableCell>
                          <TableCell>
                            {user.clanId ? (
                              <Badge variant="outline">{user.clanId}</Badge>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center text-gray-500">No users found</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="items">
            <Card>
              <CardHeader>
                <CardTitle>Item Management</CardTitle>
                <CardDescription>View and manage shop items</CardDescription>
              </CardHeader>
              <CardContent>
                {itemsLoading ? (
                  <div className="animate-pulse space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-10 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : items && items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Crystal Price</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Rarity</TableHead>
                        <TableHead>Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span className="mr-2">{item.emoji}</span>
                              {item.name}
                            </div>
                          </TableCell>
                          <TableCell>{item.price || '-'}</TableCell>
                          <TableCell>{item.crystalPrice || '-'}</TableCell>
                          <TableCell>{item.type}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.rarity === 'legendary' ? 'destructive' :
                                item.rarity === 'rare' ? 'default' :
                                item.rarity === 'uncommon' ? 'outline' :
                                'secondary'
                              }
                            >
                              {item.rarity}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.duration ? `${item.duration}h` : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center text-gray-500">No items found</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="quests">
            <Card>
              <CardHeader>
                <CardTitle>Quest Management</CardTitle>
                <CardDescription>View and manage all quests</CardDescription>
              </CardHeader>
              <CardContent>
                {questsLoading ? (
                  <div className="animate-pulse space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-10 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : quests && quests.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Requirement</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Reward</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quests.map((quest: any) => (
                        <TableRow key={quest.id}>
                          <TableCell>{quest.id}</TableCell>
                          <TableCell>{quest.title}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                quest.type === 'daily' ? 'default' :
                                quest.type === 'weekly' ? 'outline' : 'secondary'
                              }
                            >
                              {quest.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{quest.requirement}</TableCell>
                          <TableCell>{quest.targetAmount}</TableCell>
                          <TableCell>{quest.reward} Ccoin</TableCell>
                          <TableCell>
                            <Badge
                              variant={quest.active ? 'success' : 'destructive'}
                            >
                              {quest.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center text-gray-500">No quests found</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="clans">
            <Card>
              <CardHeader>
                <CardTitle>Clan Management</CardTitle>
                <CardDescription>View and manage all clans</CardDescription>
              </CardHeader>
              <CardContent>
                {clansLoading ? (
                  <div className="animate-pulse space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-10 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : clans && clans.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Bank</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clans.map((clan: any) => (
                        <TableRow key={clan.id}>
                          <TableCell>{clan.id}</TableCell>
                          <TableCell>{clan.name}</TableCell>
                          <TableCell>{clan.ownerId}</TableCell>
                          <TableCell>{clan.memberCount}</TableCell>
                          <TableCell>{clan.level}</TableCell>
                          <TableCell>{clan.bank} Ccoin</TableCell>
                          <TableCell>{new Date(clan.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center text-gray-500">No clans found</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="achievements">
            <Card>
              <CardHeader>
                <CardTitle>Achievement Management</CardTitle>
                <CardDescription>View and manage achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500">
                  Achievement management will be available in future updates
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <footer className="bg-discord-darker py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-white/60">
          <p className="text-sm">Admin Panel &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}

// Helper function to format bytes
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
