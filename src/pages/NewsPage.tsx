
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Heart, MessageCircle, ExternalLink, Clock, TrendingUp, Bookmark, Loader2, RefreshCw, Globe, Star } from 'lucide-react';
import { NewsService, NewsArticle } from '@/services/newsService';

const categories = [
  { id: 'all', label: 'All', count: 0 },
  { id: 'frontend', label: 'Frontend', count: 0 },
  { id: 'backend', label: 'Backend', count: 0 },
  { id: 'ai', label: 'AI & ML', count: 0 },
  { id: 'mobile', label: 'Mobile', count: 0 },
  { id: 'open-source', label: 'Open Source', count: 0 },
  { id: 'general', label: 'General', count: 0 },
];

export default function NewsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<{ lastUpdated: string; nextUpdate: string } | null>(null);

  const loadNews = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const articles = await NewsService.fetchAllNews(isRefresh);
      setNews(articles);
      
      // Update cache info
      const cache = NewsService.getCacheInfo();
      setCacheInfo(cache);
    } catch (err) {
      setError('Failed to load news. Please try again.');
      console.error('Error loading news:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNews();
    
    // Start auto-refresh
    NewsService.startAutoRefresh(async () => {
      console.log('Auto-refreshing news...');
      const articles = await NewsService.fetchAllNews(true);
      setNews(articles);
      
      // Update cache info
      const cache = NewsService.getCacheInfo();
      setCacheInfo(cache);
    });

    // Cleanup on unmount
    return () => {
      NewsService.stopAutoRefresh();
    };
  }, []);

  // Update category counts
  const updatedCategories = categories.map(category => ({
    ...category,
    count: category.id === 'all' 
      ? news.length 
      : news.filter(article => article.category === category.id).length
  }));

  const filteredNews = news.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleRefresh = () => {
    loadNews(true);
  };

  const getSourceIcon = (source: string) => {
    if (source.includes('GitHub')) return <Star className="h-4 w-4" />;
    if (source.includes('Dev.to')) return <Globe className="h-4 w-4" />;
    return <TrendingUp className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading latest tech news...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Tech News</h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-muted-foreground">
                Stay updated with the latest in technology and development
              </p>
              {cacheInfo && (
                <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Updated: {cacheInfo.lastUpdated}</span>
                  <span>•</span>
                  <span>Next: {cacheInfo.nextUpdate}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search articles..." 
                className="w-full sm:w-64 lg:w-80 pl-9" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              title={cacheInfo ? `Last updated: ${cacheInfo.lastUpdated}` : 'Refresh news'}
              className="flex-shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Mobile Cache Info */}
        {cacheInfo && (
          <div className="lg:hidden flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">
            <Clock className="h-3 w-3" />
            <span>Updated: {cacheInfo.lastUpdated}</span>
            <span>•</span>
            <span>Next update: {cacheInfo.nextUpdate}</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-destructive">{error}</p>
                <Button variant="outline" size="sm" onClick={() => loadNews()}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-1 p-1 h-auto">
            {updatedCategories.map((category) => (
              <TabsTrigger 
                key={category.id} 
                value={category.id}
                className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm py-2 sm:py-2.5"
              >
                <span className="truncate">{category.label}</span>
                {category.count > 0 && (
                  <Badge variant="secondary" className="text-xs min-w-[20px] h-4 px-1">
                    {category.count}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            {/* Stats */}
            <div className="mb-6 text-sm text-muted-foreground">
              Showing {filteredNews.length} articles
              {selectedCategory !== 'all' && ` in ${updatedCategories.find(c => c.id === selectedCategory)?.label}`}
            </div>

            {/* Articles Grid */}
            {filteredNews.length > 0 ? (
              <div className="grid gap-6">
                {filteredNews.map((article) => (
                  <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <div className="flex flex-col lg:flex-row">
                        {/* Article Image */}
                        {article.imageUrl && (
                          <div className="w-full sm:w-auto lg:w-64 lg:flex-shrink-0">
                            <img 
                              src={article.imageUrl} 
                              alt={article.title}
                              className="w-full h-48 sm:h-32 lg:h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Article Content */}
                        <div className="flex-1 p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={article.authorAvatar} alt={article.author} />
                                <AvatarFallback>{article.author[0]}</AvatarFallback>
                              </Avatar>
                              <div className="text-sm text-muted-foreground min-w-0 flex-1">
                                <div className="font-medium truncate">{article.author}</div>
                                <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs">
                                  {getSourceIcon(article.source)}
                                  <span className="truncate">{article.source}</span>
                                  <span className="hidden sm:inline">•</span>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{article.publishedAt}</span>
                                  </div>
                                  {article.readTime && (
                                    <>
                                      <span className="hidden sm:inline">•</span>
                                      <span className="text-xs">{article.readTime}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="flex-shrink-0">
                              <Bookmark className="h-4 w-4" />
                            </Button>
                          </div>

                          <h2 className="text-lg sm:text-xl font-bold mb-2 line-clamp-2">
                            {article.title}
                          </h2>
                          
                          <p className="text-muted-foreground mb-4 line-clamp-2 sm:line-clamp-3 text-sm sm:text-base">
                            {article.summary}
                          </p>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1 sm:gap-2 mb-4">
                            {article.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                            {article.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{article.tags.length - 3}
                              </Badge>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                                <Heart className="h-4 w-4" />
                                <span className="hidden sm:inline">{article.likes}</span>
                                <span className="sm:hidden">{article.likes}</span>
                              </Button>
                              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                                <MessageCircle className="h-4 w-4" />
                                <span className="hidden sm:inline">{article.comments}</span>
                                <span className="sm:hidden">{article.comments}</span>
                              </Button>
                            </div>
                            
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-1 text-xs"
                              onClick={() => window.open(article.sourceUrl, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span>Read More</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="space-y-3">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="text-lg font-semibold">No articles found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm 
                        ? `No articles match "${searchTerm}"`
                        : 'No articles available in this category'
                      }
                    </p>
                    {searchTerm && (
                      <Button variant="outline" onClick={() => setSearchTerm('')}>
                        Clear Search
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
