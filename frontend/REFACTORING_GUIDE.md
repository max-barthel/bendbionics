# Frontend Refactoring Guide

## Overview

This guide outlines the refactoring of the frontend components to create a more maintainable and consistent design system.

## New Component Structure

### UI Components (`/src/components/ui/`)

- **Typography**: Standardized text components with consistent styling
- **Button**: Reusable button component with variants and sizes
- **Input**: Standardized input component with error handling
- **Badge**: Status indicators and labels

### Design System (`/src/constants/design.ts`)

- **Colors**: Centralized color palette
- **Spacing**: Consistent spacing values
- **Border Radius**: Standardized border radius values
- **Shadows**: Consistent shadow definitions
- **Transitions**: Standardized transition timings

## Migration Steps

### 1. Replace Typography

**Before:**

```tsx
<h2 className="text-2xl font-semibold tracking-tight text-neutral-800">
  Soft Robot Parameters
</h2>
```

**After:**

```tsx
import { Typography } from "../components/ui";

<Typography variant="h2" color="primary">
  Soft Robot Parameters
</Typography>;
```

### 2. Replace Buttons

**Before:**

```tsx
<button className="px-4 py-2 rounded-md transition font-medium bg-black text-white hover:bg-neutral-800">
  Compute
</button>
```

**After:**

```tsx
import { Button } from "../components/ui";

<Button variant="primary" size="md" onClick={handleSubmit}>
  Compute
</Button>;
```

### 3. Replace Inputs

**Before:**

```tsx
<input className="w-full px-4 py-3 text-[15px] rounded-xl border border-neutral-300 bg-neutral-100" />
```

**After:**

```tsx
import { Input } from "../components/ui";

<Input
  type="number"
  size="md"
  value={value}
  onChange={setValue}
  placeholder="Enter value"
/>;
```

### 4. Replace Badges

**Before:**

```tsx
<span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
  {value}
</span>
```

**After:**

```tsx
import { Badge } from "../components/ui";

<Badge variant="info" size="md">
  {value}
</Badge>;
```

## Benefits

### Consistency

- All components follow the same design patterns
- Consistent spacing, colors, and typography
- Unified interaction patterns

### Maintainability

- Changes to design tokens affect all components
- Reduced code duplication
- Easier to implement design updates

### Developer Experience

- Type-safe component props
- IntelliSense support for variants
- Clear component API

### Performance

- Smaller bundle size through code reuse
- Optimized component rendering
- Consistent styling without CSS conflicts

## Usage Examples

### Typography Variants

```tsx
<Typography variant="h1" color="primary">Main Title</Typography>
<Typography variant="h2" color="secondary">Section Title</Typography>
<Typography variant="body" color="neutral">Body text</Typography>
<Typography variant="label" color="blue">Form label</Typography>
```

### Button Variants

```tsx
<Button variant="primary" size="lg">Primary Action</Button>
<Button variant="secondary" size="md">Secondary Action</Button>
<Button variant="outline" size="sm">Tertiary Action</Button>
<Button variant="ghost" loading={true}>Loading</Button>
```

### Input Types

```tsx
<Input type="text" placeholder="Enter name" />
<Input type="number" placeholder="Enter value" />
<Input type="email" placeholder="Enter email" />
<Input error="This field is required" />
```

### Badge Variants

```tsx
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="error">Error</Badge>
<Badge variant="info">Info</Badge>
```

## Migration Checklist

- [ ] Replace all hardcoded typography classes with Typography component
- [ ] Replace all button elements with Button component
- [ ] Replace all input elements with Input component
- [ ] Replace status indicators with Badge component
- [ ] Update imports to use new UI component index
- [ ] Remove duplicate CSS classes
- [ ] Test all components for visual consistency
- [ ] Update documentation and examples
