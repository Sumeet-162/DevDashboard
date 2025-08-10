import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, Globe, Calendar } from "lucide-react";

interface UserInfo {
  location: string;
  currentTime: string;
  currentDate: string;
  timezone: string;
}

const UserInfoCard = () => {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    location: '',
    currentTime: '',
    currentDate: '',
    timezone: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserInfo();
    // Update time every minute
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserInfo = async () => {
    try {
      // Get user's location using IP geolocation (free)
      const locationResponse = await fetch('https://ipapi.co/json/');
      const locationData = await locationResponse.json();
      
      const location = `${locationData.city || 'Unknown'}, ${locationData.country_name || 'Unknown'}`;
      
      setUserInfo({
        location,
        currentTime: getCurrentTime(),
        currentDate: getCurrentDate(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    } catch (error) {
      console.error('Error fetching user info:', error);
      // Fallback to basic info
      setUserInfo({
        location: 'Location not available',
        currentTime: getCurrentTime(),
        currentDate: getCurrentDate(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const updateTime = () => {
    setUserInfo(prev => ({
      ...prev,
      currentTime: getCurrentTime(),
      currentDate: getCurrentDate()
    }));
  };

  if (loading) {
    return (
      <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 space-y-2 min-w-[200px]">
        <Skeleton className="h-4 w-32 bg-gray-300 dark:bg-gray-600" />
        <Skeleton className="h-3 w-24 bg-gray-300 dark:bg-gray-600" />
        <Skeleton className="h-3 w-28 bg-gray-300 dark:bg-gray-600" />
        <Skeleton className="h-3 w-20 bg-gray-300 dark:bg-gray-600" />
      </div>
    );
  }

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50 min-w-[200px]">
      <div className="space-y-2">
        <div className="flex items-center justify-end gap-2 text-sm text-gray-700 dark:text-gray-300">
          <span className="truncate font-medium">{userInfo.location}</span>
          <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </div>
        
        <div className="flex items-center justify-end gap-2 text-sm text-gray-700 dark:text-gray-300">
          <span className="font-medium">{userInfo.currentTime}</span>
          <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </div>
        
        <div className="flex items-center justify-end gap-2 text-sm text-gray-700 dark:text-gray-300">
          <span className="font-medium">{userInfo.currentDate}</span>
          <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </div>
        
        <div className="flex items-center justify-end gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="truncate">{userInfo.timezone.replace('_', ' ')}</span>
          <Globe className="h-3 w-3" />
        </div>
      </div>
    </div>
  );
};

export default UserInfoCard;
