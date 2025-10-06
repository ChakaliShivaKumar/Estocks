import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Share2, 
  Trophy, 
  Twitter, 
  Facebook, 
  Instagram,
  Copy,
  ExternalLink,
  Calendar,
  Target
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AchievementBadge } from "./AchievementBadge";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: string;
  rarity: string;
}

interface Contest {
  id: string;
  name: string;
  description?: string;
}

interface AchievementShare {
  id: string;
  userId: string;
  achievementId: string;
  contestId?: string;
  message?: string;
  platform: string;
  createdAt: Date;
  achievement: Achievement;
  contest?: Contest;
}

interface AchievementSharingProps {
  achievement: Achievement;
  contest?: Contest;
  onShare?: () => void;
}

export function AchievementSharing({ achievement, contest, onShare }: AchievementSharingProps) {
  const [shares, setShares] = useState<AchievementShare[]>([]);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareForm, setShareForm] = useState({
    message: "",
    platform: "app"
  });
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();

  const handleShare = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/achievements/${achievement.id}/share`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: shareForm.message || null,
          platform: shareForm.platform,
          contestId: contest?.id || null
        }),
      });

      if (response.ok) {
        setShowShareDialog(false);
        setShareForm({ message: "", platform: "app" });
        onShare?.();
        
        // Show success message (you could use a toast here)
        console.log('Achievement shared successfully!');
      } else {
        const errorData = await response.json();
        console.error('Error sharing achievement:', errorData.error);
      }
    } catch (error) {
      console.error('Error sharing achievement:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateShareText = (platform: string) => {
    const baseText = `🎉 I just earned the "${achievement.name}" achievement! ${achievement.description}`;
    
    if (contest) {
      return `${baseText} in the ${contest.name} contest! 🏆`;
    }
    
    return baseText;
  };

  const handleSocialShare = (platform: string) => {
    const text = generateShareText(platform);
    const url = window.location.origin;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const copyToClipboard = () => {
    const text = generateShareText('app');
    navigator.clipboard.writeText(text);
    // You could show a toast notification here
    console.log('Copied to clipboard!');
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter':
        return <Twitter className="h-4 w-4" />;
      case 'facebook':
        return <Facebook className="h-4 w-4" />;
      case 'instagram':
        return <Instagram className="h-4 w-4" />;
      default:
        return <Share2 className="h-4 w-4" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'twitter':
        return 'text-blue-500';
      case 'facebook':
        return 'text-blue-600';
      case 'instagram':
        return 'text-pink-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <AchievementBadge
            achievement={achievement}
            size="lg"
            showTooltip={false}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold">{achievement.name}</h3>
              <Badge 
                variant="secondary"
                className={`text-xs ${
                  achievement.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                  achievement.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                  achievement.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {achievement.rarity}
              </Badge>
            </div>
            <p className="text-muted-foreground mb-3">{achievement.description}</p>
            
            {contest && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Target className="h-4 w-4" />
                <span>Earned in {contest.name}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Achievement
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share Your Achievement</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <AchievementBadge
                        achievement={achievement}
                        size="md"
                        showTooltip={false}
                      />
                      <div>
                        <div className="font-medium">{achievement.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {achievement.description}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="message">Custom Message (Optional)</Label>
                      <Textarea
                        id="message"
                        placeholder="Add a personal message to your share..."
                        value={shareForm.message}
                        onChange={(e) => setShareForm(prev => ({ ...prev, message: e.target.value }))}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="platform">Platform</Label>
                      <Select
                        value={shareForm.platform}
                        onValueChange={(value) => setShareForm(prev => ({ ...prev, platform: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="app">App Feed</SelectItem>
                          <SelectItem value="twitter">Twitter</SelectItem>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleShare} disabled={loading} className="flex-1">
                        {loading ? 'Sharing...' : 'Share'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Text
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Social sharing buttons */}
      <Card className="p-4">
        <h4 className="font-medium mb-3">Share on Social Media</h4>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSocialShare('twitter')}
            className="flex-1"
          >
            <Twitter className="h-4 w-4 mr-2" />
            Twitter
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSocialShare('facebook')}
            className="flex-1"
          >
            <Facebook className="h-4 w-4 mr-2" />
            Facebook
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSocialShare('linkedin')}
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            LinkedIn
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Component for viewing achievement shares
export function AchievementSharesList({ userId }: { userId: string }) {
  const [shares, setShares] = useState<AchievementShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchShares();
  }, [userId]);

  const fetchShares = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}/achievement-shares`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setShares(data);
      } else {
        setError('Failed to fetch achievement shares');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shares');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="text-muted-foreground">Loading achievement shares...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <div className="text-red-500 mb-2">Error loading shares</div>
        <div className="text-sm text-muted-foreground">{error}</div>
        <Button onClick={fetchShares} className="mt-4">
          Try Again
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Share2 className="h-6 w-6" />
        <h2 className="text-xl font-bold">Achievement Shares ({shares.length})</h2>
      </div>

      {shares.length === 0 ? (
        <Card className="p-8 text-center">
          <Share2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No shares yet</h3>
          <p className="text-muted-foreground">
            Start sharing your achievements to show off your trading skills!
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {shares.map((share) => (
            <Card key={share.id} className="p-4">
              <div className="flex items-start gap-3">
                <AchievementBadge
                  achievement={share.achievement}
                  size="md"
                  showTooltip={false}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{share.achievement.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {share.platform}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(share.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {share.message && (
                    <p className="text-sm text-muted-foreground mb-2">
                      "{share.message}"
                    </p>
                  )}
                  
                  {share.contest && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Trophy className="h-3 w-3" />
                      <span>Earned in {share.contest.name}</span>
                    </div>
                  )}
                </div>
                <div className={`${getPlatformColor(share.platform)}`}>
                  {getPlatformIcon(share.platform)}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function getPlatformIcon(platform: string) {
  switch (platform) {
    case 'twitter':
      return <Twitter className="h-4 w-4" />;
    case 'facebook':
      return <Facebook className="h-4 w-4" />;
    case 'instagram':
      return <Instagram className="h-4 w-4" />;
    default:
      return <Share2 className="h-4 w-4" />;
  }
}

function getPlatformColor(platform: string) {
  switch (platform) {
    case 'twitter':
      return 'text-blue-500';
    case 'facebook':
      return 'text-blue-600';
    case 'instagram':
      return 'text-pink-500';
    default:
      return 'text-gray-500';
  }
}
