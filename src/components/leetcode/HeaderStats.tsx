
import { Card, CardContent } from "@/components/ui/card";
import { Code, Trophy, Flame, TrendingUp } from "lucide-react";

interface HeaderStatsProps {
  totalSolved: number;
  solvedPercentage: number;
  ranking: number;
  streak: number;
  acceptanceRate: number;
}

const HeaderStats = ({ totalSolved, solvedPercentage, ranking, streak, acceptanceRate }: HeaderStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="card-hover">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Problems Solved</p>
              <p className="text-2xl font-bold">{totalSolved}</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              <Code size={20} />
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {solvedPercentage}% of all problems
          </div>
        </CardContent>
      </Card>
      
      <Card className="card-hover">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Ranking</p>
              <p className="text-2xl font-bold">#{ranking}</p>
            </div>
            <div className="p-2 bg-amber-100 rounded-full text-amber-600">
              <Trophy size={20} />
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Global LeetCode ranking
          </div>
        </CardContent>
      </Card>
      
      <Card className="card-hover">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Current Streak</p>
              <p className="text-2xl font-bold">{streak} days</p>
            </div>
            <div className="p-2 bg-red-100 rounded-full text-red-600">
              <Flame size={20} />
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Keep it going!
          </div>
        </CardContent>
      </Card>
      
      <Card className="card-hover">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Acceptance Rate</p>
              <p className="text-2xl font-bold">{acceptanceRate}%</p>
            </div>
            <div className="p-2 bg-green-100 rounded-full text-green-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Solution acceptance rate
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HeaderStats;
