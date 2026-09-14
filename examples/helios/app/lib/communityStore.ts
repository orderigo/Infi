export interface CommunityIdea {
  id: string;
  text: string;
  author: string;
  votes: number;
  createdAt: string;
  promotedAt?: string;
}

const store = new Map<string, CommunityIdea>();
const keyFor = (text: string) =>
  text.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 500);

export function recordIdea(author: string, text: string) {
  const normalized = keyFor(text);
  if (!normalized) return null;
  const existing = store.get(normalized);
  if (existing) {
    existing.votes += 1;
    return existing;
  }
  const idea = {
    id: crypto.randomUUID(),
    text: text.trim().slice(0, 500),
    author: author.trim().slice(0, 32),
    votes: 1,
    createdAt: new Date().toISOString(),
  };
  store.set(normalized, idea);
  return idea;
}
export function listIdeas() {
  return [...store.values()].sort(
    (a, b) => b.votes - a.votes || b.createdAt.localeCompare(a.createdAt),
  );
}
export function getIdea(id: string) {
  return [...store.values()].find((idea) => idea.id === id);
}
export function markPromoted(id: string) {
  const idea = getIdea(id);
  if (idea) idea.promotedAt = new Date().toISOString();
  return idea;
}
