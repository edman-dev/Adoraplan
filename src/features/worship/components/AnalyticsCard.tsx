'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface AnalyticsCardProps {
  title: string;
  description?: string;
  value: number | string;
  previousValue?: number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendPercentage?: number;
  icon?: LucideIcon;
  progress?: {
    current: number;
    max: number;
    label?: string;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
  children?: React.ReactNode;
}

export function AnalyticsCard({
  title,
  description,
  value,
  previousValue,
  unit = '',
  trend,
  trendPercentage,
  icon: Icon,
  progress,
  variant = 'default',
  children,
}: AnalyticsCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      case 'stable':
        return <Minus className="h-3 w-3 text-gray-600" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'stable':
        return 'text-gray-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'danger':
        return 'border-red-200 bg-red-50';
      default:
        return '';
    }
  };

  const formatValue = (val: number | string) => {
    if (typeof val === 'number') {
      // Format large numbers with commas
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <Card className={getVariantStyles()}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </div>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Main Value */}
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              {formatValue(value)}{unit}
            </span>
            {trend && trendPercentage !== undefined && (
              <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="text-xs font-medium">
                  {Math.abs(trendPercentage)}%
                </span>
              </div>
            )}
          </div>

          {/* Trend Information */}
          {previousValue !== undefined && trend && (
            <p className="text-xs text-muted-foreground">
              {trend === 'up' && 'Increased from'}
              {trend === 'down' && 'Decreased from'}
              {trend === 'stable' && 'Same as'}
              {' '}
              {formatValue(previousValue)}{unit} last period
            </p>
          )}

          {/* Progress Bar */}
          {progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {progress.label || 'Progress'}
                </span>
                <span className="font-medium">
                  {progress.current}/{progress.max === -1 ? '∞' : progress.max}
                </span>
              </div>
              <Progress 
                value={progress.max === -1 ? 0 : (progress.current / progress.max) * 100}
                className="h-2"
              />
            </div>
          )}

          {/* Custom Content */}
          {children && (
            <div className="mt-3">
              {children}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricBadgeProps {
  label: string;
  value: number | string;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger';
}

export function MetricBadge({ label, value, variant = 'secondary' }: MetricBadgeProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Badge variant={variant} className="text-xs">
        {value}
      </Badge>
    </div>
  );
}

interface QuickStatProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
}

export function QuickStat({ icon: Icon, label, value, change }: QuickStatProps) {
  const getChangeColor = () => {
    if (!change) return 'text-muted-foreground';
    switch (change.type) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      case 'neutral':
        return 'text-gray-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getChangeIcon = () => {
    if (!change) return null;
    switch (change.type) {
      case 'increase':
        return <TrendingUp className="h-3 w-3" />;
      case 'decrease':
        return <TrendingDown className="h-3 w-3" />;
      case 'neutral':
        return <Minus className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
      <div className="p-2 bg-primary/10 rounded-full">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      {change && (
        <div className={`flex items-center space-x-1 ${getChangeColor()}`}>
          {getChangeIcon()}
          <span className="text-xs font-medium">
            {Math.abs(change.value)}%
          </span>
        </div>
      )}
    </div>
  );
}