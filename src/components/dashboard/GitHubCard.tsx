
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// Mock data for the GitHub card
const githubData = {
  contributions: 127,
  streak: 7,
  repositories: 24,
  pullRequests: 8,
  contributionGoal: 365,
};

const GitHubCard = () => {
  const progress = Math.round((githubData.contributions / githubData.contributionGoal) * 100);
  
  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold flex items-center">
          <Github className="mr-2" size={18} /> GitHub Activity
        </CardTitle>
        <Button variant="outline" size="sm">View Profile</Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Contributions</p>
            <p className="text-2xl font-bold">{githubData.contributions}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Streak</p>
            <p className="text-2xl font-bold">{githubData.streak} days</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Repositories</p>
            <p className="text-2xl font-bold">{githubData.repositories}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pull Requests</p>
            <p className="text-2xl font-bold">{githubData.pullRequests}</p>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between mb-1 text-sm">
            <span>Year Goal: {githubData.contributions}/{githubData.contributionGoal}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};

export default GitHubCard;
