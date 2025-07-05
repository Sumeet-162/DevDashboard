
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

interface DifficultyBreakdownProps {
  easySolved: number;
  easyTotal: number;
  mediumSolved: number;
  mediumTotal: number;
  hardSolved: number;
  hardTotal: number;
}

const DifficultyBreakdown = ({ 
  easySolved, 
  easyTotal, 
  mediumSolved, 
  mediumTotal, 
  hardSolved, 
  hardTotal 
}: DifficultyBreakdownProps) => {
  // Colors for the pie chart
  const COLORS = ["#22c55e", "#eab308", "#ef4444"];
  
  // Prepare data for the pie chart
  const pieData = [
    { name: "Easy", value: easySolved },
    { name: "Medium", value: mediumSolved },
    { name: "Hard", value: hardSolved }
  ];

  return (
    <Card className="card-hover">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Difficulty Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center">
          <PieChart width={200} height={200}>
            <Pie
              data={pieData}
              cx={100}
              cy={100}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div>
            <div className="flex justify-between mb-1 text-xs">
              <span className="text-green-500">Easy</span>
              <span>{Math.round((easySolved / easyTotal) * 100)}%</span>
            </div>
            <Progress 
              value={(easySolved / easyTotal) * 100} 
              className="h-1.5 bg-muted [--progress-color:rgb(34_197_94)]" 
            />
            <div className="text-xs text-muted-foreground mt-1">
              {easySolved}/{easyTotal}
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1 text-xs">
              <span className="text-yellow-500">Medium</span>
              <span>{Math.round((mediumSolved / mediumTotal) * 100)}%</span>
            </div>
            <Progress 
              value={(mediumSolved / mediumTotal) * 100}  
              className="h-1.5 bg-muted [--progress-color:rgb(234_179_8)]" 
            />
            <div className="text-xs text-muted-foreground mt-1">
              {mediumSolved}/{mediumTotal}
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1 text-xs">
              <span className="text-red-500">Hard</span>
              <span>{Math.round((hardSolved / hardTotal) * 100)}%</span>
            </div>
            <Progress 
              value={(hardSolved / hardTotal) * 100} 
              className="h-1.5 bg-muted [--progress-color:rgb(239_68_68)]" 
            />
            <div className="text-xs text-muted-foreground mt-1">
              {hardSolved}/{hardTotal}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DifficultyBreakdown;
