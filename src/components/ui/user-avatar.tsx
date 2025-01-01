import { User, Pencil, Trash2, Camera } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  profileImage?: string | null;
  onImageChange?: (file: File) => void;
  onImageRemove?: () => void;
  editable?: boolean;
  user?: { fullName?: string };
  variant?: 'circle' | 'square';
}

export function UserAvatar({ 
  size = 'md', 
  className = '', 
  profileImage,
  onImageChange,
  onImageRemove,
  editable = false,
  user,
  variant = 'circle'
}: UserAvatarProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-16 w-16'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-2xl'
  };

  const getInitials = (name?: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onImageChange) return;
    onImageChange(file);
    setShowActions(false);
  };

  const handleRemove = () => {
    if (onImageRemove) {
      onImageRemove();
      setShowActions(false);
    }
  };

  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [profileImage]);

  const DefaultAvatar = () => (
    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 transition-all duration-300`}>
      {user?.fullName ? (
        <span className={`text-white font-semibold ${textSizes[size]}`}>{getInitials(user.fullName)}</span>
      ) : (
        <User className={`${iconSizes[size]} text-white/90`} />
      )}
    </div>
  );

  const roundedClass = variant === 'circle' ? 'rounded-full' : 'rounded-xl';
  const ringClass = variant === 'circle' ? '' : 'ring-2 ring-blue-200 ring-offset-2 hover:ring-blue-300';

  return (
    <div className="relative">
      <div className={`group relative ${sizeClasses[size]} ${className}`}>
        <div 
          className={`w-full h-full ${roundedClass} overflow-hidden shadow-sm hover:shadow-md ${ringClass} hover:scale-105 transition-all duration-300 cursor-pointer`}
          onClick={() => editable && fileInputRef.current?.click()}
        >
          {profileImage && !imageError ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 ${!imageLoaded ? 'animate-pulse' : 'hidden'}`}>
                <User className={`${iconSizes[size]} text-gray-400`} />
              </div>
              <img 
                src={profileImage}
                alt="Profile" 
                className={`w-full h-full object-cover transition-all duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  console.error('Failed to load profile image:', profileImage);
                  setImageError(true);
                }}
              />
            </div>
          ) : (
            <DefaultAvatar />
          )}
        </div>

        {editable && (
          <>
            <button 
              onClick={() => setShowActions(!showActions)}
              className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 bg-gradient-to-r from-blue-700 to-blue-500 text-white p-2.5 rounded-full cursor-pointer shadow-lg hover:shadow-xl hover:scale-110 hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-400 transition-all duration-300 z-10"
            >
              <Pencil className="w-4 h-4" />
            </button>

            {showActions && (
              <div className="absolute -bottom-14 right-0 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-2.5 rounded-full cursor-pointer shadow-lg hover:shadow-xl hover:scale-110 hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-400 transition-all duration-300"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleRemove}
                  className="bg-red-50 text-red-600 p-2.5 rounded-full cursor-pointer shadow-lg hover:shadow-xl hover:scale-110 hover:bg-red-100 transition-all duration-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </>
        )}
      </div>
    </div>
  );
}
