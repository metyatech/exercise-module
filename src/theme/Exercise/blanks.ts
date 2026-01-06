import { exerciseClasses as classes } from './classes.js';

const BLANK_PATTERN = /\$\{([^}]*)\}/g;

type TextNodeInfo = {
  node: Text;
  start: number;
  end: number;
};

type BlankMatch = {
  start: number;
  end: number;
  answer: string;
};

function getBlankLabel(index: number): string {
  return String(index);
}

function getBlankMatches(text: string): BlankMatch[] {
  if (!text.includes('${')) {
    return [];
  }

  BLANK_PATTERN.lastIndex = 0;
  const matches: BlankMatch[] = [];
  let match: RegExpExecArray | null;

  while ((match = BLANK_PATTERN.exec(text)) !== null) {
    const answer = match[1]?.trim() ?? '';
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      answer,
    });
  }

  return matches;
}

function collectTextNodes(root: Element): { nodes: TextNodeInfo[]; text: string } {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: TextNodeInfo[] = [];
  let text = '';

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const value = node.nodeValue ?? '';
    const start = text.length;
    const end = start + value.length;
    nodes.push({ node, start, end });
    text += value;
  }

  return { nodes, text };
}

function findNodeAtOffset(
  nodes: TextNodeInfo[],
  offset: number,
  isEnd: boolean,
): { node: Text; offset: number } | null {
  for (const info of nodes) {
    const within = isEnd ? offset <= info.end : offset < info.end;
    if (offset >= info.start && within) {
      return { node: info.node, offset: offset - info.start };
    }
  }

  return null;
}

function replacePlaceholdersInElement(
  root: Element,
  createNode: (index: number, answer: string) => Node,
): BlankMatch[] {
  const { nodes, text } = collectTextNodes(root);
  const matches = getBlankMatches(text);

  if (!matches.length) {
    return [];
  }

  const nodesForMatch = matches.map((entry, index) =>
    createNode(index + 1, entry.answer),
  );
  for (let i = matches.length - 1; i >= 0; i -= 1) {
    const { start, end } = matches[i];
    const startNode = findNodeAtOffset(nodes, start, false);
    const endNode = findNodeAtOffset(nodes, end, true);
    if (!startNode || !endNode) {
      continue;
    }

    const range = document.createRange();
    range.setStart(startNode.node, startNode.offset);
    range.setEnd(endNode.node, endNode.offset);
    range.deleteContents();
    range.insertNode(nodesForMatch[i]);
  }

  return matches;
}

function createBlankInput(index: number): HTMLElement {
  const wrap = document.createElement('span');
  wrap.className = classes.blankWrap;
  wrap.dataset.blankIndex = String(index);

  const input = document.createElement('input');
  input.type = 'text';
  input.className = classes.blankInput;
  input.dataset.blankIndex = String(index);
  input.setAttribute('aria-label', `Blank ${index}`);
  input.autocomplete = 'off';
  input.spellcheck = false;

  const badge = document.createElement('span');
  badge.className = classes.blankBadge;
  badge.textContent = getBlankLabel(index);

  wrap.appendChild(input);
  wrap.appendChild(badge);

  return wrap;
}

function createBlankTag(index: number, answer: string): Node {
  const fragment = document.createDocumentFragment();

  const tag = document.createElement('span');
  tag.className = classes.blankTag;
  tag.dataset.blankIndex = String(index);
  tag.textContent = getBlankLabel(index);
  fragment.appendChild(tag);

  if (answer) {
    fragment.appendChild(document.createTextNode(` ${answer}`));
  }

  return fragment;
}

function insertBlankAnswers(root: Element, matches: BlankMatch[]): void {
  if (!matches.length || root.querySelector('[data-blank-answers="true"]')) {
    return;
  }

  const list = document.createElement('div');
  list.className = classes.blankAnswerList;
  list.dataset.blankAnswers = 'true';

  matches.forEach((match, index) => {
    const item = document.createElement('div');
    item.className = classes.blankAnswerItem;
    item.appendChild(createBlankTag(index + 1, match.answer));
    list.appendChild(item);
  });

  root.insertBefore(list, root.firstChild);
}

function bindBlankHighlights(root: Element): void {
  const setHighlight = (index: string, state: boolean) => {
    const targets = root.querySelectorAll(`[data-blank-index="${index}"]`);
    targets.forEach((target) => {
      if (
        target.classList.contains(classes.blankWrap) ||
        target.classList.contains(classes.blankTag)
      ) {
        target.classList.toggle(classes.blankHighlight, state);
      }
    });
  };

  root.querySelectorAll(`.${classes.blankInput}`).forEach((input) => {
    const index = (input as HTMLElement).dataset.blankIndex;
    if (!index) return;
    input.addEventListener('focus', () => setHighlight(index, true));
    input.addEventListener('blur', () => setHighlight(index, false));
  });

  root.querySelectorAll(`.${classes.blankTag}`).forEach((tag) => {
    const index = (tag as HTMLElement).dataset.blankIndex;
    if (!index) return;
    tag.addEventListener('mouseenter', () => setHighlight(index, true));
    tag.addEventListener('mouseleave', () => setHighlight(index, false));
  });
}

export function applyBlankPlaceholders(root: HTMLElement): void {
  const problemRoot = root.querySelector(`.${classes.content}`);
  const problemMatches = problemRoot
    ? replacePlaceholdersInElement(problemRoot, (index) =>
        createBlankInput(index),
      )
    : [];

  const solutionRoot = root.querySelector(`.${classes.solutionContent}`);
  const solutionMatches = solutionRoot
    ? replacePlaceholdersInElement(solutionRoot, (index, answer) =>
        createBlankTag(index, answer),
      )
    : [];

  if (solutionRoot && problemMatches.length > 0 && solutionMatches.length === 0) {
    insertBlankAnswers(solutionRoot, problemMatches);
  }

  bindBlankHighlights(root);
}
