import { useState, useCallback } from 'react';

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

interface NavigationState {
  church?: Church;
  ministry?: Ministry;
  service?: Service;
  level: 'churches' | 'ministries' | 'services';
}

interface NavigationPath {
  church?: { id: number; name: string };
  ministry?: { id: number; name: string; color: string };
  service?: { id: number; name: string };
}

export function useOrganizationalNavigation(initialState?: Partial<NavigationState>) {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    level: 'churches',
    ...initialState
  });

  const selectChurch = useCallback((church: Church) => {
    setNavigationState({
      church,
      ministry: undefined,
      service: undefined,
      level: 'ministries'
    });
  }, []);

  const selectMinistry = useCallback((ministry: Ministry) => {
    setNavigationState(prev => ({
      ...prev,
      ministry,
      service: undefined,
      level: 'services'
    }));
  }, []);

  const selectService = useCallback((service: Service) => {
    setNavigationState(prev => ({
      ...prev,
      service,
      level: 'services'
    }));
  }, []);

  const navigateToChurches = useCallback(() => {
    setNavigationState({
      church: undefined,
      ministry: undefined,
      service: undefined,
      level: 'churches'
    });
  }, []);

  const navigateToMinistries = useCallback(() => {
    setNavigationState(prev => ({
      church: prev.church,
      ministry: undefined,
      service: undefined,
      level: 'ministries'
    }));
  }, []);

  const navigateToServices = useCallback(() => {
    setNavigationState(prev => ({
      ...prev,
      service: undefined,
      level: 'services'
    }));
  }, []);

  const getNavigationPath = useCallback((): NavigationPath => {
    const path: NavigationPath = {};
    
    if (navigationState.church) {
      path.church = {
        id: navigationState.church.id,
        name: navigationState.church.name
      };
    }
    
    if (navigationState.ministry) {
      path.ministry = {
        id: navigationState.ministry.id,
        name: navigationState.ministry.name,
        color: navigationState.ministry.color
      };
    }
    
    if (navigationState.service) {
      path.service = {
        id: navigationState.service.id,
        name: navigationState.service.name
      };
    }
    
    return path;
  }, [navigationState]);

  const isAtLevel = useCallback((level: 'churches' | 'ministries' | 'services') => {
    return navigationState.level === level;
  }, [navigationState.level]);

  const canNavigateBack = useCallback(() => {
    return navigationState.level !== 'churches';
  }, [navigationState.level]);

  const navigateBack = useCallback(() => {
    if (navigationState.level === 'services') {
      navigateToMinistries();
    } else if (navigationState.level === 'ministries') {
      navigateToChurches();
    }
  }, [navigationState.level, navigateToChurches, navigateToMinistries]);

  const hasSelection = useCallback(() => {
    return !!(navigationState.church || navigationState.ministry || navigationState.service);
  }, [navigationState]);

  const getSelectionSummary = useCallback(() => {
    const summary: { church?: string; ministry?: string; service?: string } = {};
    
    if (navigationState.church) {
      summary.church = navigationState.church.name;
    }
    
    if (navigationState.ministry) {
      summary.ministry = navigationState.ministry.name;
    }
    
    if (navigationState.service) {
      summary.service = navigationState.service.name;
    }
    
    return summary;
  }, [navigationState]);

  const reset = useCallback(() => {
    setNavigationState({
      church: undefined,
      ministry: undefined,
      service: undefined,
      level: 'churches'
    });
  }, []);

  return {
    // State
    navigationState,
    
    // Selection actions
    selectChurch,
    selectMinistry,
    selectService,
    
    // Navigation actions
    navigateToChurches,
    navigateToMinistries,
    navigateToServices,
    navigateBack,
    
    // Utility functions
    getNavigationPath,
    isAtLevel,
    canNavigateBack,
    hasSelection,
    getSelectionSummary,
    reset,
    
    // Computed values
    currentChurch: navigationState.church,
    currentMinistry: navigationState.ministry,
    currentService: navigationState.service,
    currentLevel: navigationState.level,
  };
}