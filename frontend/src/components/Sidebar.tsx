'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Settings, 
  LogOut,
  ShieldAlert,
  Activity,
  SlidersHorizontal,
  GitMerge,
  FileText,
  Bell,
  CheckSquare
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Predict Risk', href: '/dashboard/predict', icon: Activity },
  { name: 'What-If Simulator', href: '/dashboard/what-if', icon: SlidersHorizontal },
  { name: 'Employees', href: '/dashboard/employees', icon: Users },
  { name: 'Compare', href: '/dashboard/compare', icon: GitMerge },
  { name: 'Meetings', href: '/dashboard/meetings', icon: Calendar },
  { name: 'Follow-ups', href: '/dashboard/followups', icon: CheckSquare },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex flex-col w-64 bg-card border-r border-border min-h-screen relative z-20 shadow-sm">
      <div className="flex items-center justify-center h-16 border-b border-border px-4">
        <ShieldAlert className="w-6 h-6 text-primary mr-2" />
        <span className="text-xl font-bold text-foreground tracking-tight">RetainIQ</span>
      </div>
      
      <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                isActive 
                  ? 'bg-primary/10 text-primary shadow-sm' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              {item.name}
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-muted-foreground rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors group"
        >
          <LogOut className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-destructive transition-colors" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
