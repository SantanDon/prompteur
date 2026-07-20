# UI review checklist

## Hierarchy

- Can a first-time user identify the source, target, primary action, and result within five seconds?
- Is the compiler the dominant object rather than the page heading?
- Is every container earning its border and background?

## Interaction

- Does the primary action use an explicit label?
- Are disabled actions explained by nearby state or provider status?
- Do tabs expose active state visually and semantically?
- Does mobile compilation bring the result into a useful reading position without trapping focus?

## Responsive behavior

- Test 1440, 1024, 390, and 320 widths.
- Confirm `scrollWidth <= innerWidth` at the document level.
- Test long unbroken text, URLs, JSON, and provider messages.
- Confirm dialog controls and footers remain visible at short viewport heights.

## Accessibility

- Keyboard-only completion of the core flow.
- Visible focus on all controls.
- Labels and descriptions associated with inputs.
- Tab arrow-key navigation.
- Live output and status updates are polite, not disruptive.
- Progress signals expose values programmatically.
- Color is not the only active/error indicator.

## Visual quality

- No gradient, glow, glass, or unnecessary shadow.
- No detached metric-card dashboard.
- No icon-only primary controls.
- No decorative text larger than the product task warrants.
- Consistent spacing, border, corner, and type scales.
