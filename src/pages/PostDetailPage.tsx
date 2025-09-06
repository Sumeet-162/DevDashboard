import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  ArrowLeft,
  Clock,
  User
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommunityPost, CommunityService } from "@/lib/communityService";
import { useAuthSimple } from "@/hooks/useAuth.tsx";
import { getProfileDisplayName } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import InlineComments from "@/components/community/InlineComments";

const PostDetailPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthSimple();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    if (postId) {
      loadPost();
    }
  }, [postId]);

  const loadPost = async () => {
    if (!postId) return;

    setLoading(true);
    setError(null);
    
    try {
      const postData = await CommunityService.getPostById(postId);
      setPost(postData);
    } catch (error) {
      console.error('Error loading post:', error);
      setError('Failed to load post. It may have been deleted or you may not have permission to view it.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileClick = () => {
    if (!post) return;
    
    if (post.author_id === user?.id) {
      navigate('/profile');
    } else {
      navigate(`/profile/${post.author_id}`);
    }
  };

  const handleLike = async () => {
    if (!user || !post || isLiking) return;

    setIsLiking(true);
    try {
      const { isLiked, likesCount } = await CommunityService.togglePostLike(post.id);
      setPost(prev => prev ? {
        ...prev,
        is_liked: isLiked,
        likes_count: likesCount
      } : null);
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    if (!post) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content.substring(0, 100) + '...',
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    console.log('Edit post:', post?.id);
  };

  const handleDelete = async () => {
    if (!post || !window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await CommunityService.deletePost(post.id);
      navigate('/community');
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-4">
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !post) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-4">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Post not found</h2>
            <p className="text-gray-600 mb-6">
              {error || "The post you're looking for doesn't exist or has been removed."}
            </p>
            <Button onClick={() => navigate('/community')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Community
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const authorName = post.author ? getProfileDisplayName(post.author) : 'Unknown User';
  const isAuthor = user?.id === post.author_id;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate('/community')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Community
        </Button>

        {/* Main Post Card */}
        <Card className="w-full">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar 
                  className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-primary transition-all" 
                  onClick={handleProfileClick}
                >
                  <AvatarImage src={post.author?.avatar_url} alt={authorName} />
                  <AvatarFallback>
                    <User className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 
                      className="font-medium cursor-pointer hover:text-primary transition-colors" 
                      onClick={handleProfileClick}
                    >
                      {authorName}
                    </h4>
                    {post.author?.username && (
                      <span 
                        className="text-sm text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                        onClick={handleProfileClick}
                      >
                        @{post.author.username}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <time title={new Date(post.created_at).toLocaleString()}>
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </time>
                  </div>
                </div>
              </div>
              
              {isAuthor && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Title */}
            <h1 className="text-2xl font-bold leading-tight">{post.title}</h1>

            {/* Content */}
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {post.content}
              </p>
            </div>

            {/* Image */}
            {post.image_url && (
              <div className="rounded-lg border overflow-hidden">
                <img 
                  src={post.image_url} 
                  alt="Post image" 
                  className="w-full max-h-96 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={!user || isLiking}
                  className={`gap-2 ${post.is_liked ? 'text-red-500 hover:text-red-600' : ''}`}
                >
                  <Heart className={`h-5 w-5 ${post.is_liked ? 'fill-current' : ''}`} />
                  <span>{post.likes_count} {post.likes_count === 1 ? 'like' : 'likes'}</span>
                </Button>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageCircle className="h-5 w-5" />
                  <span>{post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}</span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <InlineComments postId={post.id} />
      </div>
    </Layout>
  );
};

export default PostDetailPage;
