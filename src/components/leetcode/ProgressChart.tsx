
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

interface ProgressChartProps {
  progressData: Array<{
    date: string;
    problems: number;
  }>;
}

const ProgressChart = ({ progressData }: ProgressChartProps) => {
  return (
    <Card className="card-hover lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Problem Solving Progress</CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
};

export default ProgressChart;
