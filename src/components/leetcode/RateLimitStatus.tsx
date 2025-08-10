import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Shield, 
  Info,
  CheckCircle,
  XCircle
} from "lucide-react";
import { SimpleLeetCodeApi } from "@/services/simpleLeetCodeApi";

interface RateLimitStatusProps {
  isRateLimited?: boolean;
  onRetry?: () => void;
  className?: string;
}

const RateLimitStatus: React.FC<RateLimitStatusProps> = ({ 
  isRateLimited, 
  onRetry, 
  className = "" 
}) => {
  const [rateLimitInfo, setRateLimitInfo] = useState({
    requests: 0,
    maxRequests: 0,
    timeUntilReset: 0,
    resetTime: 0
  });
  
  const [timeLeft, setTimeLeft] = useState(0);

  // Update rate limit info
  useEffect(() => {
    const updateInfo = () => {
      const info = SimpleLeetCodeApi.getRateLimitStatus();
      setRateLimitInfo(info);
      setTimeLeft(Math.ceil(info.timeUntilReset / 1000));
    };

    updateInfo();
    const interval = setInterval(updateInfo, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleResetRateLimit = () => {
    SimpleLeetCodeApi.resetRateLimit();
    const info = SimpleLeetCodeApi.getRateLimitStatus();
    setRateLimitInfo(info);
    setTimeLeft(0);
  };

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return "0s";
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const getStatusColor = () => {
    if (rateLimitInfo.requests >= rateLimitInfo.maxRequests) {
      return "text-red-600 bg-red-50 border-red-200";
    }
    if (rateLimitInfo.requests >= rateLimitInfo.maxRequests * 0.8) {
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    }
    return "text-green-600 bg-green-50 border-green-200";
  };

  const getIcon = () => {
    if (rateLimitInfo.requests >= rateLimitInfo.maxRequests) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
    if (rateLimitInfo.requests >= rateLimitInfo.maxRequests * 0.8) {
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
    return <CheckCircle className="h-5 w-5 text-green-600" />;
  };

  const isCurrentlyLimited = rateLimitInfo.requests >= rateLimitInfo.maxRequests && timeLeft > 0;

  return (
    <Card className={`${className} ${getStatusColor()}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {getIcon()}
          API Rate Limit Status
          {isCurrentlyLimited && (
            <Badge variant="destructive" className="text-xs">
              Limited
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Requests Used</span>
            <span className="font-medium">
              {rateLimitInfo.requests} / {rateLimitInfo.maxRequests}
            </span>
          </div>
          <Progress 
            value={(rateLimitInfo.requests / rateLimitInfo.maxRequests) * 100} 
            className="h-2"
          />
        </div>

        {/* Time Until Reset */}
        {timeLeft > 0 && (
          <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Reset in:</span>
            </div>
            <Badge variant="outline" className="font-mono">
              {formatTime(timeLeft)}
            </Badge>
          </div>
        )}

        {/* Status Messages */}
        {isCurrentlyLimited ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-800">Rate Limit Reached</p>
                <p className="text-red-600 mt-1">
                  API requests are temporarily limited. Please wait {formatTime(timeLeft)} before trying again.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                disabled={timeLeft > 0}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {timeLeft > 0 ? `Retry in ${formatTime(timeLeft)}` : 'Retry Now'}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleResetRateLimit}
              >
                <Shield className="h-4 w-4 mr-2" />
                Reset Limit
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-green-800">API Available</p>
              <p className="text-green-600 mt-1">
                You can make {rateLimitInfo.maxRequests - rateLimitInfo.requests} more requests this minute.
              </p>
            </div>
          </div>
        )}

        {/* Information */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Rate Limit Policy</p>
            <p className="mt-1">
              Maximum {rateLimitInfo.maxRequests} requests per minute to ensure stable service for all users.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RateLimitStatus;
