import React, { useState, useEffect, useRef } from 'react';
import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  author: string;
  content: string;
  embeds?: any[];
  components?: any[];
  timestamp: Date;
}

interface ButtonComponent {
  type: number;
  components: {
    type: number;
    custom_id: string;
    label: string;
    style: number;
    disabled?: boolean;
    emoji?: {
      name: string;
    };
  }[];
}

export default function DiscordSimulator() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [userId, setUserId] = useState('123456789012345678'); // A sample Discord user ID
  const [username, setUsername] = useState('TestUser');
  const [botStatus, setBotStatus] = useState<{status: string, version: string, uptime: number} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check bot status
    async function checkStatus() {
      try {
        const status = await apiRequest({
          url: '/api/bot/status',
          method: 'GET',
        });
        setBotStatus(status as {status: string, version: string, uptime: number});
      } catch (err) {
        console.error('Failed to get bot status:', err);
        toast({
          title: 'Error',
          description: 'Failed to connect to Discord bot',
          variant: 'destructive',
        });
      }
    }
    
    checkStatus();
  }, [toast]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendCommand = async () => {
    if (!input.trim()) return;
    
    // Add user message to the chat
    const userMessage: Message = {
      id: Date.now().toString(),
      author: username,
      content: input,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Process command
    if (input.startsWith('/')) {
      // Handle slash commands
      const command = input.slice(1).split(' ')[0];
      
      try {
        // Simulate bot thinking
        const thinkingMessage: Message = {
          id: 'thinking-' + Date.now().toString(),
          author: 'Ccoin',
          content: '🤔 در حال پردازش...',
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, thinkingMessage]);
        
        // Wait a bit to simulate processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate command response based on the command
        if (command === 'menu') {
          // Simulate main menu response
          await simulateMainMenu();
        } else {
          // Generic response for other commands
          const botResponse: Message = {
            id: Date.now().toString(),
            author: 'Ccoin',
            content: `دستور /${command} اجرا شد.`,
            timestamp: new Date(),
          };
          
          setMessages(prev => {
            // Remove thinking message
            const filtered = prev.filter(m => m.id !== thinkingMessage.id);
            return [...filtered, botResponse];
          });
        }
      } catch (err) {
        console.error('Error processing command:', err);
        
        // Remove thinking message and add error message
        setMessages(prev => {
          const filtered = prev.filter(m => !m.id.startsWith('thinking-'));
          const errorMessage: Message = {
            id: Date.now().toString(),
            author: 'System',
            content: 'خطا در پردازش دستور. لطفا دوباره تلاش کنید.',
            timestamp: new Date(),
          };
          return [...filtered, errorMessage];
        });
      }
    } else {
      // Regular message
      // Bot response for regular messages
      const botResponse: Message = {
        id: Date.now().toString(),
        author: 'Ccoin',
        content: 'برای استفاده از دستورات ربات، از "/" استفاده کنید. مثال: /menu',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botResponse]);
    }
    
    setInput('');
  };

  const simulateMainMenu = async () => {
    const embed = {
      title: '🎮 منوی اصلی Ccoin',
      description: 'به ربات اقتصادی و بازی Ccoin خوش آمدید! لطفا یکی از گزینه‌های زیر را انتخاب کنید:',
      color: 0x3498db,
      fields: [
        {
          name: '💰 موجودی شما',
          value: '0 Ccoin',
          inline: true
        },
        {
          name: '🏦 حساب بانکی',
          value: '0 Ccoin',
          inline: true
        },
        {
          name: '💎 کریستال',
          value: '0 عدد',
          inline: true
        }
      ],
      footer: {
        text: 'Ccoin Discord Bot • /menu برای نمایش این منو'
      }
    };
    
    const components = [
      {
        type: 1, // ActionRow
        components: [
          {
            type: 2, // Button
            custom_id: 'economy',
            label: '💰 اقتصاد',
            style: 1 // PRIMARY
          },
          {
            type: 2,
            custom_id: 'games',
            label: '🎲 بازی‌ها',
            style: 3 // SUCCESS
          },
          {
            type: 2,
            custom_id: 'shop',
            label: '🛒 فروشگاه',
            style: 2 // SECONDARY
          }
        ]
      },
      {
        type: 1,
        components: [
          {
            type: 2,
            custom_id: 'inventory',
            label: '🎒 کوله‌پشتی',
            style: 2
          },
          {
            type: 2,
            custom_id: 'quests',
            label: '📜 ماموریت‌ها',
            style: 1
          },
          {
            type: 2,
            custom_id: 'clans',
            label: '👥 کلن‌ها',
            style: 3
          }
        ]
      },
      {
        type: 1,
        components: [
          {
            type: 2,
            custom_id: 'profile',
            label: '👤 پروفایل',
            style: 4 // DANGER
          },
          {
            type: 2,
            custom_id: 'wheel',
            label: '🎡 چرخ شانس',
            style: 3
          }
        ]
      },
      {
        type: 1,
        components: [
          {
            type: 2,
            custom_id: 'help',
            label: '📜 راهنما',
            style: 1
          },
          {
            type: 2,
            custom_id: 'other_options',
            label: '✨ موارد دیگر',
            style: 2
          }
        ]
      }
    ];
    
    const botResponse: Message = {
      id: Date.now().toString(),
      author: 'Ccoin',
      content: '',
      embeds: [embed],
      components: components,
      timestamp: new Date(),
    };
    
    setMessages(prev => {
      // Remove thinking message
      const filtered = prev.filter(m => !m.id.startsWith('thinking-'));
      return [...filtered, botResponse];
    });
  };

  const handleButtonClick = async (customId: string) => {
    // Add a "user clicked" message
    const userClick: Message = {
      id: Date.now().toString(),
      author: 'System',
      content: `کاربر دکمه "${customId}" را کلیک کرد`,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userClick]);
    
    // Simulate bot thinking
    const thinkingMessage: Message = {
      id: 'thinking-' + Date.now().toString(),
      author: 'Ccoin',
      content: '🤔 در حال پردازش...',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, thinkingMessage]);
    
    // Wait a bit to simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Handle different button actions
      if (customId === 'economy') {
        await simulateEconomyMenu();
      } else if (customId === 'games') {
        await simulateGamesMenu();
      } else if (customId === 'shop') {
        await simulateShopMenu();
      } else if (customId === 'inventory') {
        await simulateInventoryMenu();
      } else if (customId === 'other_options') {
        await simulateOtherOptionsMenu();
      } else if (customId === 'menu') {
        await simulateMainMenu();
      } else {
        // Generic response for other buttons
        const botResponse: Message = {
          id: Date.now().toString(),
          author: 'Ccoin',
          content: `دکمه ${customId} فشرده شد. این ویژگی هنوز در شبیه‌ساز پیاده‌سازی نشده است.`,
          timestamp: new Date(),
        };
        
        setMessages(prev => {
          // Remove thinking message
          const filtered = prev.filter(m => m.id !== thinkingMessage.id);
          return [...filtered, botResponse];
        });
      }
    } catch (err) {
      console.error('Error processing button click:', err);
      
      // Remove thinking message and add error message
      setMessages(prev => {
        const filtered = prev.filter(m => !m.id.startsWith('thinking-'));
        const errorMessage: Message = {
          id: Date.now().toString(),
          author: 'System',
          content: 'خطا در پردازش دکمه. لطفا دوباره تلاش کنید.',
          timestamp: new Date(),
        };
        return [...filtered, errorMessage];
      });
    }
  };

  const simulateEconomyMenu = async () => {
    const embed = {
      title: '💰 منوی اقتصادی Ccoin',
      description: 'در این بخش می‌توانید امور مالی خود را مدیریت کنید.',
      color: 0xf1c40f,
      fields: [
        {
          name: '💰 موجودی کیف پول',
          value: '0 Ccoin',
          inline: true
        },
        {
          name: '🏦 موجودی بانک',
          value: '0 Ccoin',
          inline: true
        },
        {
          name: '💎 کریستال',
          value: '0 عدد',
          inline: true
        }
      ],
      footer: {
        text: 'Ccoin Economy System'
      }
    };
    
    const components = [
      {
        type: 1,
        components: [
          {
            type: 2,
            custom_id: 'daily',
            label: '🎁 جایزه روزانه',
            style: 3
          },
          {
            type: 2,
            custom_id: 'deposit_menu',
            label: '💸 واریز به بانک',
            style: 1
          },
          {
            type: 2,
            custom_id: 'withdraw_menu',
            label: '💰 برداشت از بانک',
            style: 1
          }
        ]
      },
      {
        type: 1,
        components: [
          {
            type: 2,
            custom_id: 'transfer_menu',
            label: '📤 انتقال سکه',
            style: 2
          },
          {
            type: 2,
            custom_id: 'robbery',
            label: '🔫 سرقت',
            style: 4
          },
          {
            type: 2,
            custom_id: 'investment_menu',
            label: '📈 سرمایه‌گذاری',
            style: 1
          }
        ]
      },
      {
        type: 1,
        components: [
          {
            type: 2,
            custom_id: 'stocks',
            label: '📊 بازار سهام',
            style: 2
          },
          {
            type: 2,
            custom_id: 'menu',
            label: '🔙 بازگشت',
            style: 4
          }
        ]
      }
    ];
    
    const botResponse: Message = {
      id: Date.now().toString(),
      author: 'Ccoin',
      content: '',
      embeds: [embed],
      components: components,
      timestamp: new Date(),
    };
    
    setMessages(prev => {
      // Remove thinking message
      const filtered = prev.filter(m => !m.id.startsWith('thinking-'));
      return [...filtered, botResponse];
    });
  };

  const simulateGamesMenu = async () => {
    const embed = {
      title: '🎮 منوی بازی‌های Ccoin',
      description: 'در این بخش می‌توانید بازی کنید و سکه برنده شوید!',
      color: 0x2ecc71,
      fields: [
        {
          name: '💰 موجودی شما',
          value: '0 Ccoin',
          inline: true
        },
        {
          name: '🎯 شانس برد',
          value: 'متغیر بسته به نوع بازی',
          inline: true
        }
      ],
      footer: {
        text: 'Ccoin Games System'
      }
    };
    
    const components = [
      {
        type: 1,
        components: [
          {
            type: 2,
            custom_id: 'game:coinflip:start',
            label: '🪙 پرتاب سکه',
            style: 1
          },
          {
            type: 2,
            custom_id: 'game:rps:start',
            label: '✂️ سنگ کاغذ قیچی',
            style: 3
          },
          {
            type: 2,
            custom_id: 'game:numberguess:start',
            label: '🔢 حدس عدد',
            style: 2
          }
        ]
      },
      {
        type: 1,
        components: [
          {
            type: 2,
            custom_id: 'menu',
            label: '🔙 بازگشت',
            style: 4
          }
        ]
      }
    ];
    
    const botResponse: Message = {
      id: Date.now().toString(),
      author: 'Ccoin',
      content: '',
      embeds: [embed],
      components: components,
      timestamp: new Date(),
    };
    
    setMessages(prev => {
      // Remove thinking message
      const filtered = prev.filter(m => !m.id.startsWith('thinking-'));
      return [...filtered, botResponse];
    });
  };

  const simulateShopMenu = async () => {
    const embed = {
      title: '🛒 فروشگاه Ccoin',
      description: 'در اینجا می‌توانید آیتم‌های مختلف را خریداری کنید.',
      color: 0xe74c3c,
      fields: [
        {
          name: '💰 موجودی کیف پول',
          value: '0 Ccoin',
          inline: true
        },
        {
          name: '💎 کریستال',
          value: '0 عدد',
          inline: true
        }
      ],
      footer: {
        text: 'Ccoin Shop System'
      }
    };
    
    const components = [
      {
        type: 1,
        components: [
          {
            type: 2,
            custom_id: 'buy:1',
            label: '🛡️ سپر محافظ (100 سکه)',
            style: 1
          },
          {
            type: 2,
            custom_id: 'buy:2',
            label: '🎫 بلیط قرعه‌کشی (50 سکه)',
            style: 3
          }
        ]
      },
      {
        type: 1,
        components: [
          {
            type: 2,
            custom_id: 'buy:3',
            label: '🔮 طلسم شانس (200 سکه)',
            style: 2
          },
          {
            type: 2,
            custom_id: 'buy:4',
            label: '🧩 آیتم ویژه (10 کریستال)',
            style: 4
          }
        ]
      },
      {
        type: 1,
        components: [
          {
            type: 2,
            custom_id: 'menu',
            label: '🔙 بازگشت',
            style: 4
          }
        ]
      }
    ];
    
    const botResponse: Message = {
      id: Date.now().toString(),
      author: 'Ccoin',
      content: '',
      embeds: [embed],
      components: components,
      timestamp: new Date(),
    };
    
    setMessages(prev => {
      // Remove thinking message
      const filtered = prev.filter(m => !m.id.startsWith('thinking-'));
      return [...filtered, botResponse];
    });
  };

  const simulateInventoryMenu = async () => {
    const embed = {
      title: '🎒 کوله‌پشتی Ccoin',
      description: 'آیتم‌های موجود در کوله‌پشتی شما:',
      color: 0x9b59b6,
      fields: [
        {
          name: '📦 آیتم‌ها',
          value: 'شما هیچ آیتمی ندارید.',
          inline: false
        }
      ],
      footer: {
        text: 'Ccoin Inventory System'
      }
    };
    
    const components = [
      {
        type: 1,
        components: [
          {
            type: 2,
            custom_id: 'menu',
            label: '🔙 بازگشت',
            style: 4
          }
        ]
      }
    ];
    
    const botResponse: Message = {
      id: Date.now().toString(),
      author: 'Ccoin',
      content: '',
      embeds: [embed],
      components: components,
      timestamp: new Date(),
    };
    
    setMessages(prev => {
      // Remove thinking message
      const filtered = prev.filter(m => !m.id.startsWith('thinking-'));
      return [...filtered, botResponse];
    });
  };

  const simulateOtherOptionsMenu = async () => {
    const embed = {
      title: '✨ موارد دیگر Ccoin',
      description: 'ویژگی‌های اضافی و کمتر استفاده شده:',
      color: 0x34495e,
      footer: {
        text: 'Ccoin Options System'
      }
    };
    
    const components = [
      {
        type: 1,
        components: [
          {
            type: 2,
            custom_id: 'marketplace',
            label: '🏪 بازار',
            style: 1
          },
          {
            type: 2,
            custom_id: 'tournaments',
            label: '🏁 تورنمنت‌ها',
            style: 4
          },
          {
            type: 2,
            custom_id: 'achievements',
            label: '🎖️ دستاوردها',
            style: 3
          }
        ]
      },
      {
        type: 1,
        components: [
          {
            type: 2,
            custom_id: 'seasons',
            label: '🏆 فصل‌ها',
            style: 3
          },
          {
            type: 2,
            custom_id: 'parallel_worlds',
            label: '🌀 جهان‌های موازی',
            style: 1
          },
          {
            type: 2,
            custom_id: 'calendar',
            label: '📅 تقویم',
            style: 4
          }
        ]
      },
      {
        type: 1,
        components: [
          {
            type: 2,
            custom_id: 'lottery',
            label: '🎟️ قرعه‌کشی',
            style: 2
          },
          {
            type: 2,
            custom_id: 'giveaway_bridge',
            label: '🎮 قرعه‌کشی گیواوی',
            style: 1
          }
        ]
      },
      {
        type: 1,
        components: [
          {
            type: 2,
            custom_id: 'menu',
            label: '🔙 بازگشت به منوی اصلی',
            style: 4
          }
        ]
      }
    ];
    
    const botResponse: Message = {
      id: Date.now().toString(),
      author: 'Ccoin',
      content: '',
      embeds: [embed],
      components: components,
      timestamp: new Date(),
    };
    
    setMessages(prev => {
      // Remove thinking message
      const filtered = prev.filter(m => !m.id.startsWith('thinking-'));
      return [...filtered, botResponse];
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold text-center">شبیه‌ساز ربات دیسکورد Ccoin</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>چت دیسکورد</CardTitle>
              <CardDescription>
                با ربات تعامل کنید. از دستور <code>/menu</code> برای شروع استفاده کنید.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] overflow-y-auto border rounded-md p-4 bg-gray-100 dark:bg-gray-900">
                {messages.length === 0 ? (
                  <p className="text-center text-gray-500 mt-10">
                    پیامی وجود ندارد. با تایپ <code>/menu</code> شروع کنید.
                  </p>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="mb-4">
                      <div className="flex items-start">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                          {message.author === 'Ccoin' ? 'C' : message.author[0]}
                        </div>
                        <div className="ml-2">
                          <div className="flex items-center">
                            <span className="font-bold">
                              {message.author}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          {message.content && (
                            <div className="mt-1">{message.content}</div>
                          )}
                          
                          {message.embeds && message.embeds.length > 0 && (
                            <div className="mt-2 border-l-4 pl-2 py-1" style={{ borderColor: `#${message.embeds[0].color.toString(16)}` }}>
                              <div className="font-bold">{message.embeds[0].title}</div>
                              <div className="text-sm">{message.embeds[0].description}</div>
                              {message.embeds[0].fields && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                                  {message.embeds[0].fields.map((field: any, idx: number) => (
                                    <div key={idx} className={`${field.inline ? "col-span-1" : "col-span-full"} p-1 bg-gray-200 dark:bg-gray-800 rounded`}>
                                      <div className="text-xs font-bold">{field.name}</div>
                                      <div className="text-xs">{field.value}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {message.embeds[0].footer && (
                                <div className="text-xs text-gray-500 mt-2">
                                  {message.embeds[0].footer.text}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {message.components && message.components.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {message.components.map((row: ButtonComponent, rowIdx: number) => (
                                <div key={rowIdx} className="flex flex-wrap gap-2">
                                  {row.components.map((button, buttonIdx) => {
                                    // Map Discord button styles to Tailwind classes
                                    let buttonStyle = "bg-blue-500 hover:bg-blue-600"; // Default for PRIMARY
                                    if (button.style === 2) buttonStyle = "bg-gray-500 hover:bg-gray-600"; // SECONDARY
                                    if (button.style === 3) buttonStyle = "bg-green-500 hover:bg-green-600"; // SUCCESS
                                    if (button.style === 4) buttonStyle = "bg-red-500 hover:bg-red-600"; // DANGER
                                    
                                    return (
                                      <button
                                        key={buttonIdx}
                                        className={`px-3 py-1 text-white rounded text-sm ${buttonStyle} ${button.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onClick={() => !button.disabled && handleButtonClick(button.custom_id)}
                                        disabled={button.disabled}
                                      >
                                        {button.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
            <CardFooter className="flex items-center space-x-2">
              <Input
                placeholder="پیام خود را وارد کنید یا از / برای دستورات استفاده کنید..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendCommand()}
                className="flex-1"
              />
              <Button onClick={handleSendCommand}>ارسال</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>تنظیمات شبیه‌ساز</CardTitle>
              <CardDescription>
                اطلاعات کاربر و وضعیت ربات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="username">نام کاربری</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="userId">آیدی کاربر</Label>
                <Input
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
              
              <div className="pt-4">
                <h3 className="font-medium mb-2">وضعیت ربات:</h3>
                {botStatus ? (
                  <div className="text-sm space-y-1">
                    <p><strong>وضعیت:</strong> {botStatus.status}</p>
                    <p><strong>نسخه:</strong> {botStatus.version}</p>
                    <p><strong>زمان کارکرد:</strong> {Math.floor(botStatus.uptime / 60)} دقیقه</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">در حال بارگذاری وضعیت ربات...</p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  setMessages([]);
                  toast({
                    title: "گفتگو پاک شد",
                    description: "تاریخچه گفتگو با موفقیت پاک شد.",
                  });
                }}
              >
                پاک کردن تاریخچه گفتگو
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}