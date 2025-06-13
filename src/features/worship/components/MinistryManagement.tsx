'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Trash2, 
  Edit, 
  Plus, 
  Church, 
  Music, 
  Users, 
  Heart, 
  BookOpen, 
  Baby, 
  Gamepad2,
  GraduationCap,
  Home,
  Compass,
  Globe,
  Star,
  Shield,
  Zap,
  Sun,
  Moon,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Church {
  id: string;
  name: string;
}

interface Ministry {
  id: string;
  churchId: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  church: Church;
}

interface MinistryFormData {
  churchId: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

interface MinistryManagementProps {
  organizationId: string;
  churches: Church[];
  selectedChurchId?: string;
}

// Available icons for ministries
const MINISTRY_ICONS = [
  { value: 'church', label: 'Church', icon: Church },
  { value: 'music', label: 'Music', icon: Music },
  { value: 'users', label: 'People', icon: Users },
  { value: 'heart', label: 'Heart', icon: Heart },
  { value: 'book-open', label: 'Book', icon: BookOpen },
  { value: 'baby', label: 'Children', icon: Baby },
  { value: 'gamepad-2', label: 'Youth', icon: Gamepad2 },
  { value: 'graduation-cap', label: 'Education', icon: GraduationCap },
  { value: 'home', label: 'Home', icon: Home },
  { value: 'compass', label: 'Missions', icon: Compass },
  { value: 'globe', label: 'Global', icon: Globe },
  { value: 'star', label: 'Star', icon: Star },
  { value: 'shield', label: 'Shield', icon: Shield },
  { value: 'zap', label: 'Power', icon: Zap },
  { value: 'sun', label: 'Light', icon: Sun },
  { value: 'moon', label: 'Evening', icon: Moon },
  { value: 'activity', label: 'Activity', icon: Activity },
];

// Pre-defined color palette
const MINISTRY_COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#eab308', // yellow-500
  '#22c55e', // green-500
  '#06b6d4', // cyan-500
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#f43f5e', // rose-500
  '#84cc16', // lime-500
  '#10b981', // emerald-500
  '#0ea5e9', // sky-500
  '#7c3aed', // purple-500
  '#db2777', // pink-600
  '#dc2626', // red-600
];

export function MinistryManagement({ organizationId, churches, selectedChurchId }: MinistryManagementProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  
  const [formData, setFormData] = useState<MinistryFormData>({
    churchId: selectedChurchId || '',
    name: '',
    description: '',
    color: '#6366f1',
    icon: 'church',
  });

  // Fetch ministries
  const fetchMinistries = async () => {
    try {
      const url = new URL('/api/worship/ministries', window.location.origin);
      url.searchParams.set('organizationId', organizationId);
      if (selectedChurchId) {
        url.searchParams.set('churchId', selectedChurchId);
      }

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error('Failed to fetch ministries');
      }

      const result = await response.json();
      setMinistries(result.data || []);
    } catch (error) {
      console.error('Error fetching ministries:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ministries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchMinistries();
    }
  }, [organizationId, selectedChurchId]);

  // Reset form
  const resetForm = () => {
    setFormData({
      churchId: selectedChurchId || '',
      name: '',
      description: '',
      color: '#6366f1',
      icon: 'church',
    });
    setSelectedMinistry(null);
  };

  // Handle create ministry
  const handleCreateMinistry = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch('/api/worship/ministries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          ...formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create ministry');
      }

      const result = await response.json();
      setMinistries(prev => [...prev, result.data]);
      setIsCreateDialogOpen(false);
      resetForm();

      toast({
        title: 'Success',
        description: 'Ministry created successfully',
      });
    } catch (error) {
      console.error('Error creating ministry:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create ministry',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  // Handle update ministry
  const handleUpdateMinistry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMinistry) return;

    setUpdating(selectedMinistry.id);

    try {
      const response = await fetch(`/api/worship/ministries/${selectedMinistry.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          ...formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update ministry');
      }

      const result = await response.json();
      setMinistries(prev => prev.map(ministry => 
        ministry.id === selectedMinistry.id ? result.data : ministry
      ));
      setIsEditDialogOpen(false);
      resetForm();

      toast({
        title: 'Success',
        description: 'Ministry updated successfully',
      });
    } catch (error) {
      console.error('Error updating ministry:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update ministry',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  // Handle delete ministry
  const handleDeleteMinistry = async (ministryId: string) => {
    if (!confirm('Are you sure you want to delete this ministry? This action cannot be undone.')) {
      return;
    }

    setDeleting(ministryId);

    try {
      const response = await fetch(`/api/worship/ministries/${ministryId}?organizationId=${organizationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete ministry');
      }

      setMinistries(prev => prev.filter(ministry => ministry.id !== ministryId));

      toast({
        title: 'Success',
        description: 'Ministry deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting ministry:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete ministry',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  // Open edit dialog
  const openEditDialog = (ministry: Ministry) => {
    setSelectedMinistry(ministry);
    setFormData({
      churchId: ministry.churchId,
      name: ministry.name,
      description: ministry.description || '',
      color: ministry.color,
      icon: ministry.icon,
    });
    setIsEditDialogOpen(true);
  };

  // Open create dialog
  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  // Get icon component
  const getIconComponent = (iconName: string) => {
    const iconData = MINISTRY_ICONS.find(icon => icon.value === iconName);
    return iconData ? iconData.icon : Church;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading ministries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ministry Management</h2>
          <p className="text-muted-foreground">
            Manage ministries{selectedChurchId ? ' for selected church' : ' across all churches'}
          </p>
        </div>
        <Button onClick={openCreateDialog} disabled={churches.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          Add Ministry
        </Button>
      </div>

      {churches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Church className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No churches available</h3>
            <p className="text-muted-foreground text-center mb-4">
              Please create a church before adding ministries
            </p>
          </CardContent>
        </Card>
      ) : ministries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Music className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No ministries found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by creating your first ministry
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create Ministry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ministries.map((ministry) => {
            const IconComponent = getIconComponent(ministry.icon);
            return (
              <Card key={ministry.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-lg flex items-center justify-center" 
                        style={{ backgroundColor: ministry.color }}
                      >
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{ministry.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {ministry.church.name}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(ministry)}
                        disabled={updating === ministry.id}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMinistry(ministry.id)}
                        disabled={deleting === ministry.id}
                      >
                        {deleting === ministry.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-destructive" />
                        ) : (
                          <Trash2 className="h-3 w-3 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {ministry.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {ministry.description}
                    </p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Ministry Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Ministry</DialogTitle>
            <DialogDescription>
              Add a new ministry to organize your church activities
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateMinistry} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="churchId">Church *</Label>
                <Select
                  value={formData.churchId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, churchId: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select church" />
                  </SelectTrigger>
                  <SelectContent>
                    {churches.map(church => (
                      <SelectItem key={church.id} value={church.id}>
                        {church.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Ministry Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter ministry name"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the ministry"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MINISTRY_ICONS.map(iconData => {
                      const IconComponent = iconData.icon;
                      return (
                        <SelectItem key={iconData.value} value={iconData.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            {iconData.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="grid grid-cols-8 gap-2 p-2 border rounded-md">
                  {MINISTRY_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`w-6 h-6 rounded-full border-2 ${
                        formData.color === color ? 'border-gray-900' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create Ministry'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Ministry Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Ministry</DialogTitle>
            <DialogDescription>
              Update ministry information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateMinistry} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-churchId">Church *</Label>
                <Select
                  value={formData.churchId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, churchId: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select church" />
                  </SelectTrigger>
                  <SelectContent>
                    {churches.map(church => (
                      <SelectItem key={church.id} value={church.id}>
                        {church.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Ministry Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter ministry name"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the ministry"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MINISTRY_ICONS.map(iconData => {
                      const IconComponent = iconData.icon;
                      return (
                        <SelectItem key={iconData.value} value={iconData.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            {iconData.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="grid grid-cols-8 gap-2 p-2 border rounded-md">
                  {MINISTRY_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`w-6 h-6 rounded-full border-2 ${
                        formData.color === color ? 'border-gray-900' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updating === selectedMinistry?.id}>
                {updating === selectedMinistry?.id ? 'Updating...' : 'Update Ministry'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}