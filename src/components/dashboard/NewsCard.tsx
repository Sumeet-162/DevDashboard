
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Newspaper, Bookmark, Share2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock data for the news card
const newsData = [
  {
    id: 1,
    title: "TypeScript 5.3 Released with New Features",
    source: "TypeScript Blog",
    time: "2 hours ago",
    url: "#",
    savedByUser: false,
  },
  {
    id: 2,
    title: "React Server Components: A Complete Guide",
    source: "React Documentation",
    time: "5 hours ago",
    url: "#",
    savedByUser: true,
  },
  {
    id: 3,
    title: "The Future of Next.js: What's Coming in Version 14",
    source: "Vercel Blog",
    time: "8 hours ago",
    url: "#",
    savedByUser: false,
  },
  {
    id: 4,
    title: "Google Releases New AI Tools for Developers",
    source: "Google Developer Blog",
    time: "1 day ago",
    url: "#",
    savedByUser: false,
  },
];

const NewsCard = () => {
  const [news, setNews] = useState(newsData);

  const toggleSave = (id: number) => {
    setNews(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, savedByUser: !item.savedByUser } 
          : item
      )
    );
  };

  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold flex items-center">
          <Newspaper className="mr-2" size={18} /> Latest Tech News
        </CardTitle>
        <Button variant="outline" size="sm">View All</Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {news.map((item) => (
              <div key={item.id} className="border-b pb-3 last:border-0">
                <h3 className="font-medium mb-1">{item.title}</h3>
                <div className="flex justify-between items-center text-sm">
                  <div className="text-muted-foreground">
                    {item.source} • {item.time}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-8 w-8 ${item.savedByUser ? "text-primary" : ""}`}
                      onClick={() => toggleSave(item.id)}
                    >
                      <Bookmark size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Share2 size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default NewsCard;
