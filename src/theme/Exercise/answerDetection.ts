import React, { Children, type ReactElement, type ReactNode } from 'react';
import Answer, {
  ANSWER_COMPONENT_NAME,
  LEGACY_SOLUTION_MARKER,
  type AnswerProps,
} from './Answer.js';
import Hint, { HINT_COMPONENT_NAME } from './Hint.js';
import Solution, {
  SOLUTION_COMPONENT_NAME,
  type SolutionProps,
} from './Solution.js';
import { matchesMarkedComponentType } from './componentMarkers.js';

const matchesAnswerType = (type: unknown): boolean =>
  matchesMarkedComponentType(
    type,
    Answer,
    '__exerciseAnswer',
    ANSWER_COMPONENT_NAME,
  );

const matchesLegacySolutionType = (type: unknown): boolean =>
  matchesMarkedComponentType(
    type,
    Solution,
    '__exerciseSolution',
    SOLUTION_COMPONENT_NAME,
  );

const matchesHintType = (type: unknown): boolean =>
  matchesMarkedComponentType(type, Hint, '__exerciseHint', HINT_COMPONENT_NAME);

function hasLegacySolutionMarker(child: ReactNode): boolean {
  if (!React.isValidElement(child)) {
    return false;
  }
  const props = (child.props ?? {}) as Record<string, unknown>;
  return props[LEGACY_SOLUTION_MARKER] === true;
}

export const isAnswerElement = (
  child: ReactNode,
): child is ReactElement<AnswerProps> =>
  React.isValidElement(child) &&
  matchesAnswerType(child.type) &&
  !hasLegacySolutionMarker(child);

export const isLegacySolutionElement = (
  child: ReactNode,
): child is ReactElement<SolutionProps> =>
  React.isValidElement(child) &&
  (matchesLegacySolutionType(child.type) ||
    (matchesAnswerType(child.type) && hasLegacySolutionMarker(child)));

export const isHintElementLike = (child: ReactNode): boolean =>
  React.isValidElement(child) && matchesHintType(child.type);

/**
 * Component-name strings that identify structural exercise wrappers. The
 * legacy compatibility scan treats any element whose `displayName` or `name`
 * matches one of these as opaque, so we never descend into the wrapper and
 * cannot misclassify its children.
 */
const STRUCTURAL_DISPLAY_NAMES: ReadonlySet<string> = new Set([
  SOLUTION_COMPONENT_NAME,
  ANSWER_COMPONENT_NAME,
  HINT_COMPONENT_NAME,
]);

/**
 * True when `child` is a structurally transparent wrapper that real
 * MDX/SSR builds may insert between the `<Exercise>` boundary and the
 * legacy `<Solution>`. Acceptable transparents are limited to React
 * Fragments plus any element whose type is NOT an exercise structural
 * wrapper (Answer, Hint, Solution, or any element carrying the legacy
 * marker). The check deliberately refuses to descend into any wrapper
 * that carries structural meaning so we cannot swallow meaningful
 * content during the legacy compatibility scan.
 */
function isTransparentWrapper(child: ReactNode): boolean {
  if (!React.isValidElement(child)) {
    return false;
  }
  if (hasLegacySolutionMarker(child)) {
    return false;
  }
  const candidate = child as ReactElement;
  if (
    matchesLegacySolutionType(candidate.type) ||
    matchesAnswerType(candidate.type) ||
    matchesHintType(candidate.type)
  ) {
    return false;
  }
  if (candidate.type === React.Fragment) {
    return true;
  }
  const type = candidate.type as {
    displayName?: string;
    name?: string;
  };
  if (typeof type === 'object' && type !== null) {
    const displayName = type.displayName ?? type.name;
    if (displayName && STRUCTURAL_DISPLAY_NAMES.has(displayName)) {
      return false;
    }
  }
  return true;
}

export interface LegacySolutionMatch {
  /**
   * Position of the legacy Solution element within the flattened children
   * list returned by `flattenChildrenForLegacyDetection`.
   */
  index: number;
  /** The legacy Solution element that carries the answer content. */
  element: ReactElement<SolutionProps>;
}

type FlatEntry = { node: ReactNode };

/**
 * Flatten children, descending through transparent wrappers (e.g. Fragments
 * produced by MDX/SSR builds) so legacy compatibility detection can robustly
 * locate a legacy Solution anywhere inside the children tree. The flattening
 * refuses to recurse into elements that already carry the legacy marker,
 * exercise structural wrappers (Hint, Answer, Solution, GuidedTask), or any
 * element whose type is not a transparent wrapper, so misclassifying
 * meaningful content cannot happen.
 */
export function flattenChildrenForLegacyDetection(
  children: ReactNode,
): FlatEntry[] {
  const source = Children.toArray(children);
  const flat: FlatEntry[] = [];
  for (const node of source) {
    if (isTransparentWrapper(node)) {
      // Safe: isTransparentWrapper guarantees this is a valid element
      // that is not the legacy marker, not the Solution type, not the
      // Answer type, and not the Hint type. Descending cannot swallow
      // meaningful content.
      const inner = (node as ReactElement).props as {
        children?: ReactNode;
      };
      flat.push(...flattenChildrenForLegacyDetection(inner.children));
      continue;
    }
    flat.push({ node });
  }
  return flat;
}

/**
 * Locate a legacy Solution element anywhere within the children tree,
 * descending through transparent wrapper elements (MDX/SSR artifacts) until
 * either the legacy Solution is found or the search completes. Returns
 * `null` when no legacy Solution is present.
 *
 * The returned `index` is the position within the flattened children list so
 * callers can preserve the original ordering semantics (everything before is
 * problem content, the legacy element carries answer content, anything after
 * is forbidden).
 */
export function findLegacySolutionDeep(
  children: ReactNode,
): LegacySolutionMatch | null {
  const flat = flattenChildrenForLegacyDetection(children);
  for (let i = 0; i < flat.length; i += 1) {
    const entry = flat[i];
    if (!entry) continue;
    const candidate = entry.node;
    if (React.isValidElement(candidate) && isLegacySolutionElement(candidate)) {
      return {
        index: i,
        element: candidate as ReactElement<SolutionProps>,
      };
    }
  }
  return null;
}

/**
 * Return the flat children (with transparent wrappers descended through)
 * for callers that need the same flat list used by `findLegacySolutionDeep`.
 * The returned array preserves insertion order so problem/hint/answer
 * validation can continue to rely on positional checks.
 */
export function getFlatChildrenForLegacyDetection(
  children: ReactNode,
): ReactNode[] {
  return flattenChildrenForLegacyDetection(children).map((entry) => entry.node);
}
