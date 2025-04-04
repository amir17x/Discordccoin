#!/bin/bash

# دایرکتوری پایه برای جستجو
BASE_DIR="server"

# پیدا کردن تمام فایل‌های TypeScript که شامل کلمه ephemeral هستند
FILES=$(grep -l "ephemeral: true" --include="*.ts" -r $BASE_DIR)

# شمارنده برای فایل‌های تغییر یافته
COUNTER=0

for FILE in $FILES; do
  echo "Processing file: $FILE"
  
  # جایگزینی با استفاده از sed
  # تغییر ', ephemeral: true' به ', flags: { ephemeral: true }'
  sed -i 's/\(reply\|followUp\)([^)]*\)\(,\s*ephemeral:\s*true\)/\1, flags: { ephemeral: true }/g' "$FILE"
  
  # اگر تغییر اعمال شده، شمارنده را افزایش می‌دهیم
  if [ $? -eq 0 ]; then
    ((COUNTER++))
  fi
done

echo "Fixed $COUNTER files with ephemeral deprecation issues."