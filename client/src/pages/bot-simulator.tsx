import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  user: boolean;
  content: string;
  embeds?: any[];
  components?: any[];
}

interface ButtonComponent {
  type: number;
  components: {
    type: number;
    label: string;
    custom_id: string;
    style: number;
    disabled?: boolean;
  }[];
}

export default function BotSimulator() {
  const { toast } = useToast();
  const [userId, setUserId] = useState("123456789");
  const [username, setUsername] = useState("کاربر تست");
  const [command, setCommand] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ارسال یک دستور به ربات
  const sendCommand = async () => {
    if (!command) {
      toast({
        title: "خطا",
        description: "لطفاً یک دستور وارد کنید",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const userMessage: Message = {
        id: Date.now().toString(),
        user: true,
        content: `/${command}`,
      };
      setMessages((prev) => [...prev, userMessage]);

      const response = await fetch("/api/bot/simulate", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          username,
          command,
        })
      });
      
      const responseData = await response.json();
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        user: false,
        content: responseData.content,
        embeds: responseData.embeds,
        components: responseData.components,
      };
      
      setMessages((prev) => [...prev, botResponse]);
      setCommand("");
    } catch (error) {
      console.error("Error sending command:", error);
      toast({
        title: "خطا در برقراری ارتباط",
        description: "مشکلی در اجرای دستور پیش آمد.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // کلیک روی دکمه
  const handleButtonClick = async (customId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/bot/simulate/button", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          username,
          customId,
        })
      });
      
      const responseData = await response.json();
      
      const botResponse: Message = {
        id: Date.now().toString(),
        user: false,
        content: responseData.content,
        embeds: responseData.embeds,
        components: responseData.components,
      };
      
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error("Error clicking button:", error);
      toast({
        title: "خطا در برقراری ارتباط",
        description: "مشکلی در اجرای دکمه پیش آمد.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // تبدیل style عددی به کلاس دکمه
  const getButtonStyle = (style: number) => {
    switch (style) {
      case 1: return "default"; // PRIMARY
      case 2: return "secondary"; // SECONDARY
      case 3: return "destructive"; // DANGER
      case 4: return "outline"; // SUCCESS
      default: return "default";
    }
  };

  return (
    <div className="container py-8 rtl">
      <h1 className="text-3xl font-bold mb-6 text-center">شبیه‌ساز ربات Ccoin</h1>
      <p className="text-center mb-8 text-muted-foreground">
        با این ابزار می‌توانید عملکرد ربات را بدون نیاز به دیسکورد تست کنید
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* بخش تنظیمات کاربر */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>تنظیمات کاربر</CardTitle>
            <CardDescription>اطلاعات کاربر برای شبیه‌سازی</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">شناسه کاربر</Label>
              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="مثال: 123456789"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">نام کاربری</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="مثال: کاربر تست"
              />
            </div>
          </CardContent>
          <CardFooter>
            <div className="w-full space-y-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setMessages([]);
                    toast({
                      title: "تاریخچه پاک شد",
                      description: "تمام پیام‌ها پاک شدند",
                    });
                  }}
                >
                  پاک کردن تاریخچه
                </Button>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="commands">دستورات پیشنهادی</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["ccoin", "economy", "shop", "profile", "games", "investment", "clan", "quests"].map((cmd) => (
                    <Button
                      key={cmd}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCommand(cmd);
                        setTimeout(() => sendCommand(), 100);
                      }}
                    >
                      {cmd}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* بخش چت */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>شبیه‌ساز چت</CardTitle>
            <CardDescription>مکالمه با ربات Ccoin</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-center text-muted-foreground">
                  <p>هنوز پیامی ارسال نشده است</p>
                  <p className="text-sm mt-2">از فرم پایین برای ارسال دستور استفاده کنید</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.user ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`flex gap-3 max-w-[80%] ${
                          message.user ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        <Avatar className="w-10 h-10">
                          <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold">
                            {message.user ? username.charAt(0) : "C"}
                          </div>
                        </Avatar>
                        <div className={`space-y-3 ${message.user ? "items-end" : "items-start"}`}>
                          {/* پیام متنی */}
                          {message.content && (
                            <div
                              className={`rounded-lg p-3 ${
                                message.user ? "bg-primary text-primary-foreground" : "bg-muted"
                              }`}
                            >
                              {message.content}
                            </div>
                          )}

                          {/* امبدها */}
                          {message.embeds && message.embeds.length > 0 && (
                            <div className="space-y-2">
                              {message.embeds.map((embed, index) => (
                                <div
                                  key={index}
                                  className="border rounded-lg p-3 min-w-[300px] space-y-2 border-r-4"
                                  style={{ borderRightColor: embed.color ? `#${embed.color.toString(16)}` : "#7289da" }}
                                >
                                  {embed.title && <div className="font-bold">{embed.title}</div>}
                                  {embed.description && <div className="text-sm">{embed.description}</div>}
                                  {embed.fields && embed.fields.length > 0 && (
                                    <div className="space-y-1 pt-2">
                                      {embed.fields.map((field: any, fieldIndex: number) => (
                                        <div key={fieldIndex} className="space-y-1">
                                          {field.name && <div className="font-semibold text-xs">{field.name}</div>}
                                          {field.value && <div className="text-xs">{field.value}</div>}
                                          {fieldIndex < embed.fields.length - 1 && <Separator className="my-1" />}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {embed.footer && (
                                    <div className="text-xs text-muted-foreground pt-1">{embed.footer.text}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* دکمه‌ها */}
                          {message.components && message.components.length > 0 && (
                            <div className="flex flex-col gap-2 pt-1 w-full">
                              {message.components.map((row: ButtonComponent, rowIndex: number) => (
                                <div key={rowIndex} className="flex flex-wrap gap-2">
                                  {row.components.map((button, buttonIndex) => (
                                    <Button
                                      key={buttonIndex}
                                      variant={getButtonStyle(button.style) as any}
                                      size="sm"
                                      disabled={button.disabled || isLoading}
                                      onClick={() => handleButtonClick(button.custom_id)}
                                    >
                                      {button.label}
                                    </Button>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter>
            <form
              className="flex w-full space-x-2"
              onSubmit={(e) => {
                e.preventDefault();
                sendCommand();
              }}
            >
              <Input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="دستور را وارد کنید (مثال: ccoin)"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "در حال ارسال..." : "ارسال"}
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}