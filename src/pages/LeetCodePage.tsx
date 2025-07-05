
import Layout from "@/components/layout/Layout";
import HeaderStats from "@/components/leetcode/HeaderStats";
import DifficultyBreakdown from "@/components/leetcode/DifficultyBreakdown";
import ProgressChart from "@/components/leetcode/ProgressChart";
import RecentSubmissions from "@/components/leetcode/RecentSubmissions";
import TopicsMastery from "@/components/leetcode/TopicsMastery";

// Mock data for LeetCode
const leetcodeData = {
  user: {
    username: "developer_username",
    ranking: 42530,
    totalSolved: 143,
    easy: { solved: 78, total: 150 },
    medium: { solved: 52, total: 300 },
    hard: { solved: 13, total: 150 },
    acceptanceRate: 67.4,
    streak: 5,
    points: 2430,
    badge: "Problem Solver"
  },
  recentSubmissions: [
    {
      problemId: 121,
      title: "Best Time to Buy and Sell Stock",
      difficulty: "Easy",
      status: "Accepted",
      runtime: "76 ms",
      memory: "48.2 MB",
      language: "JavaScript",
      date: "1 day ago"
    },
    {
      problemId: 20,
      title: "Valid Parentheses",
      difficulty: "Easy",
      status: "Accepted",
      runtime: "65 ms",
      memory: "42.1 MB",
      language: "TypeScript",
      date: "2 days ago"
    },
    {
      problemId: 146,
      title: "LRU Cache",
      difficulty: "Medium",
      status: "Wrong Answer",
      runtime: "-",
      memory: "-",
      language: "JavaScript",
      date: "2 days ago"
    },
    {
      problemId: 146,
      title: "LRU Cache",
      difficulty: "Medium",
      status: "Accepted",
      runtime: "192 ms",
      memory: "78.4 MB",
      language: "JavaScript",
      date: "2 days ago"
    },
    {
      problemId: 200,
      title: "Number of Islands",
      difficulty: "Medium",
      status: "Accepted",
      runtime: "87 ms",
      memory: "44.9 MB",
      language: "TypeScript",
      date: "4 days ago"
    }
  ],
  progressChart: [
    { date: "May 10", problems: 112 },
    { date: "May 17", problems: 118 },
    { date: "May 24", problems: 123 },
    { date: "May 31", problems: 128 },
    { date: "Jun 7", problems: 135 },
    { date: "Jun 14", problems: 143 }
  ]
};

// Topic distribution data
const topicDistribution = [
  { name: "Arrays & Strings", value: 45 },
  { name: "Trees & Graphs", value: 28 },
  { name: "Dynamic Programming", value: 22 },
  { name: "Linked Lists", value: 18 },
  { name: "Sorting & Searching", value: 15 },
  { name: "Other", value: 15 }
];

const LeetCodePage = () => {
  const { user, recentSubmissions, progressChart } = leetcodeData;
  
  // Calculate total and solved problems
  const totalProblems = user.easy.total + user.medium.total + user.hard.total;
  const totalSolved = user.easy.solved + user.medium.solved + user.hard.solved;
  const solvedPercentage = Math.round((totalSolved / totalProblems) * 100);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Stats */}
        <HeaderStats 
          totalSolved={user.totalSolved} 
          solvedPercentage={solvedPercentage}
          ranking={user.ranking}
          streak={user.streak}
          acceptanceRate={user.acceptanceRate}
        />
        
        {/* Progress Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Distribution by Difficulty */}
          <DifficultyBreakdown 
            easySolved={user.easy.solved}
            easyTotal={user.easy.total}
            mediumSolved={user.medium.solved}
            mediumTotal={user.medium.total}
            hardSolved={user.hard.solved}
            hardTotal={user.hard.total}
          />
          
          {/* Progress Chart */}
          <ProgressChart progressData={progressChart} />
        </div>
        
        {/* Recent Activity & Topics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Submissions */}
          <RecentSubmissions submissions={recentSubmissions} />
          
          {/* Topics */}
          <TopicsMastery topicDistribution={topicDistribution} />
        </div>
      </div>
    </Layout>
  );
};

export default LeetCodePage;
