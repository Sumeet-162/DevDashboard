
import Layout from "@/components/layout/Layout";
import WelcomeCard from "@/components/dashboard/WelcomeCard";
import StatsCard from "@/components/dashboard/StatsCard";
import GitHubCard from "@/components/dashboard/GitHubCard";
import LeetCodeCard from "@/components/dashboard/LeetCodeCard";
import NewsCard from "@/components/dashboard/NewsCard";
import PostCard from "@/components/dashboard/PostCard";
import { Code, Github, MessageSquare, User } from "lucide-react";

const Index = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <WelcomeCard />
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatsCard 
            title="GitHub Contributions" 
            value={127}
            description="Last 30 days"
            icon={<Github size={16} />}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard 
            title="LeetCode Problems" 
            value={143}
            description="Total solved"
            icon={<Code size={16} />}
            trend={{ value: 8, isPositive: true }}
          />
          <StatsCard 
            title="Community Posts" 
            value={24}
            description="Your contributions"
            icon={<MessageSquare size={16} />}
            trend={{ value: 3, isPositive: false }}
          />
          <StatsCard 
            title="Profile Views" 
            value={210}
            description="Last 30 days"
            icon={<User size={16} />}
            trend={{ value: 15, isPositive: true }}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GitHubCard />
          <LeetCodeCard />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NewsCard />
          <PostCard />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
