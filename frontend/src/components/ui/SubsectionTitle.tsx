import Typography from './Typography';

interface SubsectionTitleProps {
  readonly title: string;
  readonly description?: string;
  readonly className?: string;
}

export function SubsectionTitle({
  title,
  description,
  className = '',
}: Readonly<SubsectionTitleProps>) {
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
}
