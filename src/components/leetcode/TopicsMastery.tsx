
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy } from "lucide-react";

interface TopicDistribution {
  name: string;
  value: number;
}

interface TopicsMasteryProps {
  topicDistribution: TopicDistribution[];
}

const TopicsMastery = ({ topicDistribution }: TopicsMasteryProps) => {
  return (
    <Card className="card-hover">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Topics Mastery</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="distribution">
          <TabsList className="mb-4">
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>
          
          <TabsContent value="distribution">
            <div className="space-y-4">
              {topicDistribution.map((topic, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{topic.name}</span>
                    <span>{topic.value}</span>
                  </div>
                  <Progress value={topic.value} max={45} className="h-2" />
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="progress">
            <div className="space-y-4 text-center pt-8 pb-6">
              <Trophy size={40} className="mx-auto text-yellow-400" />
              <p>Topic progress tracking is coming soon!</p>
              <p className="text-sm text-muted-foreground">
                We're working on a more detailed breakdown of your progress by topic.
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        <Button className="w-full mt-4">Practice Weak Topics</Button>
      </CardContent>
    </Card>
  );
};

export default TopicsMastery;
