#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
اسکریپت تبدیل فرمت‌های داده آموزشی CCoinAI
این اسکریپت فایل‌های CSV، JSON و JSONL را به یکدیگر تبدیل می‌کند
"""

import csv
import json
import argparse
import sys
import codecs

def csv_to_json(csv_file_path, json_file_path):
    """تبدیل فایل CSV به JSON"""
    data = []
    
    with open(csv_file_path, 'r', encoding='utf-8') as csv_file:
        # حذف BOM اگر وجود داشته باشد
        csv_content = csv_file.read()
        if csv_content.startswith('\ufeff'):
            csv_content = csv_content[1:]
        
        # خواندن و تبدیل به JSON
        csv_reader = csv.DictReader(csv_content.splitlines())
        for row in csv_reader:
            data.append(row)
    
    with open(json_file_path, 'w', encoding='utf-8') as json_file:
        json.dump(data, json_file, ensure_ascii=False, indent=2)
    
    print(f"فایل JSON با موفقیت در {json_file_path} ذخیره شد.")

def csv_to_jsonl(csv_file_path, jsonl_file_path):
    """تبدیل فایل CSV به JSONL"""
    with open(csv_file_path, 'r', encoding='utf-8') as csv_file:
        # حذف BOM اگر وجود داشته باشد
        csv_content = csv_file.read()
        if csv_content.startswith('\ufeff'):
            csv_content = csv_content[1:]
        
        # خواندن و تبدیل به JSONL
        csv_reader = csv.DictReader(csv_content.splitlines())
        
        with open(jsonl_file_path, 'w', encoding='utf-8') as jsonl_file:
            for row in csv_reader:
                jsonl_file.write(json.dumps(row, ensure_ascii=False) + '\n')
    
    print(f"فایل JSONL با موفقیت در {jsonl_file_path} ذخیره شد.")

def json_to_csv(json_file_path, csv_file_path, add_bom=True):
    """تبدیل فایل JSON به CSV"""
    with open(json_file_path, 'r', encoding='utf-8') as json_file:
        data = json.load(json_file)
    
    # تعیین فیلدها
    fields = data[0].keys() if data else []
    
    # نوشتن با یا بدون BOM
    mode = 'wb' if add_bom else 'w'
    
    if add_bom:
        with open(csv_file_path, mode) as f:
            f.write(codecs.BOM_UTF8)
        with open(csv_file_path, 'a', newline='', encoding='utf-8') as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=fields)
            writer.writeheader()
            writer.writerows(data)
    else:
        with open(csv_file_path, 'w', newline='', encoding='utf-8') as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=fields)
            writer.writeheader()
            writer.writerows(data)
    
    print(f"فایل CSV با موفقیت در {csv_file_path} ذخیره شد.")

def jsonl_to_json(jsonl_file_path, json_file_path):
    """تبدیل فایل JSONL به JSON"""
    data = []
    
    with open(jsonl_file_path, 'r', encoding='utf-8') as jsonl_file:
        for line in jsonl_file:
            data.append(json.loads(line))
    
    with open(json_file_path, 'w', encoding='utf-8') as json_file:
        json.dump(data, json_file, ensure_ascii=False, indent=2)
    
    print(f"فایل JSON با موفقیت در {json_file_path} ذخیره شد.")

def jsonl_to_csv(jsonl_file_path, csv_file_path, add_bom=True):
    """تبدیل فایل JSONL به CSV"""
    data = []
    
    with open(jsonl_file_path, 'r', encoding='utf-8') as jsonl_file:
        for line in jsonl_file:
            data.append(json.loads(line))
    
    # تعیین فیلدها
    fields = data[0].keys() if data else []
    
    # نوشتن با یا بدون BOM
    mode = 'wb' if add_bom else 'w'
    
    if add_bom:
        with open(csv_file_path, mode) as f:
            f.write(codecs.BOM_UTF8)
        with open(csv_file_path, 'a', newline='', encoding='utf-8') as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=fields)
            writer.writeheader()
            writer.writerows(data)
    else:
        with open(csv_file_path, 'w', newline='', encoding='utf-8') as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=fields)
            writer.writeheader()
            writer.writerows(data)
    
    print(f"فایل CSV با موفقیت در {csv_file_path} ذخیره شد.")

def json_to_jsonl(json_file_path, jsonl_file_path):
    """تبدیل فایل JSON به JSONL"""
    with open(json_file_path, 'r', encoding='utf-8') as json_file:
        data = json.load(json_file)
    
    with open(jsonl_file_path, 'w', encoding='utf-8') as jsonl_file:
        for item in data:
            jsonl_file.write(json.dumps(item, ensure_ascii=False) + '\n')
    
    print(f"فایل JSONL با موفقیت در {jsonl_file_path} ذخیره شد.")

def main():
    parser = argparse.ArgumentParser(description='تبدیل فرمت‌های داده آموزشی CCoinAI')
    
    parser.add_argument('--from-format', choices=['csv', 'json', 'jsonl'], required=True,
                        help='فرمت فایل ورودی')
    parser.add_argument('--to-format', choices=['csv', 'json', 'jsonl'], required=True,
                        help='فرمت فایل خروجی')
    parser.add_argument('--input-file', required=True, help='مسیر فایل ورودی')
    parser.add_argument('--output-file', required=True, help='مسیر فایل خروجی')
    parser.add_argument('--add-bom', action='store_true', help='افزودن BOM به فایل CSV خروجی')
    
    args = parser.parse_args()
    
    if args.from_format == args.to_format:
        print("فرمت‌های ورودی و خروجی یکسان هستند. نیازی به تبدیل نیست.")
        return
    
    try:
        if args.from_format == 'csv' and args.to_format == 'json':
            csv_to_json(args.input_file, args.output_file)
        
        elif args.from_format == 'csv' and args.to_format == 'jsonl':
            csv_to_jsonl(args.input_file, args.output_file)
        
        elif args.from_format == 'json' and args.to_format == 'csv':
            json_to_csv(args.input_file, args.output_file, args.add_bom)
        
        elif args.from_format == 'json' and args.to_format == 'jsonl':
            json_to_jsonl(args.input_file, args.output_file)
        
        elif args.from_format == 'jsonl' and args.to_format == 'json':
            jsonl_to_json(args.input_file, args.output_file)
        
        elif args.from_format == 'jsonl' and args.to_format == 'csv':
            jsonl_to_csv(args.input_file, args.output_file, args.add_bom)
        
        else:
            print(f"تبدیل از {args.from_format} به {args.to_format} پشتیبانی نمی‌شود.")
    
    except Exception as e:
        print(f"خطا در تبدیل فایل: {e}")
        return

if __name__ == "__main__":
    main()