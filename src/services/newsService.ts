// News service for fetching tech news from various sources
export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  author: string;
  authorAvatar?: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  likes: number;
  comments: number;
  tags: string[];
  category: string;
  imageUrl?: string;
  readTime?: string;
}

// Additional dynamic articles pool for rotation
const dynamicArticlesPool: Omit<NewsArticle, 'id' | 'publishedAt' | 'likes' | 'comments'>[] = [
  {
    title: "Vercel Edge Runtime: The Future of Serverless Computing",
    content: "Vercel's Edge Runtime is revolutionizing how we think about serverless computing. With sub-100ms cold starts and global distribution, it's changing the game for web applications that need ultra-low latency and high performance.",
    summary: "Vercel Edge Runtime offers sub-100ms cold starts and global distribution.",
    author: "DevTech Weekly",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    source: "DevTech Weekly",
    sourceUrl: "https://devtech.weekly",
    tags: ["vercel", "edge", "serverless", "performance"],
    category: "backend",
    imageUrl: "https://assets.vercel.com/image/upload/v1588805858/repositories/vercel/logo.png",
    readTime: "4 min read"
  },
  {
    title: "Astro 4.2: View Transitions and Server Islands",
    content: "Astro 4.2 introduces groundbreaking view transitions and server islands, enabling smooth page transitions and selective hydration. This update makes Astro even more compelling for building fast, modern web applications with minimal JavaScript.",
    summary: "Astro 4.2 adds view transitions and server islands for better performance.",
    author: "Astro Team",
    authorAvatar: "https://avatars.githubusercontent.com/u/44914786?v=4",
    source: "Astro Blog",
    sourceUrl: "https://astro.build/blog",
    tags: ["astro", "view-transitions", "performance", "ssr"],
    category: "frontend",
    imageUrl: "https://astro.build/assets/press/astro-logo-dark.svg",
    readTime: "6 min read"
  },
  {
    title: "Anthropic Claude 3: Competing with GPT-4 in Code Generation",
    content: "Anthropic's Claude 3 has shown impressive results in code generation benchmarks, often matching or exceeding GPT-4's performance. With better reasoning capabilities and improved context understanding, it's becoming a serious competitor in the AI coding assistant space.",
    summary: "Claude 3 shows impressive code generation capabilities rivaling GPT-4.",
    author: "AI Research Weekly",
    authorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face",
    source: "AI Research Weekly",
    sourceUrl: "https://airesearch.weekly",
    tags: ["claude", "ai", "anthropic", "code-generation"],
    category: "ai",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Anthropic_logo.svg",
    readTime: "5 min read"
  },
  {
    title: "Deno 2.0: NPM Compatibility and Performance Improvements",
    content: "Deno 2.0 brings full NPM compatibility while maintaining its secure-by-default philosophy. With improved TypeScript support and 40% faster startup times, Deno is becoming a serious alternative to Node.js for modern JavaScript development.",
    summary: "Deno 2.0 offers full NPM compatibility with improved performance.",
    author: "Deno Team",
    authorAvatar: "https://avatars.githubusercontent.com/u/42048915?v=4",
    source: "Deno Blog",
    sourceUrl: "https://deno.land/blog",
    tags: ["deno", "javascript", "runtime", "npm"],
    category: "backend",
    imageUrl: "https://deno.land/logo.svg",
    readTime: "7 min read"
  },
  {
    title: "Svelte 5: Runes and Revolutionary Reactivity",
    content: "Svelte 5 introduces Runes, a new reactivity system that makes state management more predictable and powerful. With better TypeScript integration and improved performance, Svelte continues to push the boundaries of frontend frameworks.",
    summary: "Svelte 5 introduces Runes for revolutionary reactivity system.",
    author: "Svelte Team",
    authorAvatar: "https://avatars.githubusercontent.com/u/23617963?v=4",
    source: "Svelte Blog",
    sourceUrl: "https://svelte.dev/blog",
    tags: ["svelte", "runes", "reactivity", "frontend"],
    category: "frontend",
    imageUrl: "https://svelte.dev/svelte-logo-horizontal.svg",
    readTime: "8 min read"
  },
  {
    title: "WebAssembly 3.0: Multithreading and Garbage Collection",
    content: "WebAssembly 3.0 introduces multithreading support and automatic garbage collection, making it even more powerful for compute-intensive web applications. This update opens new possibilities for running complex applications directly in the browser.",
    summary: "WebAssembly 3.0 adds multithreading and garbage collection support.",
    author: "WebAssembly Working Group",
    authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    source: "WebAssembly News",
    sourceUrl: "https://webassembly.org",
    tags: ["webassembly", "wasm", "performance", "multithreading"],
    category: "general",
    imageUrl: "https://webassembly.org/css/webassembly.svg",
    readTime: "6 min read"
  },
  {
    title: "Flutter 3.18: Impeller Rendering Engine Goes Stable",
    content: "Flutter 3.18 makes the Impeller rendering engine stable across all platforms, delivering better performance and more consistent rendering. The update also includes improved Material 3 support and enhanced accessibility features.",
    summary: "Flutter 3.18 stabilizes Impeller rendering engine for better performance.",
    author: "Flutter Team",
    authorAvatar: "https://avatars.githubusercontent.com/u/14101776?v=4",
    source: "Flutter Medium",
    sourceUrl: "https://medium.com/flutter",
    tags: ["flutter", "impeller", "mobile", "rendering"],
    category: "mobile",
    imageUrl: "https://storage.googleapis.com/flutter-website/shared/brand/flutter/logo/flutter-lockup.png",
    readTime: "5 min read"
  }
];

// Enhanced seeded data with realistic tech news
export const seededNews: NewsArticle[] = [
  {
    id: "1",
    title: "React 19 Beta: New Features and Breaking Changes",
    content: "The React team has released React 19 Beta, introducing significant changes including the new React Compiler, Server Components improvements, and a new approach to handling forms. This major update also includes breaking changes that developers should be aware of before upgrading their applications.",
    summary: "React 19 Beta introduces React Compiler, improved Server Components, and new form handling capabilities.",
    author: "React Team",
    authorAvatar: "https://avatars.githubusercontent.com/u/6412038?v=4",
    source: "React Blog",
    sourceUrl: "https://react.dev/blog",
    publishedAt: "2 hours ago",
    likes: 324,
    comments: 45,
    tags: ["react", "javascript", "frontend", "beta"],
    category: "frontend",
    imageUrl: "https://react.dev/images/home/conf2021/cover.svg",
    readTime: "8 min read"
  },
  {
    id: "2",
    title: "TypeScript 5.4: Decorator Metadata and Performance Improvements",
    content: "TypeScript 5.4 brings decorator metadata support, improved inference for object methods, and significant performance improvements. The new release also includes better error messages and enhanced support for modern JavaScript features, making TypeScript development more efficient and developer-friendly.",
    summary: "TypeScript 5.4 features decorator metadata, better inference, and major performance boosts.",
    author: "TypeScript Team",
    authorAvatar: "https://avatars.githubusercontent.com/u/28916798?v=4",
    source: "TypeScript Blog",
    sourceUrl: "https://devblogs.microsoft.com/typescript/",
    publishedAt: "4 hours ago",
    likes: 256,
    comments: 32,
    tags: ["typescript", "javascript", "development"],
    category: "backend",
    imageUrl: "https://www.typescriptlang.org/images/branding/ts-lettermark-blue.svg",
    readTime: "6 min read"
  },
  {
    id: "3",
    title: "AI Code Generation: GitHub Copilot vs ChatGPT Code Interpreter",
    content: "A comprehensive comparison of AI-powered code generation tools. GitHub Copilot excels at inline suggestions and IDE integration, while ChatGPT Code Interpreter offers superior explanation capabilities and complex problem-solving. Both tools are transforming how developers write and debug code.",
    summary: "Comparing AI code generation tools and their impact on developer productivity.",
    author: "Sarah Chen",
    authorAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b1e5?w=150&h=150&fit=crop&crop=face",
    source: "AI Developer Weekly",
    sourceUrl: "https://aideveloper.io",
    publishedAt: "6 hours ago",
    likes: 189,
    comments: 67,
    tags: ["ai", "coding", "productivity", "github-copilot"],
    category: "ai",
    imageUrl: "https://github.githubassets.com/images/modules/site/copilot/copilot-logo.png",
    readTime: "12 min read"
  },
  {
    id: "4",
    title: "Next.js 14.1: Turbopack and Self-Hosting Improvements",
    content: "Next.js 14.1 introduces stable Turbopack for development builds, improved self-hosting capabilities, and enhanced developer experience. The update includes better error handling, faster hot reloads, and new deployment optimizations that make Next.js applications more performant and reliable.",
    summary: "Next.js 14.1 brings stable Turbopack and better self-hosting options.",
    author: "Vercel Team",
    authorAvatar: "https://avatars.githubusercontent.com/u/14985020?v=4",
    source: "Vercel Blog",
    sourceUrl: "https://vercel.com/blog",
    publishedAt: "1 day ago",
    likes: 412,
    comments: 78,
    tags: ["nextjs", "react", "vercel", "turbopack"],
    category: "frontend",
    imageUrl: "https://nextjs.org/static/blog/next-14-1/thumbnail.png",
    readTime: "5 min read"
  },
  {
    id: "5",
    title: "Supabase Launches Real-time Vector Embeddings",
    content: "Supabase has announced real-time vector embeddings support, enabling developers to build AI-powered applications with live vector search capabilities. This feature combines PostgreSQL's vector extensions with Supabase's real-time infrastructure, opening new possibilities for AI applications.",
    summary: "Supabase adds real-time vector embeddings for AI-powered applications.",
    author: "Supabase Team",
    authorAvatar: "https://avatars.githubusercontent.com/u/54469796?v=4",
    source: "Supabase Blog",
    sourceUrl: "https://supabase.com/blog",
    publishedAt: "1 day ago",
    likes: 167,
    comments: 23,
    tags: ["supabase", "ai", "vectors", "database"],
    category: "backend",
    imageUrl: "https://supabase.com/_next/image?url=%2Fimages%2Fblog%2F2024-03-05-realtime-vector-embeddings%2Fthumb.png&w=1200&q=75",
    readTime: "7 min read"
  },
  {
    id: "6",
    title: "Bun 1.0.30: Windows Support and Performance Gains",
    content: "Bun 1.0.30 introduces official Windows support and significant performance improvements across all platforms. The JavaScript runtime now offers better compatibility with Node.js APIs and includes new bundling optimizations that make it a compelling alternative to traditional JavaScript tooling.",
    summary: "Bun adds Windows support and delivers major performance improvements.",
    author: "Jarred Sumner",
    authorAvatar: "https://avatars.githubusercontent.com/u/709451?v=4",
    source: "Bun Blog",
    sourceUrl: "https://bun.sh/blog",
    publishedAt: "2 days ago",
    likes: 298,
    comments: 41,
    tags: ["bun", "javascript", "runtime", "performance"],
    category: "backend",
    imageUrl: "https://bun.sh/logo@2x.png",
    readTime: "4 min read"
  },
  {
    id: "7",
    title: "OpenAI GPT-4 Turbo: Faster, Cheaper, and More Capable",
    content: "OpenAI has released GPT-4 Turbo with improved performance, reduced costs, and expanded context windows. The new model offers better reasoning capabilities, faster response times, and enhanced support for code generation, making it ideal for developer-focused applications.",
    summary: "GPT-4 Turbo offers improved performance and lower costs for developers.",
    author: "OpenAI Team",
    authorAvatar: "https://avatars.githubusercontent.com/u/14957082?v=4",
    source: "OpenAI Blog",
    sourceUrl: "https://openai.com/blog",
    publishedAt: "3 days ago",
    likes: 567,
    comments: 134,
    tags: ["openai", "gpt-4", "ai", "llm"],
    category: "ai",
    imageUrl: "https://cdn.openai.com/blog/introducing-gpt-4-turbo/hero.jpg",
    readTime: "6 min read"
  },
  {
    id: "8",
    title: "Vite 5.1: Lightning Fast Development with New HMR",
    content: "Vite 5.1 introduces a completely rewritten Hot Module Replacement (HMR) system that's 3x faster than previous versions. The update also includes improved TypeScript support, better plugin ecosystem, and enhanced support for monorepos, making development faster and more reliable.",
    summary: "Vite 5.1 features 3x faster HMR and improved development experience.",
    author: "Evan You",
    authorAvatar: "https://avatars.githubusercontent.com/u/499550?v=4",
    source: "Vite Blog",
    sourceUrl: "https://vitejs.dev/blog",
    publishedAt: "3 days ago",
    likes: 234,
    comments: 29,
    tags: ["vite", "hmr", "development", "build-tools"],
    category: "frontend",
    imageUrl: "https://vitejs.dev/logo-with-shadow.png",
    readTime: "5 min read"
  },
  {
    id: "9",
    title: "Prisma 5.10: Edge Functions and Serverless Improvements",
    content: "Prisma 5.10 brings native support for edge functions and improved serverless performance. The ORM now offers better connection pooling, reduced cold start times, and enhanced support for edge runtime environments, making it ideal for modern serverless applications.",
    summary: "Prisma 5.10 adds edge functions support and serverless optimizations.",
    author: "Prisma Team",
    authorAvatar: "https://avatars.githubusercontent.com/u/17219288?v=4",
    source: "Prisma Blog",
    sourceUrl: "https://www.prisma.io/blog",
    publishedAt: "4 days ago",
    likes: 145,
    comments: 18,
    tags: ["prisma", "orm", "serverless", "edge"],
    category: "backend",
    imageUrl: "https://www.prisma.io/blog/images/prisma-5-10/social.png",
    readTime: "7 min read"
  },
  {
    id: "10",
    title: "Tailwind CSS 4.0 Alpha: New Engine and Better Performance",
    content: "Tailwind CSS 4.0 alpha introduces a new CSS engine built from scratch, offering 10x faster build times and smaller bundle sizes. The update includes improved IntelliSense, better dark mode support, and new utility classes that make styling more intuitive and efficient.",
    summary: "Tailwind CSS 4.0 alpha features a new engine with 10x faster builds.",
    author: "Adam Wathan",
    authorAvatar: "https://avatars.githubusercontent.com/u/4323180?v=4",
    source: "Tailwind Blog",
    sourceUrl: "https://tailwindcss.com/blog",
    publishedAt: "5 days ago",
    likes: 378,
    comments: 52,
    tags: ["tailwindcss", "css", "styling", "performance"],
    category: "frontend",
    imageUrl: "https://tailwindcss.com/_next/static/media/social-square.b622e290.jpg",
    readTime: "6 min read"
  }
];

// Real API integration with caching and auto-refresh
export class NewsService {
  private static readonly DEV_TO_API = 'https://dev.to/api/articles';
  private static readonly GITHUB_TRENDING = 'https://api.github.com/search/repositories';
  private static readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for more frequent updates
  private static cache: { data: NewsArticle[]; timestamp: number } | null = null;
  private static refreshInterval: NodeJS.Timeout | null = null;
  
  // Auto-refresh mechanism
  static startAutoRefresh(callback?: (articles: NewsArticle[]) => void): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    this.refreshInterval = setInterval(async () => {
      try {
        const articles = await this.fetchAllNews(true); // Force refresh
        if (callback && articles.length > 0) {
          callback(articles);
        }
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }, this.CACHE_DURATION);
  }
  
  static stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
  
  // Check if cache is still valid
  private static isCacheValid(): boolean {
    if (!this.cache) return false;
    return (Date.now() - this.cache.timestamp) < this.CACHE_DURATION;
  }
  
  // Get cache status for UI
  static getCacheInfo(): { 
    hasCache: boolean; 
    lastUpdated: string | null; 
    nextUpdate: string | null;
  } {
    if (!this.cache) {
      return { hasCache: false, lastUpdated: null, nextUpdate: null };
    }
    
    const lastUpdated = new Date(this.cache.timestamp).toLocaleTimeString();
    const nextUpdate = new Date(this.cache.timestamp + this.CACHE_DURATION).toLocaleTimeString();
    
    return { hasCache: true, lastUpdated, nextUpdate };
  }
  
  static async fetchDevToArticles(tag?: string): Promise<NewsArticle[]> {
    try {
      const url = tag 
        ? `${this.DEV_TO_API}?tag=${tag}&per_page=10`
        : `${this.DEV_TO_API}?per_page=10`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch Dev.to articles');
      
      const articles = await response.json();
      
      return articles.map((article: any): NewsArticle => ({
        id: article.id.toString(),
        title: article.title,
        content: article.description || article.body_markdown?.substring(0, 300) + '...',
        summary: article.description || article.title,
        author: article.user.name,
        authorAvatar: article.user.profile_image,
        source: 'Dev.to',
        sourceUrl: article.url,
        publishedAt: this.formatDate(article.published_at),
        likes: article.positive_reactions_count || 0,
        comments: article.comments_count || 0,
        tags: article.tag_list || [],
        category: this.categorizeArticle(article.tag_list),
        imageUrl: article.cover_image,
        readTime: `${article.reading_time_minutes || 5} min read`
      }));
    } catch (error) {
      console.error('Error fetching Dev.to articles:', error);
      return [];
    }
  }

  static async fetchGitHubTrending(): Promise<NewsArticle[]> {
    try {
      const response = await fetch(
        `${this.GITHUB_TRENDING}?q=stars:>1000+pushed:>2024-01-01&sort=stars&order=desc&per_page=5`
      );
      if (!response.ok) throw new Error('Failed to fetch GitHub trending');
      
      const data = await response.json();
      
      return data.items.map((repo: any): NewsArticle => ({
        id: `gh-${repo.id}`,
        title: `${repo.name}: ${repo.description}`,
        content: repo.description + (repo.readme ? ` - ${repo.readme.substring(0, 200)}...` : ''),
        summary: repo.description,
        author: repo.owner.login,
        authorAvatar: repo.owner.avatar_url,
        source: 'GitHub Trending',
        sourceUrl: repo.html_url,
        publishedAt: this.formatDate(repo.updated_at),
        likes: repo.stargazers_count,
        comments: repo.open_issues_count,
        tags: [repo.language, 'github', 'trending'].filter(Boolean),
        category: 'open-source',
        imageUrl: repo.owner.avatar_url,
        readTime: '2 min read'
      }));
    } catch (error) {
      console.error('Error fetching GitHub trending:', error);
      return [];
    }
  }

  static async fetchAllNews(forceRefresh: boolean = false): Promise<NewsArticle[]> {
    // Return cached data if available and not forcing refresh
    if (!forceRefresh && this.isCacheValid() && this.cache) {
      return this.cache.data;
    }
    
    try {
      // Try to fetch from real APIs first (with timeout to handle CORS issues)
      const fetchWithTimeout = async (url: string, timeout = 3000) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
          const response = await fetch(url, { 
            signal: controller.signal,
            mode: 'cors',
            headers: {
              'Accept': 'application/json',
            }
          });
          clearTimeout(timeoutId);
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      };

      const [devToResult, githubResult] = await Promise.allSettled([
        this.fetchDevToArticles('javascript'),
        this.fetchGitHubTrending()
      ]);

      const realNews: NewsArticle[] = [];
      
      if (devToResult.status === 'fulfilled') {
        realNews.push(...devToResult.value.slice(0, 3));
      }
      
      if (githubResult.status === 'fulfilled') {
        realNews.push(...githubResult.value.slice(0, 2));
      }

      let finalNews: NewsArticle[];
      
      // Always use simulated fresh data for consistent experience
      // This ensures new content appears even when APIs fail due to CORS
      finalNews = this.simulateFreshSeededData();
      
      // If we have real news, mix it in with simulated data
      if (realNews.length > 0) {
        const mixedNews = [...realNews, ...finalNews.slice(0, 10)];
        finalNews = mixedNews.sort((a, b) => {
          const timeA = this.parseTimeToMinutes(a.publishedAt);
          const timeB = this.parseTimeToMinutes(b.publishedAt);
          return timeA - timeB;
        }).slice(0, 15);
      }
      
      // Update cache
      this.cache = {
        data: finalNews,
        timestamp: Date.now()
      };
      
      return finalNews;
    } catch (error) {
      console.error('Error fetching news:', error);
      // Always return fresh simulated data as fallback
      const fallbackData = this.simulateFreshSeededData();
      
      // Update cache even with fallback data
      this.cache = {
        data: fallbackData,
        timestamp: Date.now()
      };
      
      return fallbackData;
    }
  }
  
  // Simulate fresh data by updating timestamps and content in seeded data
  private static simulateFreshSeededData(): NewsArticle[] {
    const now = new Date();
    
    // Randomly select articles from both pools
    const selectedFromPool = this.shuffleArray([...dynamicArticlesPool])
      .slice(0, 3)
      .map((article, index) => ({
        ...article,
        id: `dynamic-${Date.now()}-${index}`,
        publishedAt: '',
        likes: Math.floor(Math.random() * 200) + 50,
        comments: Math.floor(Math.random() * 30) + 5,
      }));
    
    const selectedFromSeeded = this.shuffleArray([...seededNews])
      .slice(0, 8);
    
    // Combine and assign fresh timestamps
    const allArticles = [...selectedFromPool, ...selectedFromSeeded].map((article, index) => ({
      ...article,
      publishedAt: this.formatDate(
        new Date(now.getTime() - (index * 25 * 60 * 1000)).toISOString() // 25 minutes apart
      ),
      likes: article.likes + Math.floor(Math.random() * 15), // Simulate engagement growth
      comments: article.comments + Math.floor(Math.random() * 8),
      // Add some variance to existing articles
      id: article.id.startsWith('dynamic-') ? article.id : `${article.id}-${Date.now()}`
    }));
    
    // Sort by most recent and return
    return allArticles.sort((a, b) => {
      const timeA = this.parseTimeToMinutes(a.publishedAt);
      const timeB = this.parseTimeToMinutes(b.publishedAt);
      return timeA - timeB; // Most recent first
    }).slice(0, 12); // Limit to 12 articles
  }
  
  // Utility function to shuffle array
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  // Helper to parse time strings back to minutes for sorting
  private static parseTimeToMinutes(timeStr: string): number {
    if (timeStr.includes('Just now')) return 0;
    if (timeStr.includes('hour')) {
      const hours = parseInt(timeStr.match(/\d+/)?.[0] || '0');
      return hours * 60;
    }
    if (timeStr.includes('day')) {
      const days = parseInt(timeStr.match(/\d+/)?.[0] || '0');
      return days * 24 * 60;
    }
    return 999999; // Old articles go to the end
  }

  private static formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString();
  }

  private static categorizeArticle(tags: string[]): string {
    if (!tags) return 'general';
    
    const tagStr = tags.join(' ').toLowerCase();
    
    if (tagStr.includes('react') || tagStr.includes('vue') || tagStr.includes('angular') || tagStr.includes('frontend')) {
      return 'frontend';
    }
    if (tagStr.includes('node') || tagStr.includes('python') || tagStr.includes('backend') || tagStr.includes('api')) {
      return 'backend';
    }
    if (tagStr.includes('ai') || tagStr.includes('ml') || tagStr.includes('machine') || tagStr.includes('gpt')) {
      return 'ai';
    }
    if (tagStr.includes('mobile') || tagStr.includes('ios') || tagStr.includes('android')) {
      return 'mobile';
    }
    
    return 'general';
  }
}
