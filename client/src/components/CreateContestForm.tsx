import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Users, DollarSign, Trophy, Clock, Share2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CreateContestFormProps {
  onSuccess?: (contest: any) => void;
  onCancel?: () => void;
}

export function CreateContestForm({ onSuccess, onCancel }: CreateContestFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    entryFee: "",
    prizePool: "",
    maxParticipants: "",
    startTime: new Date(),
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side validation
    if (parseInt(formData.maxParticipants) < 2) {
      setError("Contest must have at least 2 participants");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/contests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          entryFee: parseInt(formData.entryFee),
          prizePool: parseInt(formData.prizePool),
          maxParticipants: parseInt(formData.maxParticipants),
          startTime: formData.startTime.toISOString(),
          endTime: formData.endTime.toISOString(),
          visibility: "private", // All contests are private by default
          allowFriends: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create contest');
      }

      const contest = await response.json();
      onSuccess?.(contest);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create contest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Plus className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Create New Contest</h2>
          <p className="text-sm text-muted-foreground">Set up your own trading competition</p>
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800">
              💡 <strong>Simple Sharing:</strong> After creating your contest, you'll get a shareable link that others can use to join directly.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contest Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Contest Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter contest name"
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe your contest..."
            rows={3}
          />
        </div>

        {/* Entry Fee and Prize Pool */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="entryFee">Entry Fee (coins) *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="entryFee"
                type="number"
                value={formData.entryFee}
                onChange={(e) => handleInputChange('entryFee', e.target.value)}
                placeholder="0"
                className="pl-10"
                min="1"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prizePool">Prize Pool (coins) *</Label>
            <div className="relative">
              <Trophy className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="prizePool"
                type="number"
                value={formData.prizePool}
                onChange={(e) => handleInputChange('prizePool', e.target.value)}
                placeholder="0"
                className="pl-10"
                min="1"
                required
              />
            </div>
          </div>
        </div>

        {/* Max Participants */}
        <div className="space-y-2">
          <Label htmlFor="maxParticipants">Max Participants *</Label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="maxParticipants"
              type="number"
              value={formData.maxParticipants}
              onChange={(e) => handleInputChange('maxParticipants', e.target.value)}
              placeholder="50"
              className="pl-10"
              min="2"
              max="1000"
              required
            />
            <p className="text-xs text-muted-foreground">
              Minimum 2 participants required for a valid contest
            </p>
          </div>
        </div>

        {/* Start and End Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Time *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.startTime && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.startTime ? format(formData.startTime, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.startTime}
                  onSelect={(date) => date && handleInputChange('startTime', date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>End Time *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.endTime && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.endTime ? format(formData.endTime, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.endTime}
                  onSelect={(date) => date && handleInputChange('endTime', date)}
                  disabled={(date) => date < formData.startTime}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>


        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Creating..." : "Create Contest"}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
