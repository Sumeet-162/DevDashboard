
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Mock data for the LeetCode card
const leetCodeData = {
  solved: 143,
  easy: { solved: 78, total: 150 },
  medium: { solved: 52, total: 300 },
  hard: { solved: 13, total: 150 },
  streak: 5,
};

const LeetCodeCard = () => {
  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold flex items-center">
          <Code className="mr-2" size={18} /> LeetCode Progress
        </CardTitle>
        <Button variant="outline" size="sm">View Profile</Button>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Problems Solved</p>
            <p className="text-2xl font-bold">{leetCodeData.solved}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Streak</p>
            <p className="text-2xl font-bold">{leetCodeData.streak} days</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1 text-sm">
              <span className="text-green-500">Easy ({leetCodeData.easy.solved}/{leetCodeData.easy.total})</span>
              <span>{Math.round((leetCodeData.easy.solved / leetCodeData.easy.total) * 100)}%</span>
            </div>
            <Progress 
              value={(leetCodeData.easy.solved / leetCodeData.easy.total) * 100} 
              className="h-2 bg-muted [--progress-color:rgb(34_197_94)]" 
            />
          </div>
          
          <div>
            <div className="flex justify-between mb-1 text-sm">
              <span className="text-yellow-500">Medium ({leetCodeData.medium.solved}/{leetCodeData.medium.total})</span>
              <span>{Math.round((leetCodeData.medium.solved / leetCodeData.medium.total) * 100)}%</span>
            </div>
            <Progress 
              value={(leetCodeData.medium.solved / leetCodeData.medium.total) * 100} 
              className="h-2 bg-muted [--progress-color:rgb(234_179_8)]"
            />
          </div>
          
          <div>
            <div className="flex justify-between mb-1 text-sm">
              <span className="text-red-500">Hard ({leetCodeData.hard.solved}/{leetCodeData.hard.total})</span>
              <span>{Math.round((leetCodeData.hard.solved / leetCodeData.hard.total) * 100)}%</span>
            </div>
            <Progress 
              value={(leetCodeData.hard.solved / leetCodeData.hard.total) * 100} 
              className="h-2 bg-muted [--progress-color:rgb(239_68_68)]"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeetCodeCard;
