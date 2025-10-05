interface RobotStructureInfoProps {
  readonly segments: number;
}

/**
 * RobotStructureInfo - Displays information about the robot structure based on segments
 *
 * This component provides helpful information about how the robot structure
 * is organized based on the number of segments selected.
 */
export function RobotStructureInfo({ segments }: RobotStructureInfoProps) {
  return (
    <div className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg">
      <p className="font-medium mb-1">Robot Structure:</p>
      <ul className="text-xs space-y-1">
        <li>
          • <strong>{segments}</strong> backbone(s) + <strong>{segments + 1}</strong>{' '}
          coupling(s)
        </li>
        <li>• Each segment consists of one backbone and one coupling</li>
        <li>• The base coupling is always present (first coupling)</li>
        <li>• Adjusting segments will automatically update all input fields below</li>
      </ul>
    </div>
  );
}
