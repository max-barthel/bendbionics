import { panelVariants } from '../../styles/design-tokens';
import { combineStyles } from '../../styles/tahoe-utils';

interface PanelContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly children: React.ReactNode;
  readonly variant?: 'default' | 'segmentSelector';
  readonly className?: string;
}

/**
 * PanelContainer - Reusable panel container with Tahoe glass styling
 *
 * Extracted from TendonResultsPanel, AngleControlPanel, and other components
 * to eliminate hardcoded style duplication.
 */
export function PanelContainer({
  children,
  variant = 'default',
  className = '',
  ...restProps
}: Readonly<PanelContainerProps>) {
  const variantClass =
    variant === 'segmentSelector'
      ? panelVariants.segmentSelector
      : panelVariants.container;
  const classes = combineStyles(variantClass, className);

  return (
    <div className={classes} {...restProps}>
      {children}
    </div>
  );
}
