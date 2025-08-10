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
  author_id: string;
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
  static async togglePostLike(postId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
        return false;
      } else {
        // Like
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (error) throw error;
        return true;
      }
    } catch (error) {
      console.error('Error toggling post like:', error);
      throw error;
    }
  }

  static async toggleCommentLike(commentId: string) {
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
        return false;
      } else {
        // Like
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id
          });

        if (error) throw error;
        return true;
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
      throw error;
    }
  }

  // Comments methods
  static async getPostComments(postId: string): Promise<CommunityComment[]> {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          author:profiles!post_comments_author_id_fkey (
            id, full_name, username, avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Check if current user has liked each comment
      const { data: { user } } = await supabase.auth.getUser();
      if (user && data) {
        const commentIds = data.map(comment => comment.id);
        const { data: likes } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id)
          .in('comment_id', commentIds);

        const likedCommentIds = new Set(likes?.map(like => like.comment_id) || []);
        
        data.forEach(comment => {
          comment.is_liked = likedCommentIds.has(comment.id);
        });
      }

      // Build threaded structure
      const commentMap = new Map<string, CommunityComment>();
      const rootComments: CommunityComment[] = [];

      // First pass: create all comments
      data?.forEach(comment => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });

      // Second pass: build hierarchy
      data?.forEach(comment => {
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

      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          content,
          author_id: user.id,
          parent_comment_id: parentCommentId || null
        })
        .select(`
          *,
          author:profiles!post_comments_author_id_fkey (
            id, full_name, username, avatar_url
          )
        `)
        .single();

      if (error) throw error;

      return data;
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
      }

      return { members: data || [], total: count || 0 };
    } catch (error) {
      console.error('Error fetching members:', error);
      return { members: [], total: 0 };
    }
  }

  // Follow methods
  static async toggleFollow(userId: string) {
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

        // Update both profiles with actual counts
        await Promise.all([
          supabase
            .from('profiles')
            .update({ 
              followers_count: actualFollowersCount,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId),
          supabase
            .from('profiles')
            .update({ 
              following_count: actualFollowingCount,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
        ]);

        console.log('Unfollow complete, new followers count:', actualFollowersCount);

        return {
          isFollowing: false,
          followersCount: actualFollowersCount
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

        // Update both profiles with actual counts
        await Promise.all([
          supabase
            .from('profiles')
            .update({ 
              followers_count: actualFollowersCount,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId),
          supabase
            .from('profiles')
            .update({ 
              following_count: actualFollowingCount,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
        ]);

        console.log('Follow complete, new followers count:', actualFollowersCount);

        return {
          isFollowing: true,
          followersCount: actualFollowersCount
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
}

export default CommunityService;
