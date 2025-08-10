
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
import { User } from "lucide-react";

interface ProgressChartProps {
  progressData: Array<{
    date: string;
    problems: number;
  }>;
  username?: string;
  isRealData?: boolean;
}

const ProgressChart = ({ progressData, username, isRealData }: ProgressChartProps) => {
  // Check if all data points are zero
  const isAllZero = progressData.every(point => point.problems === 0);
  
  return (
    <Card className="card-hover lg:col-span-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">Problem Solving Progress</CardTitle>
            <Badge variant="secondary" className="text-xs">
              Last 6 Months
            </Badge>
          </div>
          {isAllZero && (
            <Badge variant="outline" className="text-xs">
              Ready to start! 🚀
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isAllZero ? (
          <div className="h-64 flex items-center justify-center text-center">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">
                No problems solved yet. Start your coding journey! 💪
              </p>
              <p className="text-xs text-muted-foreground">
                Your progress will be tracked here as you solve LeetCode problems
              </p>
            </div>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={progressData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="problems" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.2} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgressChart;
