
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Trophy, 
  Target, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  Circle,
  ArrowLeft,
  Filter,
  BookOpen,
  Code2,
  Database,
  Network,
  Zap,
  TreePine,
  Hash,
  GitBranch
} from "lucide-react";

interface TopicStats {
  name: string;
  solved: number;
  total: number;
  percentage: number;
  recentActivity: number;
}

interface TopicsMasteryProps {
  topicDistribution: TopicStats[];
  username?: string;
  isRealData?: boolean;
}

interface Problem {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  url: string;
  completed: boolean;
  tags: string[];
}

interface TopicCategory {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  problems: Problem[];
  color: string;
  mastery: number;
}

const TopicsMastery = ({ topicDistribution, username, isRealData }: TopicsMasteryProps) => {
  const [selectedTopic, setSelectedTopic] = useState<TopicCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);
  const [completedProblems, setCompletedProblems] = useState<Set<number>>(new Set());

  // Comprehensive topic categories with real LeetCode problems
  const topicCategories: TopicCategory[] = [
    {
      id: 'array',
      name: 'Array',
      icon: Database,
      description: 'Array manipulation, traversal, and optimization problems',
      color: 'bg-blue-500',
      mastery: 75,
      problems: [
        { id: 1, title: "Two Sum", difficulty: 'Easy', url: "https://leetcode.com/problems/two-sum/", completed: false, tags: ['array', 'hash-table'] },
        { id: 26, title: "Remove Duplicates from Sorted Array", difficulty: 'Easy', url: "https://leetcode.com/problems/remove-duplicates-from-sorted-array/", completed: false, tags: ['array', 'two-pointers'] },
        { id: 121, title: "Best Time to Buy and Sell Stock", difficulty: 'Easy', url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", completed: false, tags: ['array', 'dynamic-programming'] },
        { id: 238, title: "Product of Array Except Self", difficulty: 'Medium', url: "https://leetcode.com/problems/product-of-array-except-self/", completed: false, tags: ['array', 'prefix-sum'] },
        { id: 53, title: "Maximum Subarray", difficulty: 'Medium', url: "https://leetcode.com/problems/maximum-subarray/", completed: false, tags: ['array', 'dynamic-programming'] },
        { id: 4, title: "Median of Two Sorted Arrays", difficulty: 'Hard', url: "https://leetcode.com/problems/median-of-two-sorted-arrays/", completed: false, tags: ['array', 'binary-search'] }
      ]
    },
    {
      id: 'linked-list',
      name: 'Linked List',
      icon: GitBranch,
      description: 'Single, double, and circular linked list operations',
      color: 'bg-green-500',
      mastery: 60,
      problems: [
        { id: 206, title: "Reverse Linked List", difficulty: 'Easy', url: "https://leetcode.com/problems/reverse-linked-list/", completed: false, tags: ['linked-list', 'recursion'] },
        { id: 21, title: "Merge Two Sorted Lists", difficulty: 'Easy', url: "https://leetcode.com/problems/merge-two-sorted-lists/", completed: false, tags: ['linked-list', 'recursion'] },
        { id: 141, title: "Linked List Cycle", difficulty: 'Easy', url: "https://leetcode.com/problems/linked-list-cycle/", completed: false, tags: ['linked-list', 'two-pointers'] },
        { id: 2, title: "Add Two Numbers", difficulty: 'Medium', url: "https://leetcode.com/problems/add-two-numbers/", completed: false, tags: ['linked-list', 'math'] },
        { id: 19, title: "Remove Nth Node From End of List", difficulty: 'Medium', url: "https://leetcode.com/problems/remove-nth-node-from-end-of-list/", completed: false, tags: ['linked-list', 'two-pointers'] },
        { id: 25, title: "Reverse Nodes in k-Group", difficulty: 'Hard', url: "https://leetcode.com/problems/reverse-nodes-in-k-group/", completed: false, tags: ['linked-list', 'recursion'] }
      ]
    },
    {
      id: 'hash-table',
      name: 'Hash Table',
      icon: Hash,
      description: 'Hash maps, sets, and frequency counting problems',
      color: 'bg-purple-500',
      mastery: 85,
      problems: [
        { id: 1, title: "Two Sum", difficulty: 'Easy', url: "https://leetcode.com/problems/two-sum/", completed: false, tags: ['array', 'hash-table'] },
        { id: 242, title: "Valid Anagram", difficulty: 'Easy', url: "https://leetcode.com/problems/valid-anagram/", completed: false, tags: ['hash-table', 'string'] },
        { id: 49, title: "Group Anagrams", difficulty: 'Medium', url: "https://leetcode.com/problems/group-anagrams/", completed: false, tags: ['array', 'hash-table'] },
        { id: 3, title: "Longest Substring Without Repeating Characters", difficulty: 'Medium', url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", completed: false, tags: ['hash-table', 'string'] },
        { id: 146, title: "LRU Cache", difficulty: 'Medium', url: "https://leetcode.com/problems/lru-cache/", completed: false, tags: ['hash-table', 'linked-list'] },
        { id: 76, title: "Minimum Window Substring", difficulty: 'Hard', url: "https://leetcode.com/problems/minimum-window-substring/", completed: false, tags: ['hash-table', 'string'] }
      ]
    },
    {
      id: 'binary-tree',
      name: 'Binary Tree',
      icon: TreePine,
      description: 'Tree traversal, manipulation, and search algorithms',
      color: 'bg-emerald-500',
      mastery: 45,
      problems: [
        { id: 104, title: "Maximum Depth of Binary Tree", difficulty: 'Easy', url: "https://leetcode.com/problems/maximum-depth-of-binary-tree/", completed: false, tags: ['tree', 'depth-first-search'] },
        { id: 226, title: "Invert Binary Tree", difficulty: 'Easy', url: "https://leetcode.com/problems/invert-binary-tree/", completed: false, tags: ['tree', 'depth-first-search'] },
        { id: 102, title: "Binary Tree Level Order Traversal", difficulty: 'Medium', url: "https://leetcode.com/problems/binary-tree-level-order-traversal/", completed: false, tags: ['tree', 'breadth-first-search'] },
        { id: 98, title: "Validate Binary Search Tree", difficulty: 'Medium', url: "https://leetcode.com/problems/validate-binary-search-tree/", completed: false, tags: ['tree', 'depth-first-search'] },
        { id: 236, title: "Lowest Common Ancestor of a Binary Tree", difficulty: 'Medium', url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/", completed: false, tags: ['tree', 'depth-first-search'] },
        { id: 124, title: "Binary Tree Maximum Path Sum", difficulty: 'Hard', url: "https://leetcode.com/problems/binary-tree-maximum-path-sum/", completed: false, tags: ['tree', 'depth-first-search'] }
      ]
    },
    {
      id: 'dynamic-programming',
      name: 'Dynamic Programming',
      icon: Zap,
      description: 'Optimization problems with overlapping subproblems',
      color: 'bg-yellow-500',
      mastery: 30,
      problems: [
        { id: 70, title: "Climbing Stairs", difficulty: 'Easy', url: "https://leetcode.com/problems/climbing-stairs/", completed: false, tags: ['math', 'dynamic-programming'] },
        { id: 198, title: "House Robber", difficulty: 'Medium', url: "https://leetcode.com/problems/house-robber/", completed: false, tags: ['array', 'dynamic-programming'] },
        { id: 322, title: "Coin Change", difficulty: 'Medium', url: "https://leetcode.com/problems/coin-change/", completed: false, tags: ['array', 'dynamic-programming'] },
        { id: 300, title: "Longest Increasing Subsequence", difficulty: 'Medium', url: "https://leetcode.com/problems/longest-increasing-subsequence/", completed: false, tags: ['array', 'dynamic-programming'] },
        { id: 416, title: "Partition Equal Subset Sum", difficulty: 'Medium', url: "https://leetcode.com/problems/partition-equal-subset-sum/", completed: false, tags: ['array', 'dynamic-programming'] },
        { id: 72, title: "Edit Distance", difficulty: 'Hard', url: "https://leetcode.com/problems/edit-distance/", completed: false, tags: ['string', 'dynamic-programming'] }
      ]
    },
    {
      id: 'string',
      name: 'String',
      icon: BookOpen,
      description: 'String manipulation, pattern matching, and parsing',
      color: 'bg-pink-500',
      mastery: 70,
      problems: [
        { id: 125, title: "Valid Palindrome", difficulty: 'Easy', url: "https://leetcode.com/problems/valid-palindrome/", completed: false, tags: ['two-pointers', 'string'] },
        { id: 242, title: "Valid Anagram", difficulty: 'Easy', url: "https://leetcode.com/problems/valid-anagram/", completed: false, tags: ['hash-table', 'string'] },
        { id: 5, title: "Longest Palindromic Substring", difficulty: 'Medium', url: "https://leetcode.com/problems/longest-palindromic-substring/", completed: false, tags: ['string', 'dynamic-programming'] },
        { id: 49, title: "Group Anagrams", difficulty: 'Medium', url: "https://leetcode.com/problems/group-anagrams/", completed: false, tags: ['array', 'hash-table', 'string'] },
        { id: 647, title: "Palindromic Substrings", difficulty: 'Medium', url: "https://leetcode.com/problems/palindromic-substrings/", completed: false, tags: ['string', 'dynamic-programming'] },
        { id: 10, title: "Regular Expression Matching", difficulty: 'Hard', url: "https://leetcode.com/problems/regular-expression-matching/", completed: false, tags: ['string', 'dynamic-programming'] }
      ]
    },
    {
      id: 'graph',
      name: 'Graph',
      icon: Network,
      description: 'Graph traversal, shortest path, and connectivity problems',
      color: 'bg-red-500',
      mastery: 40,
      problems: [
        { id: 733, title: "Flood Fill", difficulty: 'Easy', url: "https://leetcode.com/problems/flood-fill/", completed: false, tags: ['array', 'depth-first-search'] },
        { id: 200, title: "Number of Islands", difficulty: 'Medium', url: "https://leetcode.com/problems/number-of-islands/", completed: false, tags: ['array', 'depth-first-search'] },
        { id: 207, title: "Course Schedule", difficulty: 'Medium', url: "https://leetcode.com/problems/course-schedule/", completed: false, tags: ['depth-first-search', 'breadth-first-search'] },
        { id: 127, title: "Word Ladder", difficulty: 'Hard', url: "https://leetcode.com/problems/word-ladder/", completed: false, tags: ['hash-table', 'string', 'breadth-first-search'] },
        { id: 269, title: "Alien Dictionary", difficulty: 'Hard', url: "https://leetcode.com/problems/alien-dictionary/", completed: false, tags: ['array', 'string', 'depth-first-search'] },
        { id: 329, title: "Longest Increasing Path in a Matrix", difficulty: 'Hard', url: "https://leetcode.com/problems/longest-increasing-path-in-a-matrix/", completed: false, tags: ['array', 'dynamic-programming'] }
      ]
    },
    {
      id: 'binary-search',
      name: 'Binary Search',
      icon: Search,
      description: 'Search algorithms and optimization with sorted data',
      color: 'bg-indigo-500',
      mastery: 55,
      problems: [
        { id: 704, title: "Binary Search", difficulty: 'Easy', url: "https://leetcode.com/problems/binary-search/", completed: false, tags: ['array', 'binary-search'] },
        { id: 278, title: "First Bad Version", difficulty: 'Easy', url: "https://leetcode.com/problems/first-bad-version/", completed: false, tags: ['binary-search', 'interactive'] },
        { id: 33, title: "Search in Rotated Sorted Array", difficulty: 'Medium', url: "https://leetcode.com/problems/search-in-rotated-sorted-array/", completed: false, tags: ['array', 'binary-search'] },
        { id: 153, title: "Find Minimum in Rotated Sorted Array", difficulty: 'Medium', url: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/", completed: false, tags: ['array', 'binary-search'] },
        { id: 162, title: "Find Peak Element", difficulty: 'Medium', url: "https://leetcode.com/problems/find-peak-element/", completed: false, tags: ['array', 'binary-search'] },
        { id: 4, title: "Median of Two Sorted Arrays", difficulty: 'Hard', url: "https://leetcode.com/problems/median-of-two-sorted-arrays/", completed: false, tags: ['array', 'binary-search'] }
      ]
    }
  ];

  const handleProblemToggle = (problemId: number) => {
    const newCompleted = new Set(completedProblems);
    if (newCompleted.has(problemId)) {
      newCompleted.delete(problemId);
    } else {
      newCompleted.add(problemId);
    }
    setCompletedProblems(newCompleted);
    
    // Store in localStorage for persistence
    localStorage.setItem('completed_problems', JSON.stringify(Array.from(newCompleted)));
  };

  // Load completed problems from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('completed_problems');
    if (stored) {
      try {
        const completedArray = JSON.parse(stored);
        setCompletedProblems(new Set(completedArray));
      } catch (error) {
        console.error('Error loading completed problems:', error);
      }
    }
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-50 border-green-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Hard': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 80) return 'text-green-600';
    if (mastery >= 60) return 'text-yellow-600';
    if (mastery >= 40) return 'text-blue-600';
    return 'text-red-600';
  };

  const filteredProblems = selectedTopic?.problems.filter(problem => {
    const matchesSearch = problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         problem.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDifficulty = difficultyFilter === 'All' || problem.difficulty === difficultyFilter;
    const matchesCompletion = !showCompletedOnly || completedProblems.has(problem.id);
    
    return matchesSearch && matchesDifficulty && matchesCompletion;
  }) || [];

  if (selectedTopic) {
    return (
      <Card className="card-hover">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedTopic(null)}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${selectedTopic.color} text-white`}>
                  <selectedTopic.icon className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-lg">{selectedTopic.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{selectedTopic.description}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-medium ${getMasteryColor(selectedTopic.mastery)}`}>
                {selectedTopic.mastery}% Mastery
              </div>
              <div className="text-xs text-muted-foreground">
                {completedProblems.size} / {selectedTopic.problems.length} completed
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search problems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <select 
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value as any)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="All">All Levels</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              <Button
                variant={showCompletedOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowCompletedOnly(!showCompletedOnly)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Completed
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{completedProblems.size} / {selectedTopic.problems.length}</span>
            </div>
            <Progress 
              value={(completedProblems.size / selectedTopic.problems.length) * 100} 
              className="h-2"
            />
          </div>

          {/* Problems List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredProblems.map((problem) => (
              <div 
                key={problem.id} 
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={completedProblems.has(problem.id)}
                  onCheckedChange={() => handleProblemToggle(problem.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">{problem.title}</span>
                    <Badge className={`text-xs ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {problem.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag.replace('-', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(problem.url, '_blank')}
                  className="flex-shrink-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {filteredProblems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2" />
                <p>No problems found</p>
                <p className="text-xs">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-hover">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5" />
          Topics Mastery
          <Badge variant="secondary" className="text-xs">
            {topicCategories.length} Topics
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Explore data structures and algorithms by topic
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {topicCategories.map((topic) => {
            const completedCount = topic.problems.filter(p => completedProblems.has(p.id)).length;
            const progressPercentage = (completedCount / topic.problems.length) * 100;
            
            return (
              <div
                key={topic.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setSelectedTopic(topic)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${topic.color} text-white flex-shrink-0`}>
                    <topic.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-sm">{topic.name}</h3>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getMasteryColor(progressPercentage)}`}
                      >
                        {Math.round(progressPercentage)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {topic.description}
                    </p>
                    <div className="space-y-1">
                      <Progress value={progressPercentage} className="h-1.5" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{completedCount}/{topic.problems.length} solved</span>
                        <span>{topic.problems.length} problems</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800 text-sm">
            <Code2 className="h-4 w-4" />
            <span className="font-medium">
              Click on any topic to see problems and track your progress
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopicsMastery;
