const repositoryUrl = "https://github.com/carlacazv/agentic-holistic-testing";

export default Object.freeze({
  repository: {
    name: "agentic-holistic-testing",
    url: repositoryUrl,
    pagesUrl: "https://carlacazv.github.io/agentic-holistic-testing/",
  },
  snapshot: {
    label: "Architecture baseline",
    date: "08 September 2026",
    commit: "20fd7aa",
    commitUrl: `${repositoryUrl}/commit/20fd7aa575b4c09704f6e700a981a39f03573250`,
    qualityRunUrl: `${repositoryUrl}/actions/runs/34173025202`,
    benchmarkRunUrl: `${repositoryUrl}/actions/runs/34173025198`,
  },
  headline: "Quality decisions you can audit.",
  introduction:
    "Holistic QA is a provider-neutral quality process that helps any contributor work with senior-QA discipline. It turns intent, risk, automation, and evidence into executable contracts instead of relying on prompt memory.",
  metrics: [
    {
      value: "9",
      label: "independent skills",
      detail: "Use one skill or coordinate the complete cycle.",
    },
    {
      value: "14",
      label: "versioned schemas",
      detail: "Machine-readable contracts reject incomplete artifacts.",
    },
    {
      value: "85",
      label: "Node contract tests",
      detail: "Deterministic checks cover behavior, safety, and drift.",
    },
    {
      value: "12/12",
      label: "browser executions",
      detail: "Planning Poker passed three repetitions with zero retries.",
    },
  ],
  benchmarks: [
    {
      id: "planning-poker",
      eyebrow: "Consumer benchmark · real application",
      title: "Planning Poker",
      subject: "ljeronimodarocha/planer-poker",
      subjectUrl: "https://github.com/ljeronimodarocha/planer-poker",
      status: "Passed",
      summary:
        "The reference Playwright architecture is applied to an external repository and executed against a real multi-user workflow. The benchmark tests behavior and the maintainability contract together.",
      execution: {
        cases: 4,
        repetitions: 3,
        passed: 12,
        retries: 0,
        workers: 1,
      },
      cases: [
        {
          id: "TC-JOURNEY",
          title: "Distributed estimation journey",
          detail:
            "Independent host and participant contexts prove vote privacy, real-time convergence, saved consensus, and authenticated CSV export.",
        },
        {
          id: "TC-PASS-5",
          title: "Below minimum boundary",
          detail: "A five-character room password remains rejected.",
        },
        {
          id: "TC-PASS-6",
          title: "Exact minimum boundary",
          detail: "A six-character room password creates a room.",
        },
        {
          id: "TC-PASS-7",
          title: "Above minimum boundary",
          detail: "A seven-character room password creates a room.",
        },
      ],
      controls: [
        "Strict TypeScript validation before execution",
        "Fixture-owned page objects, contexts, and teardown",
        "Semantic locators with no XPath, positional selectors, or hard waits",
        "HTML, JSON, JUnit, trace, screenshot, and video evidence",
      ],
      limitations: [
        "The harness is prewritten; this baseline does not yet score agent discovery or code generation.",
        "The subject checkout follows its default branch rather than a pinned commit.",
        "One worker proves deterministic repetition, not concurrency isolation.",
        "Host transfer, reconnection, accessibility, and performance are outside this benchmark.",
      ],
      evidenceUrl: `${repositoryUrl}/pull/8`,
      runUrl: `${repositoryUrl}/actions/runs/34173025198`,
    },
    {
      id: "quality-contract",
      eyebrow: "Repository benchmark · every governed change",
      title: "Quality contract",
      status: "Passed",
      summary:
        "The repository validates its own runtime, schemas, provider adapters, installable skills, local browser fixture, performance fixture, specifications, and contamination boundaries as one release gate.",
      checks: [
        { value: "85", label: "Node tests" },
        { value: "9/9", label: "fixture runs" },
        { value: "1.00", label: "Lighthouse score" },
        { value: "10", label: "API samples" },
        { value: "2", label: "provider adapters" },
        { value: "14", label: "schemas" },
      ],
      controls: [
        "Schema and semantic validation",
        "Three zero-retry Playwright repetitions",
        "Lighthouse and API baseline fixture",
        "Codex and Claude adapter checksum validation",
        "Strict OpenSpec and contamination scans",
      ],
      evidenceUrl: `${repositoryUrl}/pull/9`,
      runUrl: `${repositoryUrl}/actions/runs/34173025202`,
    },
  ],
  operatingModel: [
    {
      number: "01",
      title: "Frame intent",
      detail: "Turn the user's goal into explicit scope, constraints, and authorization.",
    },
    {
      number: "02",
      title: "Model risk",
      detail: "Link requirements and risks to testable outcomes or a reasoned disposition.",
    },
    {
      number: "03",
      title: "Choose evidence",
      detail: "Select the lowest effective test level and preserve human approval boundaries.",
    },
    {
      number: "04",
      title: "Execute safely",
      detail: "Use permission-gated tools, deterministic data, and isolated lifecycle ownership.",
    },
    {
      number: "05",
      title: "Validate claims",
      detail: "Bind results to source and runner evidence; reject partial, stale, or tampered output.",
    },
    {
      number: "06",
      title: "Decide explicitly",
      detail: "Separate workflow completion, product outcome, and release recommendation.",
    },
  ],
  invariants: [
    "Evidence before confidence",
    "Independent skills before forced orchestration",
    "Deterministic validation before model self-assessment",
    "Least privilege before autonomous action",
    "Visible gaps before false completeness",
    "Provider-neutral core before adapter-specific behavior",
  ],
  skills: [
    { name: "plan", role: "Risk-scored, technique-driven coverage" },
    { name: "review-plan", role: "Evidence-preserving challenge and correction" },
    { name: "automation-strategy", role: "Lowest effective test-level decision" },
    { name: "implement-playwright", role: "Layered, AST-validated automation" },
    { name: "explore", role: "Chartered exploratory investigation" },
    { name: "accessibility", role: "Automated and manual WCAG 2.2 AA audit" },
    { name: "performance", role: "Budget comparison or honest baseline" },
    { name: "report", role: "Evidence-linked readiness recommendation" },
    { name: "cycle", role: "Optional minimum-useful-work coordinator" },
  ],
  history: [
    {
      date: "29 Aug 2026",
      title: "Independent quality capabilities",
      summary:
        "Exploratory, accessibility, and performance work became separately callable skills instead of one mandatory sequence.",
      pullRequests: [1, 2, 3],
      evidenceUrl: `${repositoryUrl}/pull/1`,
      outcome: "Three independent audit paths",
    },
    {
      date: "06 Sep 2026",
      title: "Evidence becomes a contract",
      summary:
        "Empty plans, evidence-free claims, incomplete runs, and hand-authored Playwright verification could no longer present themselves as complete. Report and optional cycle coordination were added.",
      pullRequests: [4],
      evidenceUrl: `${repositoryUrl}/pull/4`,
      outcome: "73 tests · 14 schemas · 9 fixture runs",
    },
    {
      date: "07 Sep 2026",
      title: "The cycle becomes operational",
      summary:
        "Doctor diagnostics, atomic start/resume/complete commands, and Playwright JSON evidence closed the gap between workflow guidance and durable execution.",
      pullRequests: [5],
      evidenceUrl: `${repositoryUrl}/pull/5`,
      outcome: "Restartable cycle with runner-bound evidence",
    },
    {
      date: "07 Sep 2026",
      title: "One source of truth per stage",
      summary:
        "The durable surface was reduced from 34 artifacts to 14 canonical JSON and Markdown artifacts, removing conflicting copies and derived-state drift.",
      pullRequests: [6],
      evidenceUrl: `${repositoryUrl}/pull/6`,
      outcome: "34 → 14 durable artifacts",
    },
    {
      date: "07 Sep 2026",
      title: "Completion must prove its evidence",
      summary:
        "Cycle completion began rejecting missing, malformed, checksum-invalid, and wrong-skill runs before mutating persisted state.",
      pullRequests: [7],
      evidenceUrl: `${repositoryUrl}/pull/7`,
      outcome: "Invalid evidence cannot advance the cycle",
    },
    {
      date: "07 Sep 2026",
      title: "A real consumer becomes the benchmark",
      summary:
        "Planning Poker replaced synthetic confidence with a real external application, multi-user browser contexts, strict cleanup, boundaries, and repeatable evidence.",
      pullRequests: [8],
      evidenceUrl: `${repositoryUrl}/pull/8`,
      outcome: "4 cases × 3 repetitions · zero retries",
    },
    {
      date: "08 Sep 2026",
      title: "Architecture becomes executable policy",
      summary:
        "The agentic Playwright pattern moved from prose into a versioned profile, JSON Schema, AST validator, negative regressions, golden fixture, and required external gate.",
      pullRequests: [9],
      evidenceUrl: `${repositoryUrl}/pull/9`,
      outcome: "85 tests · two green merge gates",
    },
  ],
  roadmap: [
    {
      horizon: "Next benchmark",
      title: "Score the agent, not only its suite",
      detail:
        "Start from requirements and repository context, then measure discovery, plan quality, automation generation, execution, and release reasoning end to end.",
    },
    {
      horizon: "Reproducibility",
      title: "Pin subjects and publish run manifests",
      detail:
        "Bind each benchmark to an exact subject commit, toolchain, environment, generated artifacts, and machine-readable result.",
    },
    {
      horizon: "Quality of judgment",
      title: "Add seeded failures and oracle scoring",
      detail:
        "Measure whether the agent finds meaningful defects, avoids false positives, reports uncertainty, and makes the correct release recommendation.",
    },
    {
      horizon: "Durable autonomy",
      title: "Resume safely across interruptions",
      detail:
        "Add stage-level checkpoints, quotas, timeouts, idempotent writes, scoped evidence invalidation, and recovery tests.",
    },
    {
      horizon: "Benchmark portfolio",
      title: "Expand beyond one web journey",
      detail:
        "Introduce representative API, accessibility, performance, and cross-repository scenarios without turning coverage count into the goal.",
    },
  ],
});
