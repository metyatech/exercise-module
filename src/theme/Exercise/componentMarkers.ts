type MarkableComponent = {
  displayName?: string;
  name?: string;
  render?: unknown;
  type?: unknown;
  [key: string]: unknown;
};

export function markExerciseComponent<T extends object>(
  component: T,
  markerName: string,
  componentName: string,
): T {
  const markable = component as MarkableComponent;
  markable.displayName = componentName;
  markable[markerName] = true;
  return component;
}

export function matchesMarkedComponentType(
  type: unknown,
  reference: unknown,
  markerName: string,
  componentName: string,
): boolean {
  if (type === reference) {
    return true;
  }

  if ((typeof type !== 'function' && typeof type !== 'object') || !type) {
    return false;
  }

  const candidate = type as MarkableComponent;
  if (
    candidate[markerName] === true ||
    candidate.displayName === componentName ||
    candidate.name === componentName
  ) {
    return true;
  }

  if (
    candidate.type &&
    matchesMarkedComponentType(
      candidate.type,
      reference,
      markerName,
      componentName,
    )
  ) {
    return true;
  }

  if (
    candidate.render &&
    matchesMarkedComponentType(
      candidate.render,
      reference,
      markerName,
      componentName,
    )
  ) {
    return true;
  }

  return false;
}
