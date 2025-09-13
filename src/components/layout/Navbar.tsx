import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, User, LogOut, Settings2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { CustomThemeToggle } from "@/components/ui/custom-theme-toggle";
import DevDashLogo from "@/components/ui/DevDashLogo";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { StaticBorderTrail } from "@/components/ui/static-border-trail";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            // If profile doesn't exist, create one
            if (error.code === 'PGRST116') {
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: user.id,
                  full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                  email: user.email,
                  avatar_url: user.user_metadata?.avatar_url,
                  username: user.email?.split('@')[0] || '',
                  bio: '',
                  github_username: '',
                  leetcode_username: '',
                  is_profile_public: true
                })
                .select()
                .single();

              if (createError) {
                console.error('Error creating profile:', createError);
              } else {
                setProfile(newProfile);
              }
            } else {
              console.error('Error fetching profile:', error);
            }
          } else {
            setProfile(data);
          }
        } catch (err) {
          console.error('Error:', err);
        }
      }
    };

    fetchProfile();
  }, [user?.id, user?.email, user?.user_metadata]);
  
  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to sign out",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Signed out successfully"
        });
        navigate("/");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Get display name with fallback
  const getDisplayName = () => {
    return profile?.full_name || profile?.username || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  };

  // Get avatar URL with fallback
  const getAvatarUrl = () => {
    return profile?.avatar_url || user?.user_metadata?.avatar_url || null;
  };
  
  return (
    <StaticBorderTrail 
      className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur"
      style={{
        boxShadow: "0px 0px 20px 10px rgb(255 255 255 / 20%), 0 0 40px 20px rgb(0 0 0 / 30%)",
        background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.1), transparent)"
      }}
    >
      <header>
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="flex items-center">
            <DevDashLogo size="md" showText={true} />
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <CustomThemeToggle />
          
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={getAvatarUrl()} 
                    alt={getDisplayName()} 
                  />
                  <AvatarFallback>
                    {getInitials(getDisplayName())}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-base font-medium leading-none">
                    {getDisplayName()}
                  </p>
                  <p className="text-sm leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link to="/profile">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
              </Link>
              <Link to="/settings">
                <DropdownMenuItem>
                  <Settings2 className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      </header>
    </StaticBorderTrail>
  );
};

export default Navbar;
