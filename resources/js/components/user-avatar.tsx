import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { type User } from '@/types';

type UserAvatarProps = {
  user: User | { id?: number; name: string; email?: string; avatar?: string | null } | null | undefined;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTooltip?: boolean;
  className?: string;
  fallbackClassName?: string;
};

const sizeMap = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

const fallbackSizeMap = {
  xs: 'text-[10px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

/**
 * Generate a consistent color based on user ID or name
 */
function getAvatarColor(user: UserAvatarProps['user']): string {
  if (!user) return 'bg-neutral-500';
  
  // Use user ID if available, otherwise hash the name
  const seed = user.id || user.name.charCodeAt(0) + (user.name.length || 0);
  
  // Color palette - professional, accessible colors
  const colors = [
    'bg-blue-500',
    'bg-indigo-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-rose-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-violet-500',
  ];
  
  return colors[seed % colors.length];
}

/**
 * Optimized User Avatar Component
 * 
 * Features:
 * - Consistent sizing with size variants
 * - Color-coded initials fallback
 * - Tooltip support
 * - Smooth transitions
 * - Accessible
 */
export function UserAvatar({
  user,
  size = 'md',
  showTooltip = true,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const getInitials = useInitials();
  
  if (!user) {
    return (
      <Avatar className={cn(sizeMap[size], className)}>
        <AvatarFallback className={cn('bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400', fallbackSizeMap[size], fallbackClassName)}>
          ?
        </AvatarFallback>
      </Avatar>
    );
  }

  const initials = getInitials(user.name);
  const avatarColor = getAvatarColor(user);
  const avatarUrl = user.avatar ? (user.avatar.startsWith('http') ? user.avatar : `/storage/${user.avatar}`) : null;
  const tooltipText = user.email ? `${user.name} (${user.email})` : user.name;

  const avatarElement = (
    <Avatar className={cn(sizeMap[size], 'transition-all duration-200 hover:ring-2 hover:ring-primary/20 hover:ring-offset-2', className)}>
      <AvatarImage 
        src={avatarUrl || undefined} 
        alt={user.name}
        className="object-cover"
      />
      <AvatarFallback 
        className={cn(
          avatarColor,
          'text-white font-semibold',
          fallbackSizeMap[size],
          fallbackClassName
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );

  if (showTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {avatarElement}
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return avatarElement;
}

