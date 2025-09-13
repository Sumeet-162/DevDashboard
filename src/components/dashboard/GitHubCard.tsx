
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BorderTrail } from "@/components/ui/border-trail";
import { useEffect, useState } from "react";
import { githubService } from "@/services/githubService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";

interface GitHubData {
  contributions: number;
  streak: number;
  repositories: number;
  pullRequests: number;
  contributionGoal: number;
  totalContributions: number;
  currentStreak: number;
  longestStreak: number;
  username?: string;
}

const GitHubCard = () => {
  const { user } = useAuth();
  const [githubData, setGithubData] = useState<GitHubData>({
    contributions: 0,
    streak: 0,
    repositories: 0,
    pullRequests: 0,
    contributionGoal: 365,
    totalContributions: 0,
    currentStreak: 0,
    longestStreak: 0,
  });
  const [loading, setLoading] = useState(true);
  const [githubUsername, setGithubUsername] = useState<string>('');
  const [isRealData, setIsRealData] = useState<boolean>(false);

  useEffect(() => {
    const fetchGitHubData = async () => {
      if (!user?.id) return;

      try {
        // First, try to get the GitHub username from the user's profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('github_username')
          .eq('id', user.id)
          .single();

        let username = profile?.github_username;
        
        // If no username in profile, check localStorage or use repository owner
        if (!username) {
          username = localStorage.getItem('github-username') || 'Sumeet-162'; // Fallback to repo owner
        }

        if (!username) {
          setLoading(false);
          return;
        }

        setGithubUsername(username);

        // Fetch GitHub data
        const [userProfile, userStats, contributionData, pullRequests] = await Promise.all([
          githubService.getUserProfile(username),
          githubService.getUserStats(username),
          githubService.getContributionData(username),
          githubService.getUserPullRequests(username, 10)
        ]);

        setGithubData({
          contributions: contributionData.totalContributions || 0,
          streak: contributionData.currentStreak || 0,
          repositories: userStats.totalRepos || 0,
          pullRequests: pullRequests.totalCount || 0,
          contributionGoal: 365,
          totalContributions: contributionData.totalContributions || 0,
          currentStreak: contributionData.currentStreak || 0,
          longestStreak: contributionData.longestStreak || 0,
          username
        });

        setIsRealData(userStats.isRealData !== false); // Default to true if not specified

      } catch (error) {
        console.error('Error fetching GitHub data:', error);
        // Set fallback data only if fetch completely fails
        setGithubData(prev => ({
          ...prev,
          contributions: 0,
          streak: 0,
          repositories: 0, // Don't show fake data
          pullRequests: 0,
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchGitHubData();
  }, [user?.id]);

  const progress = Math.round((githubData.totalContributions / githubData.contributionGoal) * 100);
  
  return (
    <Card className="card-hover relative">
      <BorderTrail 
        style={{
          boxShadow:
            "0px 0px 60px 30px rgb(255 255 255 / 50%), 0 0 100px 60px rgb(0 0 0 / 50%), 0 0 140px 90px rgb(0 0 0 / 50%)",
        }}
        size={100}
      />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold flex items-center">
          <Github className="mr-2" size={18} /> GitHub Activity
        </CardTitle>
        <Link to="/github">
          <Button variant="outline" size="sm">View Profile</Button>
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-base text-muted-foreground">Contributions</p>
              <div className="h-8 bg-muted animate-pulse rounded"></div>
            </div>
            <div>
              <p className="text-base text-muted-foreground">Current Streak</p>
              <div className="h-8 bg-muted animate-pulse rounded"></div>
            </div>
            <div>
              <p className="text-base text-muted-foreground">Repositories</p>
              <div className="h-8 bg-muted animate-pulse rounded"></div>
            </div>
            <div>
              <p className="text-base text-muted-foreground">Pull Requests</p>
              <div className="h-8 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-base text-muted-foreground">Contributions</p>
                <p className="text-2xl font-bold">{githubData.totalContributions}</p>
                <p className="text-sm text-muted-foreground">This year</p>
              </div>
              <div>
                <p className="text-base text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold">{githubData.currentStreak}</p>
                <p className="text-sm text-muted-foreground">days</p>
              </div>
              <div>
                <p className="text-base text-muted-foreground">Repositories</p>
                <p className="text-2xl font-bold">{githubData.repositories}</p>
                <p className="text-sm text-muted-foreground">public repos</p>
              </div>
              <div>
                <p className="text-base text-muted-foreground">Pull Requests</p>
                <p className="text-2xl font-bold">{githubData.pullRequests}</p>
                <p className="text-sm text-muted-foreground">recent</p>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between mb-1 text-base">
                <span>Year Goal: {githubData.totalContributions}/{githubData.contributionGoal}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              
              {githubUsername && (
                <p className="text-sm text-muted-foreground mt-2">
                  Showing data for: <span className="font-medium">@{githubUsername}</span>
                  {isRealData ? (
                    <span className="text-green-600 ml-2">• Real Data</span>
                  ) : (
                    <span className="text-orange-600 ml-2">• Demo Data</span>
                  )}
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GitHubCard;
