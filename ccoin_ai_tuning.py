"""
این اسکریپت نحوه استفاده از فایل CSV برای آموزش و fine-tuning مدل Gemini AI برای CCoin را نشان می‌دهد
شما باید کلید API Gemini خود را از سایت Google AI Studio دریافت کنید
"""

import csv
import os
from google import genai
from google.genai import types

# تنظیم کلید API 
API_KEY = "YOUR_GEMINI_API_KEY"  # کلید API خود را اینجا قرار دهید
os.environ["GOOGLE_API_KEY"] = API_KEY
genai.configure(api_key=API_KEY)

def load_training_data_from_csv(csv_file_path):
    """
    بارگیری داده‌های آموزشی از فایل CSV
    """
    training_data = []
    
    with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            # ایجاد یک نمونه آموزشی از هر ردیف CSV
            training_data.append([row['text_input'], row['output']])
    
    return training_data

def create_tuned_model(training_data):
    """
    ایجاد یک مدل fine-tuned با استفاده از داده‌های آموزشی
    """
    client = genai.Client()
    
    # تبدیل داده‌های آموزشی به فرمت مورد نیاز API
    tuning_dataset = types.TuningDataset(
        examples=[
            types.TuningExample(
                text_input=i,
                output=o,
            )
            for i, o in training_data
        ],
    )
    
    # ایجاد یک tuning job
    tuning_job = client.tunings.tune(
        base_model='models/gemini-1.5-flash-001-tuning',
        training_dataset=tuning_dataset,
        config=types.CreateTuningJobConfig(
            epoch_count=5,  # تعداد دوره‌های آموزش
            batch_size=4,   # اندازه دسته
            learning_rate=0.001,  # نرخ یادگیری
            tuned_model_display_name="CCoin AI Assistant"  # نام نمایشی مدل
        )
    )
    
    print(f"آموزش مدل شروع شد. شناسه tuning job: {tuning_job.name}")
    print(f"نام مدل fine-tuned: {tuning_job.tuned_model.model}")
    
    return tuning_job

def test_tuned_model(model_name):
    """
    تست مدل fine-tuned با چند پرسش نمونه
    """
    client = genai.Client()
    
    test_questions = [
        "سلام، من تازه به سرور پیوستم. چطور می‌توانم شروع کنم؟",
        "چگونه می‌توانم سکه بیشتری به دست آورم؟",
        "کریستال چیست و چه کاربردی دارد؟",
        "قابلیت‌های جدید نوتیفیکیشن‌های اقتصادی را توضیح دهید.",
    ]
    
    print("\n=== تست مدل fine-tuned ===\n")
    
    for question in test_questions:
        response = client.models.generate_content(
            model=model_name,
            contents=question
        )
        
        print(f"سوال: {question}")
        print(f"پاسخ: {response.text}")
        print("-" * 50)

def main():
    csv_file_path = 'ccoin_ai_training.csv'
    
    # بارگیری داده‌های آموزشی
    print("در حال بارگیری داده‌های آموزشی از فایل CSV...")
    training_data = load_training_data_from_csv(csv_file_path)
    print(f"{len(training_data)} نمونه آموزشی بارگیری شد.")
    
    # پیش‌نمایش چند نمونه از داده‌های آموزشی
    print("\n=== پیش‌نمایش داده‌های آموزشی ===\n")
    for i, (input_text, output_text) in enumerate(training_data[:3]):
        print(f"نمونه {i+1}:")
        print(f"ورودی: {input_text[:50]}...")
        print(f"خروجی: {output_text[:50]}...")
        print("-" * 50)
    
    # آموزش مدل
    print("\nآیا می‌خواهید فرآیند آموزش مدل را شروع کنید؟ (y/n)")
    choice = input()
    
    if choice.lower() == 'y':
        print("\nدر حال آموزش مدل... (این فرآیند ممکن است چند دقیقه طول بکشد)")
        tuning_job = create_tuned_model(training_data)
        
        # تست مدل آموزش دیده
        print("\nآیا می‌خواهید مدل آموزش دیده را تست کنید؟ (y/n)")
        test_choice = input()
        
        if test_choice.lower() == 'y':
            test_tuned_model(tuning_job.tuned_model.model)
    else:
        print("فرآیند آموزش لغو شد.")

if __name__ == "__main__":
    main()