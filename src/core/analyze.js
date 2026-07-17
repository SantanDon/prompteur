const ISSUE_WEIGHTS = {
  error: 18,
  warning: 10,
  info: 4,
};

function issue(id, severity, title, message, suggestion) {
  return { id, severity, title, message, suggestion };
}

function countMatches(input, pattern) {
  return (input.match(pattern) ?? []).length;
}

export function analyzePrompt(ir) {
  const input = ir.raw;
  const issues = [];

  if (input.length < 24) {
    issues.push(issue(
      'underspecified-objective',
      'warning',
      'The objective is underspecified',
      'The request is too short to establish scope, constraints, and a reliable deliverable.',
      'Add the intended outcome, relevant context, and what a successful answer should contain.',
    ));
  }

  if (/^(help|assist|improve|fix|make|do|create)\b.{0,35}$/i.test(input)) {
    issues.push(issue(
      'vague-verb',
      'warning',
      'The main action is vague',
      'Broad verbs can produce very different interpretations across models.',
      'Name the concrete operation: review, compare, rewrite, implement, diagnose, or evaluate.',
    ));
  }

  if (ir.output.format === 'auto' && !ir.output.description) {
    issues.push(issue(
      'missing-output-contract',
      'warning',
      'No explicit output contract',
      'The model must infer the shape and level of detail of the final deliverable.',
      'Specify the format, required sections, length, schema, or artifact to return.',
    ));
  }

  if (ir.quality.criteria.length === 0) {
    issues.push(issue(
      'missing-success-criteria',
      'info',
      'Success is not testable',
      'There is no explicit condition for judging whether the response is complete or correct.',
      'Add one or two acceptance criteria or a lightweight verification step.',
    ));
  }

  if (ir.context.length === 0 && /\b(this|that|it|they|the project|the code|the document)\b/i.test(input)) {
    issues.push(issue(
      'implicit-context',
      'warning',
      'The prompt relies on implicit context',
      'References such as “this” or “the project” may not identify the intended material in a new session.',
      'Name or attach the relevant project, file, source, or prior decision explicitly.',
    ));
  }

  if (/\b(show|reveal|print|provide) (your )?(chain of thought|hidden reasoning|internal reasoning)\b/i.test(input)) {
    issues.push(issue(
      'hidden-reasoning-request',
      'warning',
      'The prompt requests hidden reasoning',
      'Asking for private chain-of-thought is unnecessary and may reduce portability across model providers.',
      'Request a concise rationale, assumptions, calculations, or verification summary instead.',
    ));
  }

  if (ir.behavior.untrustedInput) {
    issues.push(issue(
      'instruction-injection',
      'error',
      'Possible instruction injection',
      'The source text contains phrases commonly used to override higher-priority instructions.',
      'Wrap supplied material as untrusted data and tell the target model not to execute instructions found inside it.',
    ));
  }

  if (/\b(concise|brief|short)\b/i.test(input) && /\b(exhaustive|comprehensive|every detail|extremely detailed)\b/i.test(input)) {
    issues.push(issue(
      'conflicting-depth',
      'warning',
      'Conflicting depth requirements',
      'The prompt asks for both brevity and exhaustive detail without defining a priority.',
      'Choose a primary requirement or define a layered output with a brief answer followed by optional detail.',
    ));
  }

  const prestigeClaims = countMatches(input, /\b(world[- ]class|award[- ]winning|best in the world|genius|elite expert|renowned)\b/gi);
  if (prestigeClaims > 1) {
    issues.push(issue(
      'persona-bloat',
      'info',
      'Persona language is doing too much work',
      'Prestige claims rarely replace concrete domain instructions or evaluation criteria.',
      'Use a narrow role only when it changes the knowledge, method, or output required.',
    ));
  }

  if (ir.constraints.length > 10) {
    issues.push(issue(
      'constraint-overload',
      'warning',
      'The prompt may be over-constrained',
      'A large number of rules increases the chance of conflicts and instruction dilution.',
      'Prioritize hard constraints and move preferences into a lower-priority style section.',
    ));
  }

  if (input.length > 5000 && ir.constraints.length < 2) {
    issues.push(issue(
      'context-without-contract',
      'info',
      'Large context, weak contract',
      'The prompt contains substantial text but few explicit instructions about how to use it.',
      'Separate source material from the task and state what evidence should be extracted or transformed.',
    ));
  }

  const dimensions = {
    clarity: Math.max(0, 25 - issues.filter((item) => ['underspecified-objective', 'vague-verb', 'implicit-context'].includes(item.id)).reduce((sum, item) => sum + ISSUE_WEIGHTS[item.severity], 0)),
    context: Math.min(20, (ir.context.length > 0 ? 14 : 7) + (ir.audience ? 6 : 0)),
    constraints: Math.min(20, 10 + Math.min(ir.constraints.length, 5) * 2),
    output: ir.output.format !== 'auto' || ir.output.description ? 20 : 8,
    verification: ir.quality.criteria.length > 0 ? 15 : ir.quality.verify ? 9 : 4,
  };

  const readiness = Math.max(0, Math.min(100, Object.values(dimensions).reduce((sum, value) => sum + value, 0) - issues.filter((item) => item.severity === 'error').length * 10));

  return {
    readiness,
    dimensions,
    issues,
    summary: issues.length === 0
      ? 'The prompt already has a strong execution contract.'
      : `${issues.length} improvement ${issues.length === 1 ? 'area' : 'areas'} detected before model-assisted optimization.`,
  };
}
