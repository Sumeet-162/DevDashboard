import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ContributionDay {
  date: string;
  count: number;
  level: number;
}

interface ContributionGraphProps {
  contributions: ContributionDay[];
  totalContributions: number;
  className?: string;
}

export const ContributionGraph = ({ 
  contributions, 
  totalContributions, 
  className = "" 
}: ContributionGraphProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-32 bg-muted rounded"></div>
      </div>
    );
  }

  // Create a proper 53-week grid (52 weeks + partial week)
  const weeks: (ContributionDay | null)[][] = [];
  
  // Get the first Sunday of the range (GitHub starts from Sunday)
  const today = new Date();
  const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
  
  // Find the first Sunday
  const firstSunday = new Date(oneYearAgo);
  firstSunday.setDate(firstSunday.getDate() - firstSunday.getDay());
  
  // Create 53 weeks of 7 days each
  for (let weekIndex = 0; weekIndex < 53; weekIndex++) {
    const week: (ContributionDay | null)[] = [];
    
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const currentDate = new Date(firstSunday.getTime() + (weekIndex * 7 + dayIndex) * 24 * 60 * 60 * 1000);
      
      // Only show dates within the last year and not in the future
      if (currentDate <= today && currentDate >= oneYearAgo) {
        const dateString = currentDate.toISOString().split('T')[0];
        const contribution = contributions.find(c => c.date === dateString);
        
        if (contribution) {
          week.push(contribution);
        } else {
          // Add empty contribution for dates without data
          week.push({
            date: dateString,
            count: 0,
            level: 0
          });
        }
      } else {
        week.push(null); // Empty cell for dates outside range
      }
    }
    
    weeks.push(week);
  }

  const getIntensityColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-muted hover:bg-muted/80';
      case 1: return 'bg-green-100 hover:bg-green-200 dark:bg-green-900/50 dark:hover:bg-green-900/70';
      case 2: return 'bg-green-300 hover:bg-green-400 dark:bg-green-700/80 dark:hover:bg-green-700';
      case 3: return 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500';
      case 4: return 'bg-green-700 hover:bg-green-800 dark:bg-green-500 dark:hover:bg-green-400';
      default: return 'bg-muted hover:bg-muted/80';
    }
  };

  const formatTooltipDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getMonthLabel = (weekIndex: number) => {
    const date = new Date(firstSunday.getTime() + weekIndex * 7 * 24 * 60 * 60 * 1000);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Only show month label when it's the first week of a new month
    const prevWeekDate = new Date(firstSunday.getTime() + (weekIndex - 1) * 7 * 24 * 60 * 60 * 1000);
    const isNewMonth = weekIndex === 0 || date.getMonth() !== prevWeekDate.getMonth();
    
    return isNewMonth ? monthNames[date.getMonth()] : '';
  };

  return (
    <TooltipProvider>
      <div className={`space-y-3 ${className}`}>
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-medium">
            {totalContributions} contributions in the last year
          </h3>
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(level => (
                <div 
                  key={level}
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-[2px] ${getIntensityColor(level)}`}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>

        {/* Graph Container with horizontal scroll */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[600px] sm:min-w-[700px] lg:min-w-[800px]">
            <div className="flex gap-1">
              {/* Day labels column */}
              <div className="flex flex-col justify-around text-xs sm:text-sm text-muted-foreground pr-2 sm:pr-3 h-[120px] sm:h-[140px] lg:h-[160px] flex-shrink-0">
                <span></span> {/* Sunday - empty */}
                <span className="hidden sm:inline">Mon</span>
                <span className="sm:hidden">M</span>
                <span></span> {/* Tuesday - empty */}
                <span className="hidden sm:inline">Wed</span>
                <span className="sm:hidden">W</span>
                <span></span> {/* Thursday - empty */}
                <span className="hidden sm:inline">Fri</span>
                <span className="sm:hidden">F</span>
                <span></span> {/* Saturday - empty */}
              </div>

              {/* Contribution grid */}
              <div className="flex flex-col flex-1">
                {/* Month labels row */}
                <div className="flex mb-2 h-4 sm:h-5 justify-between">
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="text-xs sm:text-sm text-muted-foreground text-center flex-1">
                      {getMonthLabel(weekIndex)}
                    </div>
                  ))}
                </div>

                {/* Days grid */}
                <div className="flex gap-[1px] justify-between">
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-[1px]">
                      {week.map((day, dayIndex) => (
                        <div key={`${weekIndex}-${dayIndex}`}>
                          {day ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`w-[10px] h-[10px] sm:w-[12px] sm:h-[12px] lg:w-[14px] lg:h-[14px] rounded-[2px] cursor-pointer transition-all duration-200 hover:scale-110 ${
                                    getIntensityColor(day.level)
                                  }`}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-center">
                                  <p className="font-medium">
                                    {day.count} contribution{day.count !== 1 ? 's' : ''}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatTooltipDate(day.date)}
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <div className="w-[10px] h-[10px] sm:w-[12px] sm:h-[12px] lg:w-[14px] lg:h-[14px]" />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
