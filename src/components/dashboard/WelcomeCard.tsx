
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";

const WelcomeCard = () => {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);
  
  const today = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }, []);

  return (
    <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold">{greeting}, Developer!</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Today is {today}</p>
        <div className="mt-4">
          <p className="text-sm opacity-90">
            You have 3 tasks due today and 2 pull requests waiting for review.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeCard;
