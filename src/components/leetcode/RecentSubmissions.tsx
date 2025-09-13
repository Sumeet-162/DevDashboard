
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User, ExternalLink } from "lucide-react";
import { Submission } from "@/services/leetcodeService";

interface RecentSubmissionsProps {
  submissions: Submission[];
  username?: string;
  isRealData?: boolean;
}

const RecentSubmissions = ({ submissions, username, isRealData }: RecentSubmissionsProps) => {
  return (
    <Card className="card-hover">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Recent Submissions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {submissions.map((submission, index) => (
            <div key={index} className="border rounded-lg p-3">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-medium text-sm">{submission.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      submission.difficulty === 'Easy' ? 'bg-green-100 text-green-600' :
                      submission.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {submission.difficulty}
                    </span>
                    <span className="text-xs">{submission.language}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    submission.status === 'Accepted' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {submission.status}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <Clock size={12} className="mr-1" /> {submission.date}
                  </p>
                </div>
              </div>
              
              {submission.status === 'Accepted' && submission.runtime && submission.memory && (
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Runtime: {submission.runtime}</span>
                  <span>Memory: {submission.memory}</span>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <Button 
          variant="outline" 
          className="w-full mt-4 text-sm"
          onClick={() => {
            if (username && username !== 'demo-user' && username !== 'developer_coder') {
              window.open(`https://leetcode.com/${username}/`, '_blank');
            } else {
              window.open('https://leetcode.com/problemset/all/', '_blank');
            }
          }}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View All Submissions
        </Button>
      </CardContent>
    </Card>
  );
};

export default RecentSubmissions;
