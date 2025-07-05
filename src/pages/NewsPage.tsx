
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookmarkPlus, Search, Share2, ThumbsUp, MessageSquare, ExternalLink } from "lucide-react";

// Mock data for news
const mockNews = [
  {
    id: 1,
    title: "TypeScript 5.3 Released with New Features",
    content: "The TypeScript team has announced the release of TypeScript 5.3, featuring improved type inference, new utility types, and performance optimizations.",
    author: "TypeScript Team",
    authorAvatar: "/placeholder.svg",
    source: "TypeScript Blog",
    publishedAt: "2 hours ago",
    likes: 42,
    comments: 8,
    tags: ["typescript", "javascript", "webdev"],
    category: "programming"
  },
  {
    id: 2,
    title: "React Server Components: A Complete Guide",
    content: "Learn how to leverage React Server Components to improve your application's performance by reducing bundle size and enabling streaming rendering.",
    author: "React Team",
    authorAvatar: "/placeholder.svg",
    source: "React Documentation",
    publishedAt: "5 hours ago",
    likes: 127,
    comments: 24,
    tags: ["react", "javascript", "webdev"],
    category: "programming"
  },
  {
    id: 3,
    title: "AI Training Costs Drop 10x as New Methods Emerge",
    content: "Recent breakthroughs in AI training techniques have led to a 10x reduction in the costs associated with training large language models.",
    author: "AI Research Group",
    authorAvatar: "/placeholder.svg",
    source: "AI Journal",
    publishedAt: "1 day ago",
    likes: 89,
    comments: 15,
    tags: ["ai", "machinelearning", "technology"],
    category: "ai"
  },
  {
    id: 4,
    title: "The Future of Next.js: What's Coming in Version 14",
    content: "Vercel has announced the roadmap for Next.js 14, highlighting improved server components, faster builds, and enhanced image optimization.",
    author: "Vercel Team",
    authorAvatar: "/placeholder.svg",
    source: "Vercel Blog",
    publishedAt: "8 hours ago",
    likes: 72,
    comments: 11,
    tags: ["nextjs", "react", "webdev"],
    category: "programming"
  },
  {
    id: 5,
    title: "Google Releases New AI Tools for Developers",
    content: "Google has unveiled a suite of new AI-powered tools designed to help developers build more intelligent applications with less code.",
    author: "Google Developers",
    authorAvatar: "/placeholder.svg",
    source: "Google Developer Blog",
    publishedAt: "1 day ago",
    likes: 103,
    comments: 27,
    tags: ["google", "ai", "developertools"],
    category: "ai"
  },
];

const NewsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  const filteredNews = mockNews.filter(news => {
    const matchesSearch = news.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         news.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeTab === "all" || news.category === activeTab;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
          <h1 className="text-3xl font-bold">Tech News</h1>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search news..." 
                className="w-full pl-9" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button>Search</Button>
          </div>
        </div>
        
        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="programming">Programming</TabsTrigger>
            <TabsTrigger value="ai">AI & ML</TabsTrigger>
            <TabsTrigger value="technology">Technology</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="space-y-4">
            {filteredNews.length > 0 ? (
              filteredNews.map((news) => (
                <Card key={news.id} className="overflow-hidden card-hover">
                  <CardHeader className="p-4 pb-0">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage src={news.authorAvatar} alt={news.author} />
                          <AvatarFallback>{news.author[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-lg font-bold">{news.title}</h3>
                          <div className="text-sm text-muted-foreground">
                            <span>{news.author}</span> • <span>{news.source}</span> • <span>{news.publishedAt}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <BookmarkPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-sm">{news.content}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {news.tags.map((tag) => (
                        <span 
                          key={tag} 
                          className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex gap-4">
                        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                          <ThumbsUp className="h-4 w-4" /> {news.likes}
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                          <MessageSquare className="h-4 w-4" /> {news.comments}
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">No news articles found matching your criteria</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default NewsPage;
