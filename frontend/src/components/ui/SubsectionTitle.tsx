import React from 'react';
import Typography from './Typography';

interface SubsectionTitleProps {
  title: string;
  description?: string;
  className?: string;
}

export const SubsectionTitle: React.FC<SubsectionTitleProps> = ({
  title,
  description,
  className = '',
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <Typography variant="h5" color="primary">
        {title}
      </Typography>
      {description && (
        <Typography variant="caption" className="text-gray-500 text-xs break-words">
          {description}
        </Typography>
      )}
    </div>
  );
};
