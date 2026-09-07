export const CYCLE_SKILLS = Object.freeze([
  "plan", "review-plan", "automation-strategy", "implement-playwright",
  "explore", "accessibility", "performance", "report",
]);

const prerequisites = Object.freeze({
  "review-plan": ["plan"],
  "automation-strategy": ["review-plan"],
  "implement-playwright": ["automation-strategy"],
});

export function createCycleState({ goal, selectedSkills = CYCLE_SKILLS, explicitSkill = null }) {
  if (typeof goal !== "string" || goal.trim().length === 0) throw new TypeError("Cycle goal is required");
  const selection = explicitSkill === null ? selectedSkills : [explicitSkill];
  if (!Array.isArray(selection) || selection.length === 0 || selection.some((skill) => !CYCLE_SKILLS.includes(skill))) {
    throw new TypeError("Cycle selected skills must be known and non-empty");
  }
  return {
    schema_version: 1,
    goal: goal.trim(),
    invocation: explicitSkill === null ? "orchestrated" : "explicit-skill",
    selected_skills: [...new Set(selection)],
    completed_skills: [],
    run_ids: [],
    open_questions: [],
    status: "active",
  };
}

export function validateCycleState(state) {
  const errors = [];
  if (state?.schema_version !== 1) errors.push("/schema_version: expected 1");
  if (typeof state?.goal !== "string" || state.goal.length === 0) errors.push("/goal: required");
  if (!["orchestrated", "explicit-skill"].includes(state?.invocation)) errors.push("/invocation: unknown mode");
  if (!Array.isArray(state?.selected_skills) || state.selected_skills.length === 0) errors.push("/selected_skills: required");
  for (const skill of state?.selected_skills ?? []) if (!CYCLE_SKILLS.includes(skill)) errors.push(`/selected_skills: unknown ${skill}`);
  if (state?.invocation === "explicit-skill" && state.selected_skills?.length !== 1) errors.push("/selected_skills: explicit invocation must stay scoped to one skill");
  if (!Array.isArray(state?.completed_skills)) errors.push("/completed_skills: expected array");
  if (!Array.isArray(state?.run_ids)) errors.push("/run_ids: expected array");
  if (!Array.isArray(state?.open_questions)) errors.push("/open_questions: expected array");
  if (!["active", "waiting", "completed"].includes(state?.status)) errors.push("/status: unknown status");
  return { valid: errors.length === 0, errors };
}

export function nextCycleStep(state) {
  const validation = validateCycleState(state);
  if (!validation.valid) throw new TypeError(validation.errors.join("; "));
  if (state.open_questions.length > 0) return { status: "waiting", questions: state.open_questions };
  const completed = new Set(state.completed_skills);
  for (const skill of state.selected_skills) {
    if (completed.has(skill)) continue;
    const missing = (prerequisites[skill] ?? []).filter((required) => state.selected_skills.includes(required) && !completed.has(required));
    if (missing.length > 0) continue;
    return { status: "ready", skill, prerequisites: prerequisites[skill] ?? [] };
  }
  return { status: "completed", skill: null, prerequisites: [] };
}

export function completeCycleStep(state, { skill, runId }) {
  const next = nextCycleStep(state);
  if (next.status !== "ready" || next.skill !== skill) throw new TypeError(`Expected next skill ${next.skill ?? next.status}`);
  if (typeof runId !== "string" || runId.length === 0) throw new TypeError("Completed cycle step requires a run ID");
  const result = structuredClone(state);
  result.completed_skills.push(skill);
  result.run_ids.push(runId);
  result.status = result.completed_skills.length === result.selected_skills.length ? "completed" : "active";
  return result;
}

export function summarizeCycle(state) {
  const validation = validateCycleState(state);
  if (!validation.valid) throw new TypeError(validation.errors.join("; "));
  const next = nextCycleStep(state);
  return {
    goal: state.goal,
    invocation: state.invocation,
    status: state.status,
    completed: state.completed_skills.length,
    total: state.selected_skills.length,
    next_skill: next.skill ?? null,
    waiting_questions: next.status === "waiting" ? next.questions : [],
    run_ids: [...state.run_ids],
  };
}
