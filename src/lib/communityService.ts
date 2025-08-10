import { supabase } from './supabase';

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  author?: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string;
  };
  is_liked?: boolean;
}

export interface CommunityComment {
  id: string;
  content: string;
  user_id: string;
  post_id: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
  likes_count: number;
  author?: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string;
  };
  is_liked?: boolean;
  replies?: CommunityComment[];
}

export interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  bio: string;
  avatar_url: string;
  github_username: string;
  leetcode_username: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  total_likes_received: number;
  location?: string;
  website?: string;
  job_title?: string;
  company?: string;
  is_profile_public?: boolean;
  twitter_username?: string;
  linkedin_url?: string;
  discord_username?: string;
  is_following?: boolean;
}

export interface CommunityMember {
  id: string;
  full_name: string;
  username: string;
  bio: string;
  avatar_url: string;
  github_username: string;
  leetcode_username: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  total_likes_received: number;
  is_following?: boolean;
}

export interface PostFilters {
  sortBy?: 'recent' | 'popular' | 'trending';
  limit?: number;
  offset?: number;
  authorId?: string;
}

export interface MemberFilters {
  sortBy?: 'newest' | 'popular' | 'active';
  limit?: number;
  offset?: number;
  search?: string;
}

export class CommunityService {
  // Posts methods
  static async getPosts(filters: PostFilters = {}) {
    try {
      const { sortBy = 'recent', limit = 10, offset = 0, authorId } = filters;
      
      let query = supabase
        .from('community_posts')
        .select(`
          *,
          author:profiles!community_posts_author_id_fkey (
            id, full_name, username, avatar_url
          )
        `);

      if (authorId) {
        query = query.eq('author_id', authorId);
      }

      // Apply sorting
      switch (sortBy) {
        case 'popular':
          query = query.order('likes_count', { ascending: false });
          break;
        case 'trending':
          query = query.order('comments_count', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      // Check if current user has liked each post
      const { data: { user } } = await supabase.auth.getUser();
      if (user && data) {
        const postIds = data.map(post => post.id);
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds);

        const likedPostIds = new Set(likes?.map(like => like.post_id) || []);
        
        data.forEach(post => {
          post.is_liked = likedPostIds.has(post.id);
        });
      }

      return { posts: data || [], total: count || 0 };
    } catch (error) {
      console.error('Error fetching posts:', error);
      return { posts: [], total: 0 };
    }
  }

  static async createPost(title: string, content: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          title,
          content,
          author_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  static async deletePost(postId: string) {
    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  // Likes methods
  static async togglePostLike(postId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Toggle post like for:', postId, 'by user:', user.id);

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      console.log('Existing like:', existingLike);

      if (existingLike) {
        // Unlike
        console.log('Unliking post...');
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
        console.log('Post unliked successfully');
      } else {
        // Like
        console.log('Liking post...');
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (error) throw error;
        console.log('Post liked successfully');
      }

      // Wait a moment for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get updated likes count from database (should be updated by trigger)
      const { data: post, error: postError } = await supabase
        .from('community_posts')
        .select('likes_count')
        .eq('id', postId)
        .single();

      console.log('Post data after like toggle:', post, postError);

      if (postError) {
        console.error('Error fetching updated like count:', postError);
        // Fallback: count manually if trigger failed
        const { count } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);
        
        console.log('Manual count fallback:', count);
        
        // Update the count manually
        await supabase
          .from('community_posts')
          .update({ likes_count: count || 0 })
          .eq('id', postId);

        return {
          isLiked: !existingLike,
          likesCount: count || 0
        };
      }

      // Always verify the count is correct
      const { count: actualCount } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      const dbCount = post?.likes_count || 0;
      
      // If counts don't match, update manually
      if (dbCount !== actualCount) {
        console.log('Count mismatch detected! DB:', dbCount, 'Actual:', actualCount);
        await supabase
          .from('community_posts')
          .update({ likes_count: actualCount || 0 })
          .eq('id', postId);
      }

      const result = {
        isLiked: !existingLike,
        likesCount: actualCount || 0
      };

      console.log('Final result:', result);
      return result;
    } catch (error) {
      console.error('Error toggling post like:', error);
      throw error;
    }
  }

  static async toggleCommentLike(commentId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id
          });

        if (error) throw error;
      }

      // Get updated likes count from database (should be updated by trigger)
      const { data: comment, error: commentError } = await supabase
        .from('post_comments')
        .select('likes_count')
        .eq('id', commentId)
        .single();

      if (commentError) {
        console.error('Error fetching updated comment like count:', commentError);
        // Fallback: count manually if trigger failed
        const { count } = await supabase
          .from('comment_likes')
          .select('*', { count: 'exact', head: true })
          .eq('comment_id', commentId);
        
        // Update the count manually
        await supabase
          .from('post_comments')
          .update({ likes_count: count || 0 })
          .eq('id', commentId);

        return {
          isLiked: !existingLike,
          likesCount: count || 0
        };
      }

      return {
        isLiked: !existingLike,
        likesCount: comment?.likes_count || 0
      };
    } catch (error) {
      console.error('Error toggling comment like:', error);
      throw error;
    }
  }

  // Comments methods
  static async getPostComments(postId: string): Promise<CommunityComment[]> {
    try {
      // First, get the comments
      const { data: comments, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!comments || comments.length === 0) return [];

      // Get unique user IDs
      const userIds = [...new Set(comments.map(comment => comment.user_id))];
      
      // Fetch author details
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of user profiles
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });

      // Combine comments with author data
      const commentsWithAuthors = comments.map(comment => ({
        ...comment,
        author: profileMap.get(comment.user_id)
      }));

      if (error) throw error;

      // Check if current user has liked each comment
      const { data: { user } } = await supabase.auth.getUser();
      if (user && commentsWithAuthors) {
        const commentIds = commentsWithAuthors.map(comment => comment.id);
        const { data: likes } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id)
          .in('comment_id', commentIds);

        const likedCommentIds = new Set(likes?.map(like => like.comment_id) || []);
        
        commentsWithAuthors.forEach(comment => {
          comment.is_liked = likedCommentIds.has(comment.id);
        });
      }

      // Build threaded structure
      const commentMap = new Map<string, CommunityComment>();
      const rootComments: CommunityComment[] = [];

      // First pass: create all comments
      commentsWithAuthors?.forEach(comment => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });

      // Second pass: build hierarchy
      commentsWithAuthors?.forEach(comment => {
        const commentObj = commentMap.get(comment.id)!;
        if (comment.parent_comment_id) {
          const parent = commentMap.get(comment.parent_comment_id);
          if (parent) {
            parent.replies!.push(commentObj);
          }
        } else {
          rootComments.push(commentObj);
        }
      });

      return rootComments;
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  }

  static async createComment(postId: string, content: string, parentCommentId?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: comment, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          content,
          user_id: user.id,
          parent_comment_id: parentCommentId || null
        })
        .select('*')
        .single();

      if (error) throw error;

      // Fetch the author details separately
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      return {
        ...comment,
        author: profile
      };
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  static async updateComment(commentId: string, content: string) {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  static async deleteComment(commentId: string) {
    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  // Members methods
  static async getMembers(filters: MemberFilters = {}) {
    try {
      const { sortBy = 'newest', limit = 20, offset = 0, search } = filters;
      
      let query = supabase
        .from('profiles')
        .select('*');

      if (search) {
        query = query.or(`full_name.ilike.%${search}%, username.ilike.%${search}%`);
      }

      // Apply sorting
      switch (sortBy) {
        case 'popular':
          query = query.order('followers_count', { ascending: false });
          break;
        case 'active':
          query = query.order('posts_count', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      // Check follow status for current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user && data) {
        const memberIds = data.map(member => member.id);
        const { data: follows } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id)
          .in('following_id', memberIds);

        const followingIds = new Set(follows?.map(follow => follow.following_id) || []);
        
        data.forEach(member => {
          member.is_following = followingIds.has(member.id);
        });
        
        console.log('Loaded members with follow status:', data.map(m => ({
          id: m.id,
          name: m.full_name,
          followers_count: m.followers_count,
          is_following: m.is_following
        })));
      }

      return { profiles: data || [], total: count || 0 };
    } catch (error) {
      console.error('Error fetching members:', error);
      return { profiles: [], total: 0 };
    }
  }

  // Follow methods
  static async toggleFollow(userId: string): Promise<{ isFollowing: boolean; followersCount: number; followingCount: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      if (user.id === userId) throw new Error('Cannot follow yourself');

      console.log('Toggle follow called for:', userId, 'by user:', user.id);

      // Check if already following
      const { data: existingFollow } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();

      console.log('Existing follow:', existingFollow);

      if (existingFollow) {
        // Unfollow - First delete the relationship
        console.log('Unfollowing user...');
        const { error: deleteError } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (deleteError) throw deleteError;

        // Count actual followers and following
        const [followerCountResult, followingCountResult] = await Promise.all([
          supabase
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', userId),
          supabase
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', user.id)
        ]);

        const actualFollowersCount = followerCountResult.count || 0;
        const actualFollowingCount = followingCountResult.count || 0;

        console.log('Actual counts after unfollow - followers:', actualFollowersCount, 'following:', actualFollowingCount);
        console.log('Updating target user (followers):', userId, 'count:', actualFollowersCount);
        console.log('Updating current user (following):', user.id, 'count:', actualFollowingCount);

        // Use database function to update both profiles with elevated privileges
        const { data: updateResult, error: updateError } = await supabase
          .rpc('update_follow_counts', {
            target_user_id: userId,
            current_user_id: user.id,
            is_following: false
          });

        if (updateError) {
          console.error('Error updating follow counts:', updateError);
          throw new Error('Failed to update follower/following counts');
        }

        console.log('Database function result:', updateResult);

        console.log('Unfollow complete, new followers count:', actualFollowersCount);

        // Verify the database was actually updated
        const { data: verifyProfile } = await supabase
          .from('profiles')
          .select('followers_count')
          .eq('id', userId)
          .single();
        
        console.log('Database verification - actual stored followers_count:', verifyProfile?.followers_count);

        return {
          isFollowing: false,
          followersCount: actualFollowersCount,
          followingCount: actualFollowingCount
        };
      } else {
        // Follow - First create the relationship
        console.log('Following user...');
        const { error: insertError } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: userId
          });

        if (insertError) throw insertError;

        // Count actual followers and following
        const [followerCountResult, followingCountResult] = await Promise.all([
          supabase
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', userId),
          supabase
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', user.id)
        ]);

        const actualFollowersCount = followerCountResult.count || 0;
        const actualFollowingCount = followingCountResult.count || 0;

        console.log('Actual counts after follow - followers:', actualFollowersCount, 'following:', actualFollowingCount);
        console.log('Updating target user (followers):', userId, 'count:', actualFollowersCount);
        console.log('Updating current user (following):', user.id, 'count:', actualFollowingCount);

        // Use database function to update both profiles with elevated privileges
        const { data: updateResult, error: updateError } = await supabase
          .rpc('update_follow_counts', {
            target_user_id: userId,
            current_user_id: user.id,
            is_following: true
          });

        if (updateError) {
          console.error('Error updating follow counts:', updateError);
          throw new Error('Failed to update follower/following counts');
        }

        console.log('Database function result:', updateResult);

        console.log('Follow complete, new followers count:', actualFollowersCount);

        // Verify the database was actually updated
        const { data: verifyProfile } = await supabase
          .from('profiles')
          .select('followers_count')
          .eq('id', userId)
          .single();
        
        console.log('Database verification - actual stored followers_count:', verifyProfile?.followers_count);

        return {
          isFollowing: true,
          followersCount: actualFollowersCount,
          followingCount: actualFollowingCount
        };
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      throw error;
    }
  }

  // Manually refresh follower/following counts for a user
  static async refreshUserCounts(userId: string) {
    try {
      // Count actual followers
      const { count: followersCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      // Count actual following
      const { count: followingCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      // Update profile with correct counts
      const { data, error } = await supabase
        .from('profiles')
        .update({
          followers_count: followersCount || 0,
          following_count: followingCount || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('followers_count, following_count')
        .single();

      if (error) throw error;

      console.log(`Refreshed counts for user ${userId}:`, {
        followers: followersCount,
        following: followingCount
      });

      return {
        followers_count: followersCount || 0,
        following_count: followingCount || 0
      };
    } catch (error) {
      console.error('Error refreshing user counts:', error);
      throw error;
    }
  }

  // Fix all user counts in the database
  static async fixAllUserCounts() {
    try {
      console.log('Starting to fix all user counts...');
      
      // Get all users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id');

      if (usersError) throw usersError;

      if (!users) return;

      // Fix counts for each user
      for (const user of users) {
        await this.refreshUserCounts(user.id);
      }

      console.log(`Fixed counts for ${users.length} users`);
      return { fixed: users.length };
    } catch (error) {
      console.error('Error fixing all user counts:', error);
      throw error;
    }
  }

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Check if current user is following this profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id !== userId) {
        const { data: followData } = await supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', userId)
          .single();

        data.is_following = !!followData;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  static async getCommunityStats() {
    try {
      // Get total members count
      const { count: totalMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total posts count
      const { count: totalPosts } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true });

      // Get total likes count
      const { count: totalLikes } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true });

      // Get total comments count
      const { count: totalComments } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true });

      return {
        totalMembers: totalMembers || 0,
        totalPosts: totalPosts || 0,
        totalLikes: totalLikes || 0,
        totalComments: totalComments || 0
      };
    } catch (error) {
      console.error('Error fetching community stats:', error);
      return {
        totalMembers: 0,
        totalPosts: 0,
        totalLikes: 0,
        totalComments: 0
      };
    }
  }

  // Manual function to refresh all counts
  static async refreshAllCounts() {
    try {
      console.log('🔄 Refreshing all like counts...');
      
      // Call the database function
      const { error } = await supabase.rpc('refresh_all_counts');
      
      if (error) {
        console.error('Error calling refresh function:', error);
        throw error;
      }
      
      console.log('✅ All counts refreshed successfully');
    } catch (error) {
      console.error('Error refreshing counts:', error);
      throw error;
    }
  }
}

export default CommunityService;
