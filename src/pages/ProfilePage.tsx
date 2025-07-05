
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Github, Code, User, Calendar, LinkIcon, Mail, MapPin } from "lucide-react";

const ProfilePage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center md:items-start gap-4">
                <Avatar className="h-24 w-24 border-2 border-primary/10">
                  <AvatarImage src="/placeholder.svg" alt="User" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="text-center md:text-left">
                  <h1 className="text-2xl font-bold">John Doe</h1>
                  <p className="text-muted-foreground">Senior Developer</p>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <Badge variant="secondary" className="gap-1">
                    <Github size={14} />
                    github.com/johndoe
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Code size={14} />
                    500+ Contributions
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <User size={14} />
                    Member since 2021
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>john.doe@example.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>San Francisco, CA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined Jan 2021</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    <span>johndoe.dev</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
          </TabsList>
          
          <TabsContent value="activity" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest contributions and activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 pb-4 border-b">
                      <div className="rounded-full bg-primary/10 p-2 h-fit">
                        <Code size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Solved LeetCode Problem #{200 + i}</p>
                        <p className="text-sm text-muted-foreground">
                          {i} day{i !== 1 ? "s" : ""} ago
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="projects" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Projects</CardTitle>
                <CardDescription>Your personal and contributed projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 pb-4 border-b">
                      <div className="rounded-full bg-primary/10 p-2 h-fit">
                        <Github size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Project {i}</p>
                        <p className="text-sm text-muted-foreground">
                          A sample project description
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="skills" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
                <CardDescription>Your technical skills and expertise</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {["React", "TypeScript", "Node.js", "Python", "GraphQL", "Docker", "AWS", "Git", "CI/CD", "MongoDB", "PostgreSQL"].map((skill) => (
                    <Badge key={skill} variant="outline" className="text-sm">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ProfilePage;
