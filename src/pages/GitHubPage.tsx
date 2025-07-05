
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Github, 
  GitPullRequest, 
  GitBranch, 
  Star, 
  FileCode, 
  AlertCircle,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock GitHub data
const githubData = {
  user: {
    name: "Developer",
    avatar: "/placeholder.svg",
    username: "dev-username",
    bio: "Full-stack developer passionate about JavaScript and React",
    location: "San Francisco, CA",
    joined: "Joined on May 10, 2019"
  },
  stats: {
    contributions: 127,
    streak: 7,
    longestStreak: 21,
    contributionGoal: 365,
    repositories: 24,
    followers: 156,
    following: 89,
    stars: 243
  },
  repositories: [
    {
      name: "react-dashboard-template",
      description: "A modern dashboard template built with React and TailwindCSS",
      language: "TypeScript",
      stars: 84,
      forks: 23,
      issues: 5,
      updatedAt: "Updated 2 days ago"
    },
    {
      name: "node-api-starter",
      description: "Simple and scalable REST API starter kit with Node.js and Express",
      language: "JavaScript",
      stars: 67,
      forks: 18,
      issues: 2,
      updatedAt: "Updated 1 week ago"
    },
    {
      name: "react-state-management",
      description: "Examples of different state management approaches in React",
      language: "TypeScript",
      stars: 45,
      forks: 12,
      issues: 0,
      updatedAt: "Updated 3 weeks ago"
    }
  ],
  pullRequests: [
    {
      title: "Fix performance issues in data fetching",
      repository: "organization/project-name",
      status: "open",
      createdAt: "Created 2 days ago"
    },
    {
      title: "Add dark mode support",
      repository: "organization/ui-components",
      status: "merged",
      createdAt: "Merged 1 week ago"
    }
  ],
  issues: [
    {
      title: "Memory leak in useEffect cleanup",
      repository: "organization/react-components",
      status: "open",
      createdAt: "Opened 3 days ago"
    },
    {
      title: "Add tests for API endpoints",
      repository: "organization/backend",
      status: "closed",
      createdAt: "Closed 2 weeks ago"
    }
  ]
};

// Language color mapping
const languageColors: Record<string, string> = {
  TypeScript: "bg-blue-500",
  JavaScript: "bg-yellow-400",
  HTML: "bg-red-500",
  CSS: "bg-purple-500",
  Python: "bg-green-500",
};

const GitHubPage = () => {
  const progress = Math.round((githubData.stats.contributions / githubData.stats.contributionGoal) * 100);
  
  return (
    <Layout>
      <div className="space-y-6">
        {/* Profile Section */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* User Info */}
          <Card className="md:w-1/3 card-hover">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={githubData.user.avatar} alt={githubData.user.name} />
                  <AvatarFallback>{githubData.user.name[0]}</AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold">{githubData.user.name}</h2>
                <p className="text-muted-foreground mb-2">@{githubData.user.username}</p>
                <p className="mb-4">{githubData.user.bio}</p>
                <div className="text-sm text-muted-foreground">
                  <p className="flex items-center justify-center gap-2 mb-1">
                    <Github size={16} /> {githubData.user.location}
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <Calendar size={16} /> {githubData.user.joined}
                  </p>
                </div>
                <Button className="mt-4 w-full">View GitHub Profile</Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Stats */}
          <Card className="md:w-2/3 card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{githubData.stats.repositories}</p>
                  <p className="text-sm text-muted-foreground">Repositories</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{githubData.stats.stars}</p>
                  <p className="text-sm text-muted-foreground">Stars Received</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{githubData.stats.followers}</p>
                  <p className="text-sm text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{githubData.stats.following}</p>
                  <p className="text-sm text-muted-foreground">Following</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Current streak: {githubData.stats.streak} days</span>
                    <span>Longest: {githubData.stats.longestStreak} days</span>
                  </div>
                  <Progress value={githubData.stats.streak / githubData.stats.longestStreak * 100} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Yearly Goal: {githubData.stats.contributions}/{githubData.stats.contributionGoal}</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Activity Tabs */}
        <Card className="card-hover">
          <CardHeader className="pb-0">
            <CardTitle>GitHub Activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Tabs defaultValue="repositories">
              <TabsList className="mb-4">
                <TabsTrigger value="repositories" className="flex items-center gap-2">
                  <FileCode size={16} /> Repositories
                </TabsTrigger>
                <TabsTrigger value="pullRequests" className="flex items-center gap-2">
                  <GitPullRequest size={16} /> Pull Requests
                </TabsTrigger>
                <TabsTrigger value="issues" className="flex items-center gap-2">
                  <AlertCircle size={16} /> Issues
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="repositories" className="space-y-4">
                {githubData.repositories.map((repo, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium">{repo.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{repo.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <span className={`w-3 h-3 rounded-full ${languageColors[repo.language] || "bg-gray-400"}`}></span>
                            {repo.language}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star size={14} />
                            {repo.stars}
                          </div>
                          <div className="flex items-center gap-1">
                            <GitBranch size={14} />
                            {repo.forks}
                          </div>
                          <div className="flex items-center gap-1">
                            <AlertCircle size={14} />
                            {repo.issues}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{repo.updatedAt}</p>
                    </div>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="pullRequests">
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {githubData.pullRequests.map((pr, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium">{pr.title}</h3>
                            <p className="text-sm text-muted-foreground">{pr.repository}</p>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              pr.status === 'open' ? 'bg-yellow-100 text-yellow-800' : 
                              pr.status === 'merged' ? 'bg-purple-100 text-purple-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {pr.status}
                            </span>
                            <p className="text-xs text-muted-foreground mt-1">{pr.createdAt}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="issues">
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {githubData.issues.map((issue, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium">{issue.title}</h3>
                            <p className="text-sm text-muted-foreground">{issue.repository}</p>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              issue.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {issue.status}
                            </span>
                            <p className="text-xs text-muted-foreground mt-1">{issue.createdAt}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default GitHubPage;
