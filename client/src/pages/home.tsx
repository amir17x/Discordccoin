import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import BotStatus from "@/components/BotStatus";
import BotStatistics from "@/components/BotStatistics";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();
  
  const { data: healthData, isLoading: healthLoading, error: healthError } = useQuery({
    queryKey: ['/api/health'],
  });
  
  const { data: botStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['/api/stats'],
  });
  
  const { data: botStatus, isLoading: statusLoading, error: statusError } = useQuery({
    queryKey: ['/api/bot/status'],
  });
  
  if (healthError || statsError || statusError) {
    toast({
      title: "Error",
      description: "Failed to fetch data from server. Please check your connection.",
      variant: "destructive",
    });
  }
  
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-discord-darker py-4 shadow-lg">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-discord-primary text-white p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bot"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
            </div>
            <h1 className="text-white text-xl font-bold">Discord Gaming Bot</h1>
          </div>
          <nav className="flex gap-2">
            <Link href="/admin">
              <Button variant="secondary">Admin Panel</Button>
            </Link>
            <Link href="/simulator">
              <Button variant="outline">Bot Simulator</Button>
            </Link>
          </nav>
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Bot Status</CardTitle>
              <CardDescription>Current status of the Discord bot</CardDescription>
            </CardHeader>
            <CardContent>
              <BotStatus isLoading={statusLoading} status={botStatus} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Bot Statistics</CardTitle>
              <CardDescription>Current metrics and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <BotStatistics isLoading={statsLoading} stats={botStats} />
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Link href="/admin">
                <Button variant="outline">View Detailed Statistics</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Economy System</CardTitle>
              <CardDescription>Virtual economy with Ccoin and Crystal currencies</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                <li>Daily rewards and bank system</li>
                <li>Transfer coins between users</li>
                <li>Interest on bank deposits</li>
                <li>Economic levels with special bonuses</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Gaming Features</CardTitle>
              <CardDescription>Various games for users to enjoy</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                <li>Solo games: coin flip, RPS, number guess</li>
                <li>Competitive games between users</li>
                <li>Group games for multiple players</li>
                <li>Tournaments with special prizes</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Clan System</CardTitle>
              <CardDescription>Create and join clans with other users</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                <li>Create or join existing clans</li>
                <li>Clan bank and resource sharing</li>
                <li>Clan missions and achievements</li>
                <li>Clan wars with other clans</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <footer className="bg-discord-darker py-6 mt-10">
        <div className="container mx-auto px-4 text-center text-white/60">
          <p>Discord Gaming Bot &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
