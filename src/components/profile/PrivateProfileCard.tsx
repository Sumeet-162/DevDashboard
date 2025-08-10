import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lock, MapPin, User } from "lucide-react";
import { getProfileDisplayName, formatPrivacyStatus } from "@/lib/utils";

interface PrivateProfileCardProps {
  profile: any;
  isOwner?: boolean;
}

export const PrivateProfileCard = ({ profile, isOwner = false }: PrivateProfileCardProps) => {
  if (!profile) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <User className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Profile not found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If it's a private profile and not the owner
  if (!profile.is_profile_public && !isOwner) {
    return (
      <Card className="w-full border-muted">
        <CardHeader className="text-center pb-4">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-20 w-20 border-2 border-muted bg-muted">
              <AvatarFallback className="bg-muted text-muted-foreground">
                <Lock className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-2">
              <CardTitle className="text-lg">
                {profile.username || 'Private User'}
              </CardTitle>
              <Badge variant="secondary" className="gap-1">
                <Lock className="h-3 w-3" />
                Private Profile
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {profile.location && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{profile.location}</span>
            </div>
          )}
          
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              This user has set their profile to private. Only basic information is visible.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If it's a public profile or the owner viewing their own profile
  return (
    <Card className="w-full">
      <CardHeader className="text-center pb-4">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-20 w-20 border-2">
            <AvatarImage src={profile.avatar_url} alt={getProfileDisplayName(profile)} />
            <AvatarFallback className="text-lg">
              {getProfileDisplayName(profile).split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-2">
            <CardTitle className="text-xl">
              {getProfileDisplayName(profile)}
            </CardTitle>
            {profile.username && profile.full_name && (
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            )}
            <Badge variant={profile.is_profile_public ? "default" : "secondary"} className="gap-1">
              {profile.is_profile_public ? (
                <User className="h-3 w-3" />
              ) : (
                <Lock className="h-3 w-3" />
              )}
              {formatPrivacyStatus(profile.is_profile_public)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {profile.bio && (
          <p className="text-center text-sm text-muted-foreground">
            {profile.bio}
          </p>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {profile.job_title && (
            <div>
              <span className="font-medium">Role:</span> {profile.job_title}
            </div>
          )}
          {profile.company && (
            <div>
              <span className="font-medium">Company:</span> {profile.company}
            </div>
          )}
          {profile.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{profile.location}</span>
            </div>
          )}
          {profile.website && (
            <div>
              <span className="font-medium">Website:</span>{' '}
              <a 
                href={profile.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {profile.website}
              </a>
            </div>
          )}
        </div>
        
        {profile.skills && profile.skills.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Skills:</span>
            <div className="flex flex-wrap gap-1">
              {profile.skills.map((skill: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
