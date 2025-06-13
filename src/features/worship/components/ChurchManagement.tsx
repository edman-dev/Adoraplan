'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit, Plus, MapPin, Mail, Phone, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useResourceLimit } from '@/hooks/use-subscription-limits';
import { SubscriptionLimitCard } from './SubscriptionLimitCard';

interface Church {
  id: string;
  organizationId: string;
  name: string;
  address?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

interface ChurchFormData {
  name: string;
  address: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
}

interface ChurchManagementProps {
  organizationId: string;
}

export function ChurchManagement({ organizationId }: ChurchManagementProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const churchLimitCheck = useResourceLimit('churches');
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);
  
  const [formData, setFormData] = useState<ChurchFormData>({
    name: '',
    address: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
  });

  // Fetch churches
  const fetchChurches = async () => {
    try {
      const response = await fetch(`/api/worship/churches?organizationId=${organizationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch churches');
      }

      const result = await response.json();
      setChurches(result.data || []);
    } catch (error) {
      console.error('Error fetching churches:', error);
      toast({
        title: 'Error',
        description: 'Failed to load churches',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchChurches();
    }
  }, [organizationId]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      description: '',
      contactEmail: '',
      contactPhone: '',
    });
    setSelectedChurch(null);
  };

  // Handle create church
  const handleCreateChurch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch('/api/worship/churches', {
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
        
        // Handle subscription limit errors specially
        if (response.status === 402 && errorData.code === 'LIMIT_EXCEEDED') {
          toast({
            title: 'Subscription Limit Reached',
            description: errorData.message || 'You\'ve reached your church limit for this plan',
            variant: 'destructive',
          });
          return; // Don't throw, just show the error and stop
        }
        
        throw new Error(errorData.error || 'Failed to create church');
      }

      const result = await response.json();
      setChurches(prev => [...prev, result.data]);
      setIsCreateDialogOpen(false);
      resetForm();

      toast({
        title: 'Success',
        description: 'Church created successfully',
      });
    } catch (error) {
      console.error('Error creating church:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create church',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  // Handle update church
  const handleUpdateChurch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChurch) return;

    setUpdating(selectedChurch.id);

    try {
      const response = await fetch(`/api/worship/churches/${selectedChurch.id}`, {
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
        throw new Error(errorData.error || 'Failed to update church');
      }

      const result = await response.json();
      setChurches(prev => prev.map(church => 
        church.id === selectedChurch.id ? result.data : church
      ));
      setIsEditDialogOpen(false);
      resetForm();

      toast({
        title: 'Success',
        description: 'Church updated successfully',
      });
    } catch (error) {
      console.error('Error updating church:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update church',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  // Handle delete church
  const handleDeleteChurch = async (churchId: string) => {
    if (!confirm('Are you sure you want to delete this church? This action cannot be undone.')) {
      return;
    }

    setDeleting(churchId);

    try {
      const response = await fetch(`/api/worship/churches/${churchId}?organizationId=${organizationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete church');
      }

      setChurches(prev => prev.filter(church => church.id !== churchId));

      toast({
        title: 'Success',
        description: 'Church deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting church:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete church',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  // Open edit dialog
  const openEditDialog = (church: Church) => {
    setSelectedChurch(church);
    setFormData({
      name: church.name,
      address: church.address || '',
      description: church.description || '',
      contactEmail: church.contactEmail || '',
      contactPhone: church.contactPhone || '',
    });
    setIsEditDialogOpen(true);
  };

  // Open create dialog
  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading churches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Church Management</h2>
          <p className="text-muted-foreground">
            Manage churches in your organization
          </p>
        </div>
        <Button 
          onClick={openCreateDialog}
          disabled={!churchLimitCheck.allowed}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Church
        </Button>
      </div>

      {/* Show subscription limit warning if at limit */}
      {!churchLimitCheck.allowed && (
        <SubscriptionLimitCard 
          resource="churches" 
          onUpgrade={() => {
            // Handle upgrade - could open billing page, modal, etc.
            console.log('Upgrade clicked for churches');
          }}
        />
      )}

      {churches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No churches found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by creating your first church
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create Church
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {churches.map((church) => (
            <Card key={church.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{church.name}</CardTitle>
                    {church.address && (
                      <CardDescription className="flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {church.address}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(church)}
                      disabled={updating === church.id}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteChurch(church.id)}
                      disabled={deleting === church.id}
                    >
                      {deleting === church.id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-destructive" />
                      ) : (
                        <Trash2 className="h-3 w-3 text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {church.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {church.description}
                  </p>
                )}
                <div className="space-y-2">
                  {church.contactEmail && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="h-3 w-3 mr-2" />
                      {church.contactEmail}
                    </div>
                  )}
                  {church.contactPhone && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="h-3 w-3 mr-2" />
                      {church.contactPhone}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Church Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Church</DialogTitle>
            <DialogDescription>
              Add a new church to your organization
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateChurch} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Church Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter church name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  placeholder="contact@church.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Church address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the church"
                rows={3}
              />
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
                {creating ? 'Creating...' : 'Create Church'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Church Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Church</DialogTitle>
            <DialogDescription>
              Update church information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateChurch} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Church Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter church name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contactEmail">Contact Email</Label>
                <Input
                  id="edit-contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  placeholder="contact@church.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Church address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contactPhone">Contact Phone</Label>
                <Input
                  id="edit-contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the church"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updating === selectedChurch?.id}>
                {updating === selectedChurch?.id ? 'Updating...' : 'Update Church'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}