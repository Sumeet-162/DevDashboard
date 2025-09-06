
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  Newspaper, 
  Github, 
  Code2, 
  Users, 
  Settings2,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Clock,
  StickyNote,
  Calendar,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { 
    title: "Dashboard", 
    icon: LayoutDashboard, 
    href: "/dashboard" 
  },
  { 
    title: "Tech News", 
    icon: Newspaper, 
    href: "/news" 
  },
  { 
    title: "GitHub", 
    icon: Github, 
    href: "/github" 
  },
  { 
    title: "LeetCode", 
    icon: Code2, 
    href: "/leetcode" 
  },
  { 
    title: "Community", 
    icon: Users, 
    href: "/community" 
  }
];

const productivityItems = [
  {
    title: "To-Do List",
    icon: CheckSquare,
    href: "/productivity/todo"
  },
  {
    title: "Pomodoro Timer",
    icon: Clock,
    href: "/productivity/pomodoro"
  },
  {
    title: "Quick Notes",
    icon: StickyNote,
    href: "/productivity/notes"
  },
  {
    title: "Dev Calendar",
    icon: Calendar,
    href: "/productivity/calendar"
  }
];

const settingsItems = [
  { 
    title: "Settings", 
    icon: Settings2, 
    href: "/settings" 
  }
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if screen is mobile size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return (
    <div className={cn(
      "flex flex-col h-screen border-r bg-background transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center justify-between p-4 border-b h-16">
        {!collapsed && <h2 className="font-bold">DevDash</h2>}
        {!isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-auto" 
            onClick={() => setCollapsed(prev => !prev)}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        )}
      </div>
      
      <div className="flex-1 py-4 overflow-auto">
        <nav className="space-y-6 px-2">
          {/* Main Navigation */}
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                  window.location.pathname === item.href ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            ))}
          </div>

          {/* Productivity Section */}
          <div className="space-y-1">
            {!collapsed && (
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Zap size={14} />
                <span>Productivity</span>
              </div>
            )}
            {collapsed && (
              <div className="flex justify-center px-3 py-2">
                <Zap size={16} className="text-muted-foreground" />
              </div>
            )}
            {productivityItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                  window.location.pathname === item.href ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            ))}
          </div>

          {/* Settings */}
          <div className="space-y-1">
            {settingsItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                  window.location.pathname === item.href ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
