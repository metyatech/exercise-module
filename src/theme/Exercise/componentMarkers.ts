type MarkableComponent = {
  $$id?: unknown;
  displayName?: string;
  name?: string;
  render?: unknown;
  type?: unknown;
  [key: string]: unknown;
};

const CLIENT_REFERENCE_EXPORTS_BY_MARKER: ReadonlyMap<
  string,
  ReadonlySet<string>
> = new Map([
  ['__exerciseAnswer', new Set(['Answer', 'Solution'])],
  ['__exerciseHint', new Set(['Hint'])],
  ['__exerciseGuidedTask', new Set(['QuickCheck', 'default'])],
]);

function matchesExerciseClientReference(
  candidate: MarkableComponent,
  markerName: string,
): boolean {
  const id = candidate.$$id;
  if (typeof id !== 'string') {
    return false;
  }

  const separatorIndex = id.lastIndexOf('#');
  if (separatorIndex === -1) {
    return false;
  }

  const exportName = id.slice(separatorIndex + 1);
  const allowedExports = CLIENT_REFERENCE_EXPORTS_BY_MARKER.get(markerName);
  return allowedExports?.has(exportName) ?? false;
}

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
    matchesExerciseClientReference(candidate, markerName) ||
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
