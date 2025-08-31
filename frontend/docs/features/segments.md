# Segments Slider Feature

## Overview

The segments slider controls the number of segments in the soft robot, which dynamically adjusts the number of input fields for all robot parameters.

## How It Works

### Robot Structure

- **Minimum segments**: 1 (1 backbone + 2 couplings including base coupling)
- **Maximum segments**: 10 (10 backbones + 11 couplings)
- **Base coupling**: Always present as the first coupling element

### Parameter Arrays

When you adjust the segments slider, the following arrays are automatically updated:

1. **Bending Angles**: `segments` values (one per backbone)
2. **Rotation Angles**: `segments` values (one per backbone)
3. **Backbone Lengths**: `segments` values (one per backbone)
4. **Coupling Lengths**: `segments + 1` values (one per coupling, including base)

### Default Values

When new segments are added, they use these default values:

- Bending Angle: 0.628319 rad (~36°)
- Rotation Angle: 1.0471975512 rad (~60°)
- Backbone Length: 0.07 m (70mm)
- Coupling Length: 0.03 m (30mm)

### Implementation Details

- The logic is implemented in `useRobotState.ts`
- Arrays are automatically resized when segments change
- Existing values are preserved when possible
- New elements get default values
- Excess elements are removed when reducing segments

### User Experience

- Real-time feedback showing current robot structure
- Responsive grid layout that adapts to the number of inputs
- Clear visual indication of how many backbones and couplings are present
- Automatic validation ensures arrays have correct lengths
