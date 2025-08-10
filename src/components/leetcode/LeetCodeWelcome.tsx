import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Code2, AlertCircle } from "lucide-react";

interface LeetCodeWelcomeProps {
  onUsernameSubmit: (username: string) => void;
  loading?: boolean;
}

const LeetCodeWelcome = ({ onUsernameSubmit, loading = false }: LeetCodeWelcomeProps) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Please enter your LeetCode username');
      return;
    }

    setError('');
    onUsernameSubmit(username.trim());
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Configure LeetCode Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="leetcode-username">LeetCode Username</Label>
            <Input
              id="leetcode-username"
              placeholder="Enter your LeetCode username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
              disabled={loading}
            />
          </div>
          
          {error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1" disabled={loading || !username.trim()}>
              <Code2 className="h-4 w-4 mr-2" />
              {loading ? 'Connecting...' : 'Connect LeetCode'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeetCodeWelcome;
