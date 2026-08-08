export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function readingTime(body: string | undefined) {
  const words = body?.trim().split(/\s+/).length ?? 0;
  return `${Math.max(1, Math.ceil(words / 220))} min read`;
}
