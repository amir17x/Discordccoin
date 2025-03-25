#!/bin/bash

# Replace main lottery icon
sed -i '66s|.setThumbnail.*|.setThumbnail('"'"'https://img.icons8.com/fluency/48/lottery.png'"'"'); // آیکون lottery برای قرعه‌کشی|' server/discord/components/lotteryMenu.ts

# Replace active lotteries icon
sed -i '138s|.setThumbnail.*|.setThumbnail('"'"'https://img.icons8.com/fluency/48/lottery.png'"'"'); // آیکون lottery برای قرعه‌کشی‌های فعال|' server/discord/components/lotteryMenu.ts

# Replace history icon 
sed -i '209s|.setThumbnail.*|.setThumbnail('"'"'https://img.icons8.com/fluency/48/transaction-list.png'"'"'); // آیکون transaction-list برای تاریخچه|' server/discord/components/lotteryMenu.ts

# Replace info/help icon
sed -i '261s|.setThumbnail.*|.setThumbnail('"'"'https://img.icons8.com/fluency/48/help.png'"'"'); // آیکون help برای راهنما|' server/discord/components/lotteryMenu.ts

# Replace success icon
sed -i '430s|.setThumbnail.*|.setThumbnail('"'"'https://img.icons8.com/fluency/48/task-completed.png'"'"'); // آیکون task-completed برای موفقیت|' server/discord/components/lotteryMenu.ts

chmod +x update_lottery_icons.sh
./update_lottery_icons.sh
