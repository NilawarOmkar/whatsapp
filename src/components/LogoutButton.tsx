"use client";
import { useRouter } from 'next/navigation';
import { Power } from 'lucide-react';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push('/');
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 mr-2 transition-colors"
    >
      <Power className="h-5 w-5" />
    </button>
  );
}