const FORMAT_PATTERNS = [
  ['json', /\b(json|json schema|structured output)\b/i],
  ['code', /\b(code|script|implementation|component|function|api|program)\b/i],
  ['table', /\b(table|matrix|comparison grid)\b/i],
  ['markdown', /\b(markdown|headings?|bullet points?)\b/i],
  ['image', /\b(image prompt|generate an image|illustration|render|photograph|poster|logo)\b/i],
  ['prose', /\b(essay|paragraph|article|report|letter|email|story|speech)\b/i],
];

const TASK_PATTERNS = [
  ['software', /\b(code|debug|repository|repo|api|typescript|javascript|python|react|next\.js|node\.js|database|sql)\b/i],
  ['research', /\b(research|sources?|citations?|evidence|compare studies|literature|latest|current)\b/i],
  ['image', /\b(image|illustration|render|photo|logo|poster|thumbnail|visual)\b/i],
  ['creative', /\b(story|poem|script|novel|scene|character|creative|caption)\b/i],
  ['security', /\b(security|vulnerability|bug bounty|threat model|exploit|malware|pentest)\b/i],
];

const CONSTRAINT_PATTERN = /\b(must|must not|do not|don't|only|never|without|avoid|under|maximum|minimum|at least|no more than|required|strictly)\b/i;
const SUCCESS_PATTERN = /\b(success|done when|acceptance criteria|should pass|verify|validated?|working|correct|accurate|complete)\b/i;
const CONTEXT_PATTERN = /\b(context|background|given|existing|current|source material|repository|audience|environment|platform|jurisdiction)\b/i;

export function normalizeText(value) {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function splitStatements(value) {
  return normalizeText(value)
    .split(/\n+|(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((statement) => statement.trim().replace(/^[-*]\s*/, ''))
    .filter(Boolean);
}

export function uniqueStrings(values) {
  const seen = new Set();
  return values.filter((value) => {
    const key = value.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function inferOutputFormat(input, requested = 'auto') {
  if (requested && requested !== 'auto') return requested;
  const match = FORMAT_PATTERNS.find(([, pattern]) => pattern.test(input));
  return match?.[0] ?? 'auto';
}

export function inferTaskType(input, target = 'general') {
  if (target === 'image') return 'image';
  if (target === 'research') return 'research';
  if (target === 'agent') return 'software';
  const match = TASK_PATTERNS.find(([, pattern]) => pattern.test(input));
  return match?.[0] ?? 'general';
}

export function extractConstraints(input) {
  return uniqueStrings(splitStatements(input).filter((statement) => CONSTRAINT_PATTERN.test(statement)));
}

export function buildPromptIR(input, options = {}) {
  const raw = normalizeText(input);
  const statements = splitStatements(raw);
  const constraints = extractConstraints(raw);
  const outputFormat = inferOutputFormat(raw, options.outputFormat);
  const taskType = inferTaskType(raw, options.target);

  return {
    version: '1.0',
    raw,
    objective: statements[0] ?? raw,
    context: CONTEXT_PATTERN.test(raw) ? statements.filter((item) => CONTEXT_PATTERN.test(item)) : [],
    inputs: [],
    constraints,
    audience: options.audience?.trim() || '',
    output: {
      format: outputFormat,
      description: options.deliverable?.trim() || '',
    },
    quality: {
      criteria: SUCCESS_PATTERN.test(raw) ? statements.filter((item) => SUCCESS_PATTERN.test(item)) : [],
      verify: options.verify !== false,
    },
    behavior: {
      persona: options.persona ?? 'none',
      tone: options.tone ?? 'neutral',
      target: options.target ?? 'general',
      taskType,
      untrustedInput: /ignore (all|any|the) previous|system prompt|developer message|jailbreak/i.test(raw),
    },
    metadata: {
      createdAt: new Date().toISOString(),
      sourceLength: raw.length,
    },
  };
}
