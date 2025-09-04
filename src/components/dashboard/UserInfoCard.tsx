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
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-gray-200/60 dark:border-gray-700/60 shadow-sm min-w-[200px] md:min-w-[220px]">
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-center justify-between gap-2 md:gap-3">
            <Skeleton className="h-3 md:h-4 w-20 md:w-24 bg-gray-300 dark:bg-gray-600" />
            <Skeleton className="h-3.5 w-3.5 md:h-4 md:w-4 rounded bg-gray-300 dark:bg-gray-600" />
          </div>
          <div className="flex items-center justify-between gap-2 md:gap-3">
            <Skeleton className="h-4 md:h-5 w-16 md:w-20 bg-gray-300 dark:bg-gray-600" />
            <Skeleton className="h-3.5 w-3.5 md:h-4 md:w-4 rounded bg-gray-300 dark:bg-gray-600" />
          </div>
          <div className="flex items-center justify-between gap-2 md:gap-3">
            <Skeleton className="h-3 md:h-4 w-24 md:w-28 bg-gray-300 dark:bg-gray-600" />
            <Skeleton className="h-3.5 w-3.5 md:h-4 md:w-4 rounded bg-gray-300 dark:bg-gray-600" />
          </div>
          <div className="pt-1 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between gap-2 md:gap-3">
              <Skeleton className="h-3 w-28 md:w-32 bg-gray-300 dark:bg-gray-600" />
              <Skeleton className="h-3 w-3 rounded bg-gray-300 dark:bg-gray-600" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-md transition-shadow duration-200 min-w-[200px] md:min-w-[220px]">
      <div className="space-y-2 md:space-y-3">
        <div className="flex items-center justify-between gap-2 md:gap-3 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
          <span className="truncate flex-1">{userInfo.location}</span>
          <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
        </div>
        
        <div className="flex items-center justify-between gap-2 md:gap-3 text-base md:text-lg font-semibold text-gray-800 dark:text-gray-200">
          <span className="font-mono tracking-wide">{userInfo.currentTime}</span>
          <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
        </div>
        
        <div className="flex items-center justify-between gap-2 md:gap-3 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
          <span className="truncate flex-1">{userInfo.currentDate}</span>
          <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
        </div>
        
        <div className="flex items-center justify-between gap-2 md:gap-3 text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-200/50 dark:border-gray-700/50">
          <span className="truncate flex-1 font-medium">{userInfo.timezone.replace('_', ' ')}</span>
          <Globe className="h-3 w-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
        </div>
      </div>
    </div>
  );
};

export default UserInfoCard;
