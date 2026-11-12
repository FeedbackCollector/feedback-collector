import React from 'react';
import { getInitials, getAvatarColor } from '../utils/avatar';

interface UserAvatarProps {
  name: string;
  id: string | number;
  entityType?: 'user' | 'manager' | 'ic';
  size?: number;
  className?: string;
}

export function UserAvatar({
  name,
  id,
  entityType = 'user',
  size = 40,
  className,
}: UserAvatarProps) {
  const initials = getInitials(name);
  const backgroundColor = getAvatarColor(id, entityType);

  return (
    <div className={className}
      style={{
        backgroundColor,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: `${size * 0.4}px`,
        userSelect: 'none',
      }}
      title={name}
    >
      {initials}
    </div>
  );
}