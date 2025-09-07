
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  lordIcon?: {
    src: string;
    trigger?: 'hover' | 'click' | 'loop' | 'morph' | 'boomerang';
    colors?: string;
  };
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatsCard = ({ title, value, description, icon, lordIcon, trend }: StatsCardProps) => {
  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center justify-center">
          {lordIcon ? (
            <lord-icon
              src={lordIcon.src}
              trigger={lordIcon.trigger || 'hover'}
              colors={lordIcon.colors}
              style={{ width: '32px', height: '32px' }}
            />
          ) : (
            <div className="p-1 bg-secondary rounded-md">{icon}</div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        
        {trend && (
          <div className={`flex items-center mt-2 text-xs ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
            <span>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
            <span className="ml-1 text-muted-foreground">vs last week</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
