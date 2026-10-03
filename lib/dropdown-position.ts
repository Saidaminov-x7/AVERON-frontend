export interface DropdownPositionInput {
  trigger: Pick<DOMRect, 'top' | 'bottom' | 'left' | 'right' | 'width'>;
  menuHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  gutter?: number;
  gap?: number;
}

export interface DropdownPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: 'up' | 'down';
}

export function calculateDropdownPosition({
  trigger,
  menuHeight,
  viewportWidth,
  viewportHeight,
  gutter = 8,
  gap = 4,
}: DropdownPositionInput): DropdownPosition {
  const below = Math.max(0, viewportHeight - gutter - trigger.bottom - gap);
  const above = Math.max(0, trigger.top - gutter - gap);
  const placement = menuHeight <= below || below >= above ? 'down' : 'up';
  const maxHeight = Math.max(0, Math.min(menuHeight, placement === 'down' ? below : above));
  const width = Math.min(trigger.width, Math.max(0, viewportWidth - gutter * 2));
  const left = Math.min(
    Math.max(gutter, trigger.left),
    Math.max(gutter, viewportWidth - gutter - width),
  );
  const top = placement === 'down'
    ? Math.min(viewportHeight - gutter, trigger.bottom + gap)
    : Math.max(gutter, trigger.top - gap - maxHeight);

  return { top, left, width, maxHeight, placement };
}
