import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Admin() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Redirect to admin login
    window.location.href = '/admin/login';
  }, [setLocation]);
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">درحال انتقال به پنل مدیریت...</h1>
        <p>لطفاً صبر کنید...</p>
      </div>
    </div>
  );
}