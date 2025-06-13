'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Clock, Plus, Pencil, Trash2, Calendar } from 'lucide-react';

interface Service {
  id: number;
  ministryId: number;
  name: string;
  description: string | null;
  defaultDuration: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Ministry {
  id: number;
  name: string;
  color: string;
  icon: string;
}

interface ServiceManagementProps {
  ministries: Ministry[];
  selectedMinistryId?: number;
  onMinistryChange?: (ministryId: number) => void;
}

// Common service types with default durations (in minutes)
const COMMON_SERVICE_TYPES = [
  { name: 'Sunday Morning Service', duration: 90 },
  { name: 'Sunday Evening Service', duration: 75 },
  { name: 'Wednesday Prayer Meeting', duration: 60 },
  { name: 'Youth Service', duration: 90 },
  { name: 'Bible Study', duration: 60 },
  { name: 'Special Event', duration: 120 },
  { name: 'Baptism Service', duration: 45 },
  { name: 'Communion Service', duration: 30 },
  { name: 'Revival Meeting', duration: 120 },
  { name: 'Holiday Service', duration: 90 },
];

export function ServiceManagement({ ministries, selectedMinistryId, onMinistryChange }: ServiceManagementProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [currentMinistryId, setCurrentMinistryId] = useState<number | undefined>(selectedMinistryId);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultDuration: 90,
  });

  // Load services when ministry changes
  useEffect(() => {
    if (currentMinistryId) {
      loadServices(currentMinistryId);
    } else {
      setServices([]);
    }
  }, [currentMinistryId]);

  const loadServices = async (ministryId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/worship/services?ministryId=${ministryId}`);
      const result = await response.json();

      if (result.success) {
        setServices(result.data);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to load services',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to load services:', error);
      toast({
        title: 'Error',
        description: 'Failed to load services',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMinistryChange = (ministryId: string) => {
    const id = parseInt(ministryId);
    setCurrentMinistryId(id);
    onMinistryChange?.(id);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      defaultDuration: 90,
    });
  };

  const handleCreateService = async () => {
    if (!currentMinistryId) {
      toast({
        title: 'Error',
        description: 'Please select a ministry first',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Service name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/worship/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ministryId: currentMinistryId,
          ...formData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Service created successfully',
        });
        setServices([...services, result.data]);
        setIsCreateDialogOpen(false);
        resetForm();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create service',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to create service:', error);
      toast({
        title: 'Error',
        description: 'Failed to create service',
        variant: 'destructive',
      });
    }
  };

  const handleEditService = async () => {
    if (!editingService) return;

    try {
      const response = await fetch(`/api/worship/services/${editingService.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Service updated successfully',
        });
        setServices(services.map(s => s.id === editingService.id ? result.data : s));
        setIsEditDialogOpen(false);
        setEditingService(null);
        resetForm();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update service',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to update service:', error);
      toast({
        title: 'Error',
        description: 'Failed to update service',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteService = async (service: Service) => {
    if (!confirm(`Are you sure you want to delete "${service.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/worship/services/${service.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Service deleted successfully',
        });
        setServices(services.filter(s => s.id !== service.id));
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete service',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to delete service:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete service',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      defaultDuration: service.defaultDuration,
    });
    setIsEditDialogOpen(true);
  };

  const useCommonServiceType = (serviceType: typeof COMMON_SERVICE_TYPES[0]) => {
    setFormData({
      ...formData,
      name: serviceType.name,
      defaultDuration: serviceType.duration,
    });
  };

  const getCurrentMinistry = () => {
    return ministries.find(m => m.id === currentMinistryId);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Service Management</h2>
          <p className="text-muted-foreground">
            Manage service types within your ministries (Sunday Service, Wednesday Prayer, etc.)
          </p>
        </div>
      </div>

      {/* Ministry Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Ministry</CardTitle>
          <CardDescription>
            Choose a ministry to manage its service types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={currentMinistryId?.toString() || ''} onValueChange={handleMinistryChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a ministry..." />
            </SelectTrigger>
            <SelectContent>
              {ministries.map((ministry) => (
                <SelectItem key={ministry.id} value={ministry.id.toString()}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: ministry.color }}
                    />
                    {ministry.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Services List */}
      {currentMinistryId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Services for {getCurrentMinistry()?.name}
                </CardTitle>
                <CardDescription>
                  Manage service types and their default durations
                </CardDescription>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Service</DialogTitle>
                    <DialogDescription>
                      Add a new service type to {getCurrentMinistry()?.name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Common Service Types */}
                    <div>
                      <Label className="text-sm font-medium">Common Service Types</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {COMMON_SERVICE_TYPES.slice(0, 6).map((serviceType) => (
                          <Button
                            key={serviceType.name}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => useCommonServiceType(serviceType)}
                          >
                            {serviceType.name}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="name">Service Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Sunday Morning Service"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Optional description..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration">Default Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="15"
                        max="480"
                        value={formData.defaultDuration}
                        onChange={(e) => setFormData({ ...formData, defaultDuration: parseInt(e.target.value) || 90 })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateService}>
                      Create Service
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading services...</p>
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No services found</p>
                <p className="text-sm text-muted-foreground">Create your first service type to get started</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Default Duration: {formatDuration(service.defaultDuration)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(service)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteService(service)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update the service details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Service Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Sunday Morning Service"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-duration">Default Duration (minutes)</Label>
              <Input
                id="edit-duration"
                type="number"
                min="15"
                max="480"
                value={formData.defaultDuration}
                onChange={(e) => setFormData({ ...formData, defaultDuration: parseInt(e.target.value) || 90 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditService}>
              Update Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}