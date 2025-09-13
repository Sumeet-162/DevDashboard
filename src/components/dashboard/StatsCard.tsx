
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BorderTrail } from "@/components/ui/border-trail";
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
    <Card className="card-hover relative">
      <BorderTrail 
        style={{
          boxShadow:
            "0px 0px 60px 30px rgb(255 255 255 / 50%), 0 0 100px 60px rgb(0 0 0 / 50%), 0 0 140px 90px rgb(0 0 0 / 50%)",
        }}
        size={100}
      />
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="flex items-center justify-center">
          {lordIcon ? (
            <lord-icon
              src={lordIcon.src}
              trigger={lordIcon.trigger || 'hover'}
              colors={lordIcon.colors}
              style={{ width: '24px', height: '24px' }}
            />
          ) : (
            <div className="p-1.5 bg-secondary rounded-md">{icon}</div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        
        {trend && (
          <div className={`flex items-center mt-2 text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <span>
              {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
            </span>
            <span className="ml-1 text-muted-foreground">vs last week</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
