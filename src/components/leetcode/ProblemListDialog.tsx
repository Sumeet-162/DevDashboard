import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, CheckCircle, Clock, Tag, RefreshCw } from "lucide-react";
import { SimpleLeetCodeApi, LeetCodeProblem } from '@/services/simpleLeetCodeApi';

interface ProblemListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  difficulty: 'Easy' | 'Medium' | 'Hard' | null;
}

const ProblemListDialog = ({ isOpen, onClose, difficulty }: ProblemListDialogProps) => {
  const [problems, setProblems] = useState<LeetCodeProblem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && difficulty) {
      fetchProblems();
    }
  }, [isOpen, difficulty]);

  const fetchProblems = async () => {
    if (!difficulty) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const problemList = await SimpleLeetCodeApi.fetchProblemsByDifficulty(difficulty);
      setProblems(problemList);
    } catch (error) {
      console.error('Error fetching problems:', error);
      setError('Failed to fetch problems. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-50 border-green-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Hard': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const openLeetCodeProblem = (titleSlug: string) => {
    window.open(`https://leetcode.com/problems/${titleSlug}/`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>
                {difficulty} Problems
              </span>
              {difficulty && (
                <Badge className={getDifficultyColor(difficulty)}>
                  {difficulty}
                </Badge>
              )}
            </div>
            {!loading && (
              <Button
                onClick={fetchProblems}
                variant="outline"
                size="sm"
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchProblems} variant="outline">
                Try Again
              </Button>
            </div>
          )}

          {!loading && !error && problems.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No problems found for {difficulty} difficulty.</p>
            </div>
          )}

          {!loading && !error && problems.length > 0 && (
            <div className="space-y-4">
              {problems.map((problem) => (
                <Card key={problem.frontendQuestionId} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">
                            {problem.frontendQuestionId}. {problem.title}
                          </h3>
                          {problem.status === 'ac' && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 mb-3">
                          <Badge className={getDifficultyColor(problem.difficulty)}>
                            {problem.difficulty}
                          </Badge>
                          
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {problem.acRate.toFixed(1)}% acceptance
                          </div>
                          
                          {problem.hasSolution && (
                            <Badge variant="outline" className="text-xs">
                              Has Solution
                            </Badge>
                          )}
                          
                          {problem.hasVideoSolution && (
                            <Badge variant="outline" className="text-xs">
                              Video Solution
                            </Badge>
                          )}
                        </div>

                        {problem.topicTags && problem.topicTags.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <Tag className="h-3 w-3 text-muted-foreground" />
                            {problem.topicTags.slice(0, 4).map((tag) => (
                              <Badge 
                                key={tag.slug} 
                                variant="secondary" 
                                className="text-xs"
                              >
                                {tag.name}
                              </Badge>
                            ))}
                            {problem.topicTags.length > 4 && (
                              <Badge variant="secondary" className="text-xs">
                                +{problem.topicTags.length - 4} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <Button
                        onClick={() => openLeetCodeProblem(problem.titleSlug)}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Solve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProblemListDialog;
