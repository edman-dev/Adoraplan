'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Building, 
  Users, 
  Calendar, 
  ChevronRight, 
  Home, 
  ArrowLeft,
  Plus,
  Settings,
  Clock
} from 'lucide-react';

interface Church {
  id: number;
  organizationId: string;
  name: string;
  description?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Ministry {
  id: number;
  churchId: number;
  name: string;
  description?: string;
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Service {
  id: number;
  ministryId: number;
  name: string;
  description?: string;
  defaultDuration: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NavigationLevel {
  type: 'churches' | 'ministries' | 'services';
  churchId?: number;
  ministryId?: number;
}

interface BreadcrumbItem {
  label: string;
  level: NavigationLevel;
  icon: React.ReactNode;
}

interface OrganizationalHierarchyProps {
  organizationId: string;
  onSelectionChange?: (selection: {
    church?: Church;
    ministry?: Ministry;
    service?: Service;
  }) => void;
  allowManagement?: boolean;
  initialSelection?: {
    churchId?: number;
    ministryId?: number;
    serviceId?: number;
  };
}

export function OrganizationalHierarchy({
  organizationId,
  onSelectionChange,
  allowManagement = false,
  initialSelection
}: OrganizationalHierarchyProps) {
  const [churches, setChurches] = useState<Church[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<NavigationLevel>({ type: 'churches' });
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    loadChurches();
  }, [organizationId]);

  // Handle initial selection
  useEffect(() => {
    if (initialSelection?.churchId && churches.length > 0) {
      const church = churches.find(c => c.id === initialSelection.churchId);
      if (church) {
        handleChurchSelect(church);
        
        if (initialSelection.ministryId) {
          loadMinistries(church.id).then(() => {
            // This will be handled in the next useEffect
          });
        }
      }
    }
  }, [churches, initialSelection]);

  // Handle ministry selection after ministries load
  useEffect(() => {
    if (initialSelection?.ministryId && ministries.length > 0 && selectedChurch) {
      const ministry = ministries.find(m => m.id === initialSelection.ministryId);
      if (ministry) {
        handleMinistrySelect(ministry);
        
        if (initialSelection.serviceId) {
          loadServices(ministry.id);
        }
      }
    }
  }, [ministries, initialSelection, selectedChurch]);

  // Handle service selection after services load
  useEffect(() => {
    if (initialSelection?.serviceId && services.length > 0) {
      const service = services.find(s => s.id === initialSelection.serviceId);
      if (service) {
        handleServiceSelect(service);
      }
    }
  }, [services, initialSelection]);

  const loadChurches = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/worship/churches?organizationId=${organizationId}`);
      const result = await response.json();
      
      if (result.success) {
        setChurches(result.data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load churches',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to load churches:', error);
      toast({
        title: 'Error',
        description: 'Failed to load churches',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMinistries = async (churchId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/worship/ministries?churchId=${churchId}`);
      const result = await response.json();
      
      if (result.success) {
        setMinistries(result.data);
        return result.data;
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load ministries',
          variant: 'destructive',
        });
        return [];
      }
    } catch (error) {
      console.error('Failed to load ministries:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ministries',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async (ministryId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/worship/services?ministryId=${ministryId}`);
      const result = await response.json();
      
      if (result.success) {
        setServices(result.data);
        return result.data;
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load services',
          variant: 'destructive',
        });
        return [];
      }
    } catch (error) {
      console.error('Failed to load services:', error);
      toast({
        title: 'Error',
        description: 'Failed to load services',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleChurchSelect = async (church: Church) => {
    setSelectedChurch(church);
    setSelectedMinistry(null);
    setSelectedService(null);
    setMinistries([]);
    setServices([]);
    
    setCurrentLevel({ type: 'ministries', churchId: church.id });
    setBreadcrumbs([
      {
        label: church.name,
        level: { type: 'churches' },
        icon: <Building className="h-4 w-4" />
      }
    ]);
    
    await loadMinistries(church.id);
    
    onSelectionChange?.({
      church,
      ministry: undefined,
      service: undefined
    });
  };

  const handleMinistrySelect = async (ministry: Ministry) => {
    setSelectedMinistry(ministry);
    setSelectedService(null);
    setServices([]);
    
    setCurrentLevel({ type: 'services', churchId: selectedChurch!.id, ministryId: ministry.id });
    setBreadcrumbs([
      {
        label: selectedChurch!.name,
        level: { type: 'churches' },
        icon: <Building className="h-4 w-4" />
      },
      {
        label: ministry.name,
        level: { type: 'ministries', churchId: selectedChurch!.id },
        icon: <Users className="h-4 w-4" style={{ color: ministry.color }} />
      }
    ]);
    
    await loadServices(ministry.id);
    
    onSelectionChange?.({
      church: selectedChurch!,
      ministry,
      service: undefined
    });
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    
    onSelectionChange?.({
      church: selectedChurch!,
      ministry: selectedMinistry!,
      service
    });
  };

  const navigateToLevel = (level: NavigationLevel) => {
    setCurrentLevel(level);
    
    if (level.type === 'churches') {
      setSelectedChurch(null);
      setSelectedMinistry(null);
      setSelectedService(null);
      setMinistries([]);
      setServices([]);
      setBreadcrumbs([]);
    } else if (level.type === 'ministries') {
      setSelectedMinistry(null);
      setSelectedService(null);
      setServices([]);
      setBreadcrumbs(breadcrumbs.slice(0, 1));
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const renderBreadcrumbs = () => {
    if (breadcrumbs.length === 0) return null;

    return (
      <div className="flex items-center gap-2 mb-6 p-3 bg-muted/50 rounded-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateToLevel({ type: 'churches' })}
          className="p-1 h-auto"
        >
          <Home className="h-4 w-4" />
        </Button>
        
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateToLevel(crumb.level)}
              className="h-auto flex items-center gap-2"
            >
              {crumb.icon}
              {crumb.label}
            </Button>
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderChurches = () => (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-8">Loading churches...</div>
      ) : churches.length === 0 ? (
        <div className="text-center py-8">
          <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No churches found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {churches.map((church) => (
            <Card 
              key={church.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleChurchSelect(church)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-medium">{church.name}</h3>
                      {church.description && (
                        <p className="text-sm text-muted-foreground">{church.description}</p>
                      )}
                      {church.address && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Building className="h-3 w-3" />
                          {church.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderMinistries = () => (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-8">Loading ministries...</div>
      ) : ministries.length === 0 ? (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No ministries found</p>
          <p className="text-sm text-muted-foreground">Add ministries to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {ministries.map((ministry) => (
            <Card 
              key={ministry.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleMinistrySelect(ministry)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: ministry.color }}
                    >
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium">{ministry.name}</h3>
                      {ministry.description && (
                        <p className="text-sm text-muted-foreground">{ministry.description}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderServices = () => (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-8">Loading services...</div>
      ) : services.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No services found</p>
          <p className="text-sm text-muted-foreground">Add service types to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {services.map((service) => (
            <Card 
              key={service.id} 
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                selectedService?.id === service.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleServiceSelect(service)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-medium">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Default: {formatDuration(service.defaultDuration)}
                      </div>
                    </div>
                  </div>
                  {selectedService?.id === service.id && (
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Organizational Hierarchy</h2>
          <p className="text-muted-foreground">
            Navigate through your churches, ministries, and services
          </p>
        </div>
        
        {currentLevel.type !== 'churches' && (
          <Button
            variant="outline"
            onClick={() => {
              if (currentLevel.type === 'services') {
                navigateToLevel({ type: 'ministries', churchId: currentLevel.churchId });
              } else {
                navigateToLevel({ type: 'churches' });
              }
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
      </div>

      {renderBreadcrumbs()}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentLevel.type === 'churches' && (
              <>
                <Building className="h-5 w-5" />
                Churches
              </>
            )}
            {currentLevel.type === 'ministries' && (
              <>
                <Users className="h-5 w-5" />
                Ministries in {selectedChurch?.name}
              </>
            )}
            {currentLevel.type === 'services' && (
              <>
                <Calendar className="h-5 w-5" />
                Services in {selectedMinistry?.name}
              </>
            )}
          </CardTitle>
          <CardDescription>
            {currentLevel.type === 'churches' && 'Select a church to view its ministries'}
            {currentLevel.type === 'ministries' && 'Select a ministry to view its services'}
            {currentLevel.type === 'services' && 'Select a service type for event planning'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentLevel.type === 'churches' && renderChurches()}
          {currentLevel.type === 'ministries' && renderMinistries()}
          {currentLevel.type === 'services' && renderServices()}
        </CardContent>
      </Card>

      {/* Selection Summary */}
      {(selectedChurch || selectedMinistry || selectedService) && (
        <Card>
          <CardHeader>
            <CardTitle>Current Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedChurch && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Church:</span>
                  <span>{selectedChurch.name}</span>
                </div>
              )}
              {selectedMinistry && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" style={{ color: selectedMinistry.color }} />
                  <span className="font-medium">Ministry:</span>
                  <span>{selectedMinistry.name}</span>
                </div>
              )}
              {selectedService && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Service:</span>
                  <span>{selectedService.name}</span>
                  <span className="text-sm text-muted-foreground">
                    ({formatDuration(selectedService.defaultDuration)})
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}