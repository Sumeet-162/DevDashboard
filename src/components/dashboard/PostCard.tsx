
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PostCard = () => {
  const [post, setPost] = useState("");
  const { toast } = useToast();
  
  const handlePost = () => {
    if (!post.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content for your post",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Success!",
      description: "Your post has been shared with the community",
    });
    
    setPost("");
  };

  return (
    <Card className="card-hover">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center">
          <MessageSquare className="mr-2" size={18} /> Share with Community
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="https://raw.githubusercontent.com/Sumeet-162/website-images/refs/heads/main/6ceee189eaac01781b810780e487da8a.jpg" alt="User" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <Textarea
            placeholder="Share a tech tip, news, or ask for help..."
            className="resize-none"
            value={post}
            onChange={(e) => setPost(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter className="justify-between border-t pt-3">
        <Button variant="outline" size="sm" className="gap-1">
          <Link size={16} /> Attach Link
        </Button>
        <Button size="sm" onClick={handlePost}>Post</Button>
      </CardFooter>
    </Card>
  );
};

export default PostCard;
