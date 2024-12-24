import { User } from 'lucide-react';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ size = 'md', className = '' }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`bg-gradient-to-l from-blue-600 to-blue-700 ${sizeClasses[size]} rounded-lg ${className}`}>
      <User className={`${iconSizes[size]} text-white`} />
    </div>
  );
}
