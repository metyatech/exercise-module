type MarkableComponent = {
  $$id?: unknown;
  $$typeof?: unknown;
  displayName?: string;
  name?: string;
  render?: unknown;
  type?: unknown;
  _init?: unknown;
  _payload?: unknown;
  [key: string]: unknown;
};

const REACT_LAZY_TYPE = Symbol.for('react.lazy');
const UNMATCHED_LAZY_TYPE = Symbol('unmatched react lazy component type');

const CLIENT_REFERENCE_EXPORTS_BY_MARKER: ReadonlyMap<
  string,
  ReadonlySet<string>
> = new Map([
  ['__exerciseAnswer', new Set(['Answer'])],
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

function isMarkableComponent(type: unknown): type is MarkableComponent {
  return (typeof type === 'function' || typeof type === 'object') && !!type;
}

function isThenable(value: unknown): boolean {
  return isMarkableComponent(value) && typeof value.then === 'function';
}

function unwrapReactLazyComponentType(type: unknown): unknown {
  if (!isMarkableComponent(type) || type.$$typeof !== REACT_LAZY_TYPE) {
    return type;
  }

  if (typeof type._init !== 'function') {
    return UNMATCHED_LAZY_TYPE;
  }

  try {
    return type._init(type._payload);
  } catch (error) {
    if (isThenable(error)) {
      throw error;
    }
    return UNMATCHED_LAZY_TYPE;
  }
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
  const unwrappedType = unwrapReactLazyComponentType(type);
  if (unwrappedType === UNMATCHED_LAZY_TYPE) {
    return false;
  }
  if (unwrappedType !== type) {
    return matchesMarkedComponentType(
      unwrappedType,
      reference,
      markerName,
      componentName,
    );
  }

  if (type === reference) {
    return true;
  }

  if (!isMarkableComponent(type)) {
    return false;
  }

  const candidate = type;
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
