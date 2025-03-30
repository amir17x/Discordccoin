#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
این اسکریپت نحوه استفاده از فایل CSV برای آموزش و fine-tuning مدل Gemini AI برای CCoin را نشان می‌دهد
شما باید کلید API Gemini خود را از سایت Google AI Studio دریافت کنید
"""

import os
import json
import pandas as pd
from dotenv import load_dotenv
import google.generativeai as genai

# بارگیری متغیرهای محیطی
load_dotenv()

# تنظیم کلید API
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("کلید API Gemini یافت نشد. لطفاً فایل .env را با کلید GEMINI_API_KEY تنظیم کنید.")

genai.configure(api_key=api_key)

def load_training_data_from_csv(csv_file_path):
    """
    بارگیری داده‌های آموزشی از فایل CSV
    """
    try:
        df = pd.read_csv(csv_file_path)
        
        # بررسی وجود ستون‌های مورد نیاز
        if 'text_input' not in df.columns or 'output' not in df.columns:
            raise ValueError("فایل CSV باید دارای ستون‌های 'text_input' و 'output' باشد.")
        
        # تبدیل به فرمت مورد نیاز برای API
        training_data = []
        for index, row in df.iterrows():
            training_data.append({
                "text_input": row['text_input'],
                "output": row['output']
            })
        
        print(f"تعداد {len(training_data)} نمونه آموزشی بارگیری شد.")
        
        # نمایش نمونه‌های ابتدایی
        print("\nنمونه‌های آموزشی:")
        for i in range(min(3, len(training_data))):
            print(f"\nنمونه {i+1}:")
            print(f"سؤال: {training_data[i]['text_input']}")
            print(f"پاسخ: {training_data[i]['output'][:100]}...")
        
        return training_data
    
    except Exception as e:
        print(f"خطا در بارگیری داده‌های آموزشی: {e}")
        return None

def create_tuned_model(training_data):
    """
    ایجاد یک مدل fine-tuned با استفاده از داده‌های آموزشی
    """
    try:
        # ایجاد مدل
        tuning_job = genai.create_tuning_job(
            source_model="gemini-1.5-pro-001",  # مدل پایه
            training_data=training_data,
            display_name="CCoinAI",
            description="مدل آموزش‌دیده CCoin برای پاسخگویی به سؤالات مرتبط با ربات دیسکورد",
            output_directory=None,  # در صورت نیاز مسیر ذخیره‌سازی را مشخص کنید
        )
        
        print(f"\nفرآیند آموزش با شناسه {tuning_job.id} آغاز شد.")
        print("این فرآیند ممکن است چند دقیقه تا چند ساعت طول بکشد.")
        print(f"وضعیت فعلی: {tuning_job.state}")
        
        # ذخیره اطلاعات مدل در یک فایل برای استفاده‌های بعدی
        with open("tuned_model_info.json", "w", encoding="utf-8") as f:
            json.dump({
                "model_id": tuning_job.id,
                "display_name": "CCoinAI",
                "created_at": str(tuning_job.create_time)
            }, f, ensure_ascii=False, indent=2)
        
        print("\nاطلاعات مدل در فایل tuned_model_info.json ذخیره شد.")
        
        # برگرداندن شناسه مدل برای استفاده‌های بعدی
        return tuning_job.id
    
    except Exception as e:
        print(f"خطا در ایجاد مدل fine-tuned: {e}")
        return None

def test_tuned_model(model_name):
    """
    تست مدل fine-tuned با چند پرسش نمونه
    """
    try:
        # ایجاد نمونه مدل
        model = genai.GenerativeModel(model_name)
        
        # چند سؤال نمونه برای تست
        test_questions = [
            "سلام! CCoin چیست؟",
            "چگونه می‌توانم سکه‌های بیشتری به دست بیاورم؟",
            "دستور /daily چه کاری انجام می‌دهد؟",
            "سیستم دوستی در CCoin چگونه کار می‌کند؟",
            "مینی‌گیم‌های CCoin کدام‌ها هستند؟"
        ]
        
        print("\n===== تست مدل آموزش‌دیده =====")
        
        # تست هر سؤال
        for i, question in enumerate(test_questions):
            print(f"\nسؤال {i+1}: {question}")
            response = model.generate_content(question)
            print(f"پاسخ: {response.text[:200]}...")
            print("-" * 50)
        
        print("\nتست مدل به پایان رسید.")
    
    except Exception as e:
        print(f"خطا در تست مدل: {e}")

def main():
    print("===== آموزش مدل CCoinAI با استفاده از Google Gemini API =====\n")
    
    # بارگیری داده‌های آموزشی
    csv_path = "ccoin_ai_training_updated.csv"
    training_data = load_training_data_from_csv(csv_path)
    
    if not training_data:
        print("بارگیری داده‌های آموزشی ناموفق بود. لطفاً فایل CSV را بررسی کنید.")
        return
    
    # پرسیدن از کاربر برای ادامه
    proceed = input("\nآیا می‌خواهید با آموزش مدل ادامه دهید؟ (بله/خیر): ")
    
    if proceed.lower() not in ["بله", "y", "yes"]:
        print("فرآیند آموزش لغو شد.")
        return
    
    # ایجاد مدل fine-tuned
    model_id = create_tuned_model(training_data)
    
    if not model_id:
        print("ایجاد مدل fine-tuned ناموفق بود.")
        return
    
    print("\nمدل با موفقیت ایجاد شد و فرآیند آموزش آغاز شد.")
    print("لطفاً به پنل Google AI Studio مراجعه کنید تا از وضعیت آموزش مطلع شوید.")
    
    # اطلاعات برای تست بعدی
    print("\n===== برای تست مدل پس از اتمام آموزش =====")
    print(f"نام کامل مدل: gemini-1.5-pro-001-tuned_{model_id}")
    print("برای تست مدل، کد زیر را اجرا کنید:")
    print(f"python ccoin_ai_tuning.py --test gemini-1.5-pro-001-tuned_{model_id}")

if __name__ == "__main__":
    import sys
    
    # بررسی آرگومان‌های خط فرمان برای تست مدل
    if len(sys.argv) > 2 and sys.argv[1] == "--test":
        model_name = sys.argv[2]
        test_tuned_model(model_name)
    else:
        main()