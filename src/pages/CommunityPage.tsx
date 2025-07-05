
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, ThumbsUp, Share2, Users, Search, Filter } from "lucide-react";

const CommunityPage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Community</h1>
            <p className="text-muted-foreground">Connect with fellow developers and share knowledge</p>
          </div>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search posts..." className="pl-8" />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button>
              <MessageCircle className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="popular" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="popular">Popular</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>
          
          <TabsContent value="popular" className="mt-6 space-y-4">
            {[1, 2, 3, 4].map((post) => (
              <Card key={post}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={`/placeholder.svg`} />
                      <AvatarFallback>U{post}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">User Name {post}</p>
                      <p className="text-xs text-muted-foreground">Posted {post * 2} days ago</p>
                    </div>
                  </div>
                  <CardTitle className="mt-2 text-xl">This is a sample community post #{post}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    This is a sample post content that demonstrates what community posts might look like. 
                    It includes some text content that users might write when sharing their thoughts or questions.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge variant="secondary">React</Badge>
                    <Badge variant="secondary">TypeScript</Badge>
                    <Badge variant="secondary">Web Development</Badge>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-between">
                  <div className="flex gap-6">
                    <Button variant="ghost" size="sm" className="gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{42 + post * 10}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{12 + post}</span>
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </TabsContent>
          
          <TabsContent value="recent" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Posts</CardTitle>
                <CardDescription>The most recent posts from the community</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Recent posts content would go here...</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="following" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Following</CardTitle>
                <CardDescription>Posts from developers you follow</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Following content would go here...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Active Members</CardTitle>
              <Button variant="ghost" size="sm" className="gap-1">
                <Users className="h-4 w-4" />
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((member) => (
                <div key={member} className="flex flex-col items-center gap-2">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>M{member}</AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-center">Member {member}</p>
                  <Badge variant="outline" className="text-xs">
                    {member * 10} posts
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CommunityPage;
