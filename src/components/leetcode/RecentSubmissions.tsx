
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface Submission {
  problemId: number;
  title: string;
  difficulty: string;
  status: string;
  runtime: string;
  memory: string;
  language: string;
  date: string;
}

interface RecentSubmissionsProps {
  submissions: Submission[];
}

const RecentSubmissions = ({ submissions }: RecentSubmissionsProps) => {
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
                  <h3 className="font-medium">{submission.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span className={`px-1.5 py-0.5 rounded ${
                      submission.difficulty === 'Easy' ? 'bg-green-100 text-green-600' :
                      submission.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {submission.difficulty}
                    </span>
                    <span>#{submission.problemId}</span>
                    <span>{submission.language}</span>
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
              
              {submission.status === 'Accepted' && (
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Runtime: {submission.runtime}</span>
                  <span>Memory: {submission.memory}</span>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <Button variant="outline" className="w-full mt-4">View All Submissions</Button>
      </CardContent>
    </Card>
  );
};

export default RecentSubmissions;
