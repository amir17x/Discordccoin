#!/usr/bin/env python3
import os
import re
import sys

# تابع برای اصلاح فایل‌های TypeScript
def fix_ephemeral_in_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # الگوی جستجو برای پیدا کردن پارامتر ephemeral در تمام متدهای reply و followUp
    pattern = r'(await\s+interaction\.(reply|followUp)\(\s*\{[^}]*)(,\s*ephemeral:\s*true)([^}]*\}\))'
    
    # جایگزینی با استفاده از flags
    replacement = r'\1\4'
    
    # بررسی وجود الگو در فایل
    if re.search(pattern, content):
        # پیدا کردن همه موارد و اصلاح آنها
        matches = re.findall(pattern, content)
        for match in matches:
            old_text = match[0] + match[2] + match[3]
            # اگر flags وجود ندارد، اضافه کنیم
            if 'flags:' not in old_text:
                new_text = match[0] + ', flags: { ephemeral: true }' + match[3]
                content = content.replace(old_text, new_text)
        
        # ذخیره فایل اصلاح شده
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(content)
        
        return True
    
    return False

# تابع برای اصلاح فایل‌های TypeScript در یک دایرکتوری به صورت بازگشتی
def fix_ephemeral_in_directory(directory):
    files_fixed = 0
    
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.ts'):
                file_path = os.path.join(root, file)
                if fix_ephemeral_in_file(file_path):
                    print(f"Fixed: {file_path}")
                    files_fixed += 1
    
    return files_fixed

if __name__ == "__main__":
    if len(sys.argv) > 1:
        directory = sys.argv[1]
    else:
        directory = "server"
    
    fixed_count = fix_ephemeral_in_directory(directory)
    print(f"Fixed {fixed_count} files.")