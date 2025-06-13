import { LucideIcon } from 'lucide-react';

interface PlaceholderSectionProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  additionalInfo?: string;
  variant?: 'default' | 'compact';
  titleClassName?: string;
  descriptionClassName?: string;
  showToBeBuildLabel?: boolean;
  customLabel?: string;
}

export function PlaceholderSection({
  title,
  description,
  icon: Icon,
  additionalInfo,
  variant = 'default',
  titleClassName,
  descriptionClassName,
  showToBeBuildLabel = true,
  customLabel,
}: PlaceholderSectionProps) {
  const isCompact = variant === 'compact';

  return (
    <div className={`flex flex-col items-center justify-center text-center ${isCompact ? 'py-8' : 'py-16'}`}>
      {Icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      
      <div className="space-y-2">
        <h2 className={`font-semibold text-foreground ${isCompact ? 'text-lg' : 'text-xl'} ${titleClassName || ''}`}>
          {title}
        </h2>
        
        <p className={`text-muted-foreground ${isCompact ? 'text-sm' : 'text-base'} max-w-md ${descriptionClassName || ''}`}>
          {description}
        </p>
      </div>

      {showToBeBuildLabel && (
        <div className="mt-6 space-y-2">
          <div className="rounded-md bg-muted px-4 py-2 text-sm text-muted-foreground">
            <strong>{customLabel || 'To be built'}</strong> - This feature is planned for future development
          </div>
          
          {additionalInfo && (
            <div className="text-xs text-muted-foreground max-w-lg">
              {additionalInfo}
            </div>
          )}
        </div>
      )}
    </div>
  );
}