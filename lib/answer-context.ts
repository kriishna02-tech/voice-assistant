const common = new Set("about after again against also answer are been before being can could describe did does doing explain for from had has have how interview into its just most much our out over role should some tell than that their them there these they this those through under used using was were what when where which while will with would your you".split(" "));

function terms(value: string) {
  return new Set((value.toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g) ?? [])
    .map(word => word.replace(/(ing|ed|s)$/, ""))
    .filter(word => !common.has(word) && word.length > 2));
}

/** Keep resume evidence relevant to the question within a small prompt budget. */
export function answerContext(resume: string, question: string, job: string, limit = 6500) {
  if (resume.length <= limit) return resume;
  const pieces = resume
    .replace(/\s+[•●▪]\s+/g, "\n• ")
    .split(/\n+/)
    .flatMap(line => line.match(/.{1,480}(?:\s|$)|.{1,480}/g) ?? [])
    .map(part => part.trim())
    .filter(Boolean);
  const query = terms(question);
  const role = terms(job.slice(0, 1200));
  if (!query.size) return resume.slice(0, limit);
  const ranked = pieces.map((text, index) => {
    const words = terms(text);
    let score = 0;
    for (const word of query) if (words.has(word)) score += 3;
    for (const word of role) if (words.has(word)) score += 0.2;
    if (/\d|built|designed|implemented|led|improved|reduced/i.test(text)) score += 0.4;
    return { text, index, score };
  }).sort((a, b) => b.score - a.score || a.index - b.index);
  const chosen = new Set<number>();
  let used = 0;
  for (const item of ranked) {
    if (used + item.text.length + 1 > limit) continue;
    chosen.add(item.index); used += item.text.length + 1;
    if (used >= limit - 480) break;
  }
  return pieces.filter((_, index) => chosen.has(index)).join("\n").slice(0, limit);
}
