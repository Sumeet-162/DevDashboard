
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  Newspaper, 
  Github, 
  Code, 
  MessageSquare, 
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { 
    title: "Dashboard", 
    icon: LayoutDashboard, 
    href: "/" 
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
    icon: Code, 
    href: "/leetcode" 
  },
  { 
    title: "Community", 
    icon: MessageSquare, 
    href: "/community" 
  },
  { 
    title: "Settings", 
    icon: Settings, 
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
      <div className="flex items-center justify-between p-4 border-b">
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
        <nav className="space-y-1 px-2">
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
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
