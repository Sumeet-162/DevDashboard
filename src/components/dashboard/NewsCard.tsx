
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Newspaper, Bookmark, Share2, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { NewsService, type NewsArticle } from "@/services/newsService";

const NewsCard = () => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savedArticles, setSavedArticles] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchNews();
    
    // Start auto-refresh when component mounts
    NewsService.startAutoRefresh((freshArticles) => {
      setNews(freshArticles);
    });

    // Cleanup auto-refresh when component unmounts
    return () => {
      NewsService.stopAutoRefresh();
    };
  }, []);

  const fetchNews = async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const articles = await NewsService.fetchAllNews(forceRefresh);
      setNews(articles.slice(0, 6)); // Show only top 6 articles
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleSave = (id: string) => {
    setSavedArticles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleRefresh = () => {
    fetchNews(true);
  };

  const openArticle = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      frontend: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      backend: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      ai: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      mobile: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      general: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    };
    return colors[category] || colors.general;
  };

  if (loading) {
    return (
      <Card className="card-hover">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-bold flex items-center">
            <Newspaper className="mr-2" size={18} /> Latest Tech News
          </CardTitle>
          <Skeleton className="h-8 w-20" />
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border-b pb-3 last:border-0">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-3 w-24" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold flex items-center">
          <Newspaper className="mr-2" size={18} /> Latest Tech News
        </CardTitle>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-8"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {news.map((article) => (
              <div key={article.id} className="border-b pb-3 last:border-0 group">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getCategoryColor(article.category)}`}
                      >
                        {article.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {article.readTime}
                      </span>
                    </div>
                    <h3 
                      className="font-medium mb-1 cursor-pointer hover:text-primary transition-colors line-clamp-2 text-sm leading-relaxed"
                      onClick={() => openArticle(article.sourceUrl)}
                    >
                      {article.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {article.summary}
                    </p>
                    <div className="flex justify-between items-center text-xs">
                      <div className="text-muted-foreground">
                        <span className="font-medium">{article.source}</span> • {article.publishedAt}
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          ❤️ {article.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          💬 {article.comments}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end items-center gap-1 mt-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-7 w-7 ${savedArticles.has(article.id) ? "text-primary" : ""}`}
                    onClick={() => toggleSave(article.id)}
                    title="Save article"
                  >
                    <Bookmark size={14} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={() => {
                      navigator.share?.({
                        title: article.title,
                        url: article.sourceUrl
                      }).catch(() => {
                        navigator.clipboard.writeText(article.sourceUrl);
                      });
                    }}
                    title="Share article"
                  >
                    <Share2 size={14} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={() => openArticle(article.sourceUrl)}
                    title="Open article"
                  >
                    <ExternalLink size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {news.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No news articles available</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => fetchNews(true)}
            >
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NewsCard;
