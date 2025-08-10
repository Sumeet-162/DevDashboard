import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lock, MapPin, User, Github, ExternalLink, Trophy, FolderOpen, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { filterPrivateProfile, getProfileDisplayName, isProfileAccessible } from "@/lib/utils";
import { PrivateProfileCard } from "./PrivateProfileCard";

interface PublicProfileViewProps {
  userId: string;
  currentUserId?: string;
}

export const PublicProfileView = ({ userId, currentUserId }: PublicProfileViewProps) => {
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwner = currentUserId === userId;

  useEffect(() => {
    loadProfileData();
  }, [userId]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Filter profile data based on privacy settings
      const filteredProfile = filterPrivateProfile(profileData, isOwner);
      setProfile(filteredProfile);

      // Only load projects and achievements if profile is accessible
      if (isProfileAccessible(profileData, currentUserId)) {
        // Load projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('user_projects')
          .select('*')
          .eq('user_id', userId)
          .order('display_order', { ascending: true });

        if (!projectsError) {
          setProjects(projectsData || []);
        }

        // Load achievements
        const { data: achievementsData, error: achievementsError } = await supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!achievementsError) {
          setAchievements(achievementsData || []);
        }
      }

    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <Skeleton className="h-20 w-20 rounded-full mx-auto" />
            <Skeleton className="h-6 w-32 mx-auto" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <p className="text-destructive">Error loading profile</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <User className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Profile not found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If it's a private profile and not the owner, show limited view
  if (!profile.is_profile_public && !isOwner) {
    return (
      <div className="max-w-2xl mx-auto">
        <PrivateProfileCard profile={profile} isOwner={isOwner} />
      </div>
    );
  }

  // Full profile view for public profiles or owner
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <PrivateProfileCard profile={profile} isOwner={isOwner} />

      {/* Projects Section */}
      {projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Projects ({projects.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.slice(0, 6).map((project) => (
                <Card key={project.id} className="overflow-hidden">
                  {project.image_url && (
                    <div className="h-32 overflow-hidden">
                      <img 
                        src={project.image_url} 
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate">{project.title}</h3>
                        {project.is_featured && (
                          <Badge variant="secondary" className="text-xs">Featured</Badge>
                        )}
                      </div>
                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <div className="flex gap-2">
                        {project.source_code_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={project.source_code_url} target="_blank" rel="noopener noreferrer">
                              <Github className="h-3 w-3 mr-1" />
                              Code
                            </a>
                          </Button>
                        )}
                        {project.live_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={project.live_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Live
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements Section */}
      {achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Achievements ({achievements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.slice(0, 4).map((achievement) => (
                <Card key={achievement.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Trophy className="h-5 w-5 text-yellow-500 mt-1 flex-shrink-0" />
                    <div className="space-y-1 flex-1">
                      <h3 className="font-medium">{achievement.title}</h3>
                      {achievement.issuer && (
                        <p className="text-sm text-muted-foreground">{achievement.issuer}</p>
                      )}
                      {achievement.date_achieved && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(achievement.date_achieved).toLocaleDateString()}
                        </p>
                      )}
                      {achievement.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {achievement.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State for Private Profile */}
      {!profile.is_profile_public && isOwner && projects.length === 0 && achievements.length === 0 && (
        <Card>
          <CardContent className="text-center p-8">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Your Profile is Private</h3>
            <p className="text-muted-foreground mb-4">
              Only you can see your full profile. Others will only see your username and location.
            </p>
            <Button variant="outline">
              Manage Privacy Settings
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
