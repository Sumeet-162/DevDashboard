import { supabase } from "@/lib/supabase";

export interface CommunityPost {
  id: string;
  author_id: string;
  title: string;
  content: string;
  tags: string[];
  image_url?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
    is_profile_public: boolean;
  };
  is_liked?: boolean;
}

export interface PostComment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  parent_comment_id?: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
  is_liked?: boolean;
  replies?: PostComment[];
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  follower?: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
  following?: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface CommunityProfile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  job_title?: string;
  company?: string;
  twitter_username?: string;
  linkedin_url?: string;
  discord_username?: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  total_likes_received: number;
  is_profile_public: boolean;
  is_following?: boolean;
  is_followed_by?: boolean;
}

export class CommunityService {
  // ===========================
  // POSTS METHODS
  // ===========================

  static async getPosts(options: {
    page?: number;
    limit?: number;
    sortBy?: 'recent' | 'popular' | 'featured';
    authorId?: string;
    followingOnly?: boolean;
    tags?: string[];
  } = {}): Promise<{ posts: CommunityPost[]; hasMore: boolean }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'recent',
      authorId,
      followingOnly = false,
      tags = []
    } = options;

    try {
      let query = supabase
        .from('community_posts')
        .select(`
          *,
          author:profiles!community_posts_author_id_fkey (
            id,
            username,
            full_name,
            avatar_url,
            is_profile_public
          )
        `);

      // Filter by author
      if (authorId) {
        query = query.eq('author_id', authorId);
      }

      // Filter by following
      if (followingOnly) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: following } = await supabase
            .from('user_follows')
            .select('following_id')
            .eq('follower_id', user.id);
          
          const followingIds = following?.map(f => f.following_id) || [];
          if (followingIds.length > 0) {
            query = query.in('author_id', followingIds);
          } else {
            // No following, return empty
            return { posts: [], hasMore: false };
          }
        }
      }

      // Filter by tags
      if (tags.length > 0) {
        query = query.overlaps('tags', tags);
      }

      // Sorting
      switch (sortBy) {
        case 'popular':
          query = query.order('likes_count', { ascending: false });
          break;
        case 'featured':
          query = query.eq('is_featured', true).order('created_at', { ascending: false });
          break;
        case 'recent':
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit;
      query = query.range(from, to);

      const { data: posts, error } = await query;

      if (error) throw error;

      // Check if user has liked each post
      const { data: { user } } = await supabase.auth.getUser();
      let postsWithLikes = posts || [];

      if (user && posts?.length) {
        const postIds = posts.map(p => p.id);
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds);

        const likedPostIds = new Set(likes?.map(l => l.post_id) || []);

        postsWithLikes = posts.map(post => ({
          ...post,
          is_liked: likedPostIds.has(post.id)
        }));
      }

      const hasMore = posts?.length === limit + 1;
      if (hasMore) {
        postsWithLikes.pop(); // Remove the extra item used to check for more
      }

      return { posts: postsWithLikes, hasMore };
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  static async createPost(postData: {
    title: string;
    content: string;
    tags?: string[];
    image_url?: string;
  }): Promise<CommunityPost> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          author_id: user.id,
          ...postData,
          tags: postData.tags || []
        })
        .select(`
          *,
          author:profiles!community_posts_author_id_fkey (
            id,
            username,
            full_name,
            avatar_url,
            is_profile_public
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  static async updatePost(postId: string, updates: {
    title?: string;
    content?: string;
    tags?: string[];
    image_url?: string;
  }): Promise<CommunityPost> {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .update(updates)
        .eq('id', postId)
        .select(`
          *,
          author:profiles!community_posts_author_id_fkey (
            id,
            username,
            full_name,
            avatar_url,
            is_profile_public
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  static async deletePost(postId: string): Promise<void> {
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

  // ===========================
  // LIKES METHODS
  // ===========================

  static async togglePostLike(postId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert({
            user_id: user.id,
            post_id: postId
          });
      }

      // Get updated likes count
      const { data: post } = await supabase
        .from('community_posts')
        .select('likes_count')
        .eq('id', postId)
        .single();

      return {
        isLiked: !existingLike,
        likesCount: post?.likes_count || 0
      };
    } catch (error) {
      console.error('Error toggling post like:', error);
      throw error;
    }
  }

  // ===========================
  // COMMENTS METHODS
  // ===========================

  static async getPostComments(postId: string): Promise<PostComment[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // First, get all comments for this post (both top-level and replies)
      const { data: allComments, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          author:profiles!post_comments_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Check which comments are liked by the current user (if authenticated)
      let likedCommentIds = new Set<string>();
      if (user && allComments?.length > 0) {
        const commentIds = allComments.map(comment => comment.id);
        const { data: likes } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id)
          .in('comment_id', commentIds);

        likedCommentIds = new Set(likes?.map(like => like.comment_id) || []);
      }

      // Add is_liked status to all comments
      const commentsWithLikes = (allComments || []).map(comment => ({
        ...comment,
        is_liked: likedCommentIds.has(comment.id),
        replies: [] as PostComment[]
      }));

      // Build the threaded comment structure
      const buildCommentTree = (comments: PostComment[], parentId: string | null = null): PostComment[] => {
        return comments
          .filter(comment => comment.parent_comment_id === parentId)
          .map(comment => ({
            ...comment,
            replies: buildCommentTree(comments, comment.id)
          }));
      };

      // Return only top-level comments with their nested replies
      return buildCommentTree(commentsWithLikes, null);
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  static async createComment(commentData: {
    post_id: string;
    content: string;
    parent_comment_id?: string;
  }): Promise<PostComment> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          user_id: user.id,
          ...commentData
        })
        .select(`
          *,
          author:profiles!post_comments_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url
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

  static async updateComment(commentId: string, content: string): Promise<PostComment> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('post_comments')
        .update({ 
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('user_id', user.id) // Ensure user can only update their own comments
        .select(`
          *,
          author:profiles!post_comments_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  static async deleteComment(commentId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id); // Ensure user can only delete their own comments

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting comment:', error);
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
        .eq('user_id', user.id)
        .eq('comment_id', commentId)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('comment_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('comment_id', commentId);
      } else {
        // Like
        await supabase
          .from('comment_likes')
          .insert({
            user_id: user.id,
            comment_id: commentId
          });
      }

      // Get updated likes count
      const { data: comment } = await supabase
        .from('post_comments')
        .select('likes_count')
        .eq('id', commentId)
        .single();

      return {
        isLiked: !existingLike,
        likesCount: comment?.likes_count || 0
      };
    } catch (error) {
      console.error('Error toggling comment like:', error);
      throw error;
    }
  }

  // ===========================
  // FOLLOW METHODS
  // ===========================

  static async toggleFollow(userId: string): Promise<{ isFollowing: boolean; followersCount: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      if (user.id === userId) throw new Error('Cannot follow yourself');

      // Check if already following
      const { data: existingFollow } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();

      if (existingFollow) {
        // Unfollow
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);
      } else {
        // Follow
        await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: userId
          });
      }

      // Get updated followers count
      const { data: profile } = await supabase
        .from('profiles')
        .select('followers_count')
        .eq('id', userId)
        .single();

      return {
        isFollowing: !existingFollow,
        followersCount: profile?.followers_count || 0
      };
    } catch (error) {
      console.error('Error toggling follow:', error);
      throw error;
    }
  }

  static async getFollowers(userId: string, page = 1, limit = 20): Promise<Follow[]> {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          *,
          follower:profiles!user_follows_follower_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('following_id', userId)
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching followers:', error);
      throw error;
    }
  }

  static async getFollowing(userId: string, page = 1, limit = 20): Promise<Follow[]> {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          *,
          following:profiles!user_follows_following_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('follower_id', userId)
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching following:', error);
      throw error;
    }
  }

  // ===========================
  // COMMUNITY PROFILES METHODS
  // ===========================

  static async getUserProfile(userId: string): Promise<CommunityProfile | null> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profile) return null;

      // Check follow status for authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      let profileWithFollowStatus = profile;

      if (user && user.id !== userId) {
        // Check if current user is following this profile
        const { data: following } = await supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', userId)
          .single();

        // Check if this profile is following current user
        const { data: follower } = await supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', userId)
          .eq('following_id', user.id)
          .single();

        profileWithFollowStatus = {
          ...profile,
          is_following: !!following,
          is_followed_by: !!follower
        };
      }

      return profileWithFollowStatus;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  static async getCommunityProfiles(options: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: 'recent' | 'popular' | 'most_followers';
  } = {}): Promise<{ profiles: CommunityProfile[]; hasMore: boolean }> {
    const { page = 1, limit = 20, search = '', sortBy = 'recent' } = options;

    try {
      let query = supabase
        .from('profiles')
        .select('*');

      // Filter by public profiles only for community view
      query = query.eq('is_profile_public', true);

      // Search filter
      if (search) {
        query = query.or(`username.ilike.%${search}%,full_name.ilike.%${search}%,location.ilike.%${search}%`);
      }

      // Sorting
      switch (sortBy) {
        case 'popular':
          query = query.order('total_likes_received', { ascending: false });
          break;
        case 'most_followers':
          query = query.order('followers_count', { ascending: false });
          break;
        case 'recent':
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit;
      query = query.range(from, to);

      const { data: profiles, error } = await query;

      if (error) throw error;

      // Check follow status for authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      let profilesWithFollowStatus = profiles || [];

      if (user && profiles?.length) {
        const profileIds = profiles.map(p => p.id);
        
        // Check who the current user is following
        const { data: following } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id)
          .in('following_id', profileIds);

        // Check who is following the current user
        const { data: followers } = await supabase
          .from('user_follows')
          .select('follower_id')
          .eq('following_id', user.id)
          .in('follower_id', profileIds);

        const followingIds = new Set(following?.map(f => f.following_id) || []);
        const followerIds = new Set(followers?.map(f => f.follower_id) || []);

        profilesWithFollowStatus = profiles.map(profile => ({
          ...profile,
          is_following: followingIds.has(profile.id),
          is_followed_by: followerIds.has(profile.id)
        }));
      }

      const hasMore = profiles?.length === limit + 1;
      if (hasMore) {
        profilesWithFollowStatus.pop();
      }

      return { profiles: profilesWithFollowStatus, hasMore };
    } catch (error) {
      console.error('Error fetching community profiles:', error);
      throw error;
    }
  }

  static async getCommunityStats(): Promise<{
    totalMembers: number;
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
  }> {
    try {
      const [
        { count: totalMembers },
        { count: totalPosts },
        { count: totalLikes },
        { count: totalComments }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_profile_public', true),
        supabase.from('community_posts').select('*', { count: 'exact', head: true }),
        supabase.from('post_likes').select('*', { count: 'exact', head: true }),
        supabase.from('post_comments').select('*', { count: 'exact', head: true })
      ]);

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
