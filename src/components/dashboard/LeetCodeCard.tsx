
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BorderTrail } from "@/components/ui/border-trail";
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
    <Card className="card-hover relative">
      <BorderTrail 
        style={{
          boxShadow:
            "0px 0px 60px 30px rgb(255 255 255 / 50%), 0 0 100px 60px rgb(0 0 0 / 50%), 0 0 140px 90px rgb(0 0 0 / 50%)",
        }}
        size={100}
      />
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Code2 className="h-4 w-4" />
          LeetCode Progress
        </CardTitle>
        <Button variant="outline" size="sm" className="text-xs">View Profile</Button>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Problems Solved</p>
            <p className="text-xl font-bold">{leetCodeData.solved}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Current Streak</p>
            <p className="text-xl font-bold">{leetCodeData.streak} days</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1 text-xs">
              <span className="text-green-600 font-medium">Easy ({leetCodeData.easy.solved}/{leetCodeData.easy.total})</span>
              <span className="font-medium">{Math.round((leetCodeData.easy.solved / leetCodeData.easy.total) * 100)}%</span>
            </div>
            <Progress 
              value={(leetCodeData.easy.solved / leetCodeData.easy.total) * 100} 
              className="h-2 bg-muted [--progress-color:rgb(34_197_94)]" 
            />
          </div>
          
          <div>
            <div className="flex justify-between mb-1 text-xs">
              <span className="text-yellow-600 font-medium">Medium ({leetCodeData.medium.solved}/{leetCodeData.medium.total})</span>
              <span className="font-medium">{Math.round((leetCodeData.medium.solved / leetCodeData.medium.total) * 100)}%</span>
            </div>
            <Progress 
              value={(leetCodeData.medium.solved / leetCodeData.medium.total) * 100} 
              className="h-2 bg-muted [--progress-color:rgb(234_179_8)]"
            />
          </div>
          
          <div>
            <div className="flex justify-between mb-1 text-xs">
              <span className="text-red-600 font-medium">Hard ({leetCodeData.hard.solved}/{leetCodeData.hard.total})</span>
              <span className="font-medium">{Math.round((leetCodeData.hard.solved / leetCodeData.hard.total) * 100)}%</span>
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
