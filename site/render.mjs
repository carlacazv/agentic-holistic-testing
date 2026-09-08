function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function externalLink(url, label, className = "text-link") {
  return `<a class="${className}" href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}<span aria-hidden="true">↗</span></a>`;
}

function renderMetrics(metrics) {
  return metrics
    .map(
      (metric) => `
        <article class="metric-card reveal">
          <p class="metric-value">${escapeHtml(metric.value)}</p>
          <h3>${escapeHtml(metric.label)}</h3>
          <p>${escapeHtml(metric.detail)}</p>
        </article>`,
    )
    .join("");
}

function renderRunMatrix(execution) {
  const headers = Array.from(
    { length: execution.repetitions },
    (_, index) => `<span class="matrix-header">R${index + 1}</span>`,
  ).join("");

  const rows = Array.from({ length: execution.cases }, (_, caseIndex) => {
    const cells = Array.from({ length: execution.repetitions }, (_, repetitionIndex) => {
      const executionNumber = caseIndex * execution.repetitions + repetitionIndex + 1;
      const passed = executionNumber <= execution.passed;
      return `<span class="matrix-cell ${passed ? "is-pass" : "is-fail"}" aria-label="Case ${caseIndex + 1}, repetition ${repetitionIndex + 1}: ${passed ? "passed" : "failed"}"><span>${passed ? "PASS" : "FAIL"}</span></span>`;
    }).join("");

    return `<span class="matrix-row-label">C${caseIndex + 1}</span>${cells}`;
  }).join("");

  return `
    <figure class="run-matrix" aria-labelledby="run-matrix-title">
      <div class="matrix-heading">
        <div>
          <p class="mini-label">Execution matrix</p>
          <h4 id="run-matrix-title">${execution.passed} clean passes</h4>
        </div>
        <span class="zero-retry">0 retries</span>
      </div>
      <div class="matrix-grid" style="--matrix-columns: ${execution.repetitions + 1}">
        <span aria-hidden="true"></span>${headers}${rows}
      </div>
      <figcaption>${execution.cases} cases × ${execution.repetitions} repetitions · ${execution.workers} worker · deterministic seed per repetition</figcaption>
    </figure>`;
}

function renderCases(cases) {
  return cases
    .map(
      (testCase) => `
        <li class="case-item">
          <span class="case-id">${escapeHtml(testCase.id)}</span>
          <div>
            <h4>${escapeHtml(testCase.title)}</h4>
            <p>${escapeHtml(testCase.detail)}</p>
          </div>
        </li>`,
    )
    .join("");
}

function renderControls(controls) {
  return controls
    .map(
      (control) => `
        <li>
          <span class="check-mark" aria-hidden="true">✓</span>
          <span>${escapeHtml(control)}</span>
        </li>`,
    )
    .join("");
}

function renderLimitations(limitations) {
  return limitations
    .map(
      (limitation) => `
        <li>
          <span aria-hidden="true">—</span>
          <span>${escapeHtml(limitation)}</span>
        </li>`,
    )
    .join("");
}

function renderCheckGrid(checks) {
  return checks
    .map(
      (check) => `
        <div class="check-stat">
          <strong>${escapeHtml(check.value)}</strong>
          <span>${escapeHtml(check.label)}</span>
        </div>`,
    )
    .join("");
}

function renderBenchmarks(benchmarks) {
  return benchmarks
    .map((benchmark, index) => {
      const isFeature = index === 0;
      return `
        <article class="benchmark-card ${isFeature ? "benchmark-card--feature" : ""} reveal" id="${escapeHtml(benchmark.id)}">
          <div class="benchmark-topline">
            <p class="eyebrow">${escapeHtml(benchmark.eyebrow)}</p>
            <span class="status-pill"><span class="status-dot" aria-hidden="true"></span>${escapeHtml(benchmark.status)}</span>
          </div>
          <div class="benchmark-title-row">
            <div>
              <h3>${escapeHtml(benchmark.title)}</h3>
              ${benchmark.subject ? externalLink(benchmark.subjectUrl, benchmark.subject, "subject-link") : ""}
            </div>
            <p>${escapeHtml(benchmark.summary)}</p>
          </div>
          ${benchmark.execution ? renderRunMatrix(benchmark.execution) : `<div class="check-grid">${renderCheckGrid(benchmark.checks)}</div>`}
          ${benchmark.cases ? `<ol class="case-list" aria-label="Benchmark cases">${renderCases(benchmark.cases)}</ol>` : ""}
          <div class="benchmark-detail-grid">
            <div>
              <p class="mini-label">Controls</p>
              <ul class="control-list">${renderControls(benchmark.controls)}</ul>
            </div>
            ${benchmark.limitations ? `<div class="limitations"><p class="mini-label">What this does not prove</p><ul>${renderLimitations(benchmark.limitations)}</ul></div>` : `<div class="evidence-note"><p class="mini-label">Evidence chain</p><p>Every green result is tied to executable source, exact commands, machine-readable runner output, and checksums.</p></div>`}
          </div>
          <div class="benchmark-links">
            ${externalLink(benchmark.evidenceUrl, "Read the implementation PR")}
            ${externalLink(benchmark.runUrl, "Inspect the passing run")}
          </div>
        </article>`;
    })
    .join("");
}

function renderOperatingModel(steps) {
  return steps
    .map(
      (step) => `
        <li class="model-step reveal">
          <span class="step-number">${escapeHtml(step.number)}</span>
          <div>
            <h3>${escapeHtml(step.title)}</h3>
            <p>${escapeHtml(step.detail)}</p>
          </div>
        </li>`,
    )
    .join("");
}

function renderInvariants(invariants) {
  return invariants
    .map(
      (invariant, index) => `
        <li>
          <span>${String(index + 1).padStart(2, "0")}</span>
          <strong>${escapeHtml(invariant)}</strong>
        </li>`,
    )
    .join("");
}

function renderSkills(skills) {
  return skills
    .map(
      (skill) => `
        <li class="skill-card reveal">
          <code>${escapeHtml(skill.name)}</code>
          <p>${escapeHtml(skill.role)}</p>
        </li>`,
    )
    .join("");
}

function renderHistory(history) {
  return history
    .map(
      (milestone, index) => `
        <article class="history-entry reveal">
          <div class="history-marker" aria-hidden="true"><span>${String(index + 1).padStart(2, "0")}</span></div>
          <div class="history-content">
            <div class="history-meta">
              <time>${escapeHtml(milestone.date)}</time>
              <span>PR ${milestone.pullRequests.map((number) => `#${number}`).join(" · ")}</span>
            </div>
            <h3>${escapeHtml(milestone.title)}</h3>
            <p>${escapeHtml(milestone.summary)}</p>
            <div class="history-outcome">
              <strong>${escapeHtml(milestone.outcome)}</strong>
              ${externalLink(milestone.evidenceUrl, "Evidence")}
            </div>
          </div>
        </article>`,
    )
    .join("");
}

function renderRoadmap(roadmap) {
  return roadmap
    .map(
      (item, index) => `
        <article class="roadmap-item reveal">
          <div class="roadmap-index">${String(index + 1).padStart(2, "0")}</div>
          <div>
            <p class="mini-label">${escapeHtml(item.horizon)}</p>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.detail)}</p>
          </div>
        </article>`,
    )
    .join("");
}

export function renderSite(data) {
  const installCommand = "npx github:carlacazv/agentic-holistic-testing install codex";
  const title = "Holistic QA · Benchmarks and project history";
  const description =
    "Auditable benchmarks, architecture, evolution, and roadmap for the Holistic QA agent.";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="theme-color" content="#071018">
    <link rel="canonical" href="${escapeHtml(data.repository.pagesUrl)}">
    <link rel="stylesheet" href="assets/site.css">
    <title>${escapeHtml(title)}</title>
  </head>
  <body>
    <a class="skip-link" href="#main-content">Skip to content</a>
    <header class="site-header">
      <div class="header-inner">
        <a class="brand" href="#overview" aria-label="Holistic QA home">
          <span class="brand-mark" aria-hidden="true">HQ</span>
          <span>Holistic QA</span>
        </a>
        <nav class="primary-nav" aria-label="Primary navigation">
          <a href="#benchmarks">Benchmarks</a>
          <a href="#architecture">Architecture</a>
          <a href="#history">History</a>
          <a href="#roadmap">Roadmap</a>
        </nav>
        ${externalLink(data.repository.url, "GitHub", "header-link")}
      </div>
    </header>

    <main id="main-content">
      <section class="hero section-shell" id="overview" aria-labelledby="hero-title">
        <div class="hero-copy reveal">
          <p class="eyebrow">Evidence ledger · ${escapeHtml(data.snapshot.label)}</p>
          <h1 id="hero-title">${escapeHtml(data.headline)}</h1>
          <p class="hero-intro">${escapeHtml(data.introduction)}</p>
          <div class="hero-actions">
            <a class="button button--primary" href="#benchmarks">Explore the evidence</a>
            ${externalLink(data.repository.url, "View the source", "button button--secondary")}
          </div>
        </div>

        <aside class="baseline-card reveal" aria-label="Verified architecture baseline">
          <div class="baseline-heading">
            <div>
              <p class="mini-label">Architecture baseline</p>
              <h2>${escapeHtml(data.snapshot.commit)}</h2>
            </div>
            <span class="status-pill"><span class="status-dot" aria-hidden="true"></span>Verified</span>
          </div>
          <dl class="baseline-list">
            <div><dt>Quality contract</dt><dd>Passed</dd></div>
            <div><dt>Planning Poker</dt><dd>12 / 12</dd></div>
            <div><dt>Accepted retries</dt><dd>0</dd></div>
            <div><dt>Snapshot date</dt><dd>${escapeHtml(data.snapshot.date)}</dd></div>
          </dl>
          ${externalLink(data.snapshot.commitUrl, "Inspect baseline commit")}
        </aside>
      </section>

      <section class="metric-strip section-shell" aria-label="Project metrics">
        ${renderMetrics(data.metrics)}
      </section>

      <section class="section-shell section-block" id="benchmarks" aria-labelledby="benchmarks-title">
        <div class="section-heading reveal">
          <div>
            <p class="eyebrow">Measured confidence</p>
            <h2 id="benchmarks-title">Benchmarks with boundaries</h2>
          </div>
          <p>A benchmark is useful only when it states what ran, what passed, and what remains unproven.</p>
        </div>
        <div class="benchmark-stack">
          ${renderBenchmarks(data.benchmarks)}
        </div>
      </section>

      <section class="architecture-band" id="architecture" aria-labelledby="architecture-title">
        <div class="section-shell section-block">
          <div class="section-heading reveal">
            <div>
              <p class="eyebrow">Operating model</p>
              <h2 id="architecture-title">From intent to evidence</h2>
            </div>
            <p>The agent chooses the smallest useful quality action, then deterministic runtime checks decide whether its output is trustworthy.</p>
          </div>

          <ol class="operating-model">
            ${renderOperatingModel(data.operatingModel)}
          </ol>

          <div class="architecture-grid">
            <article class="invariant-panel reveal">
              <p class="eyebrow">Non-negotiable invariants</p>
              <h3>What stays true across every provider</h3>
              <ol>${renderInvariants(data.invariants)}</ol>
            </article>
            <article class="install-panel reveal">
              <p class="eyebrow">Use the baseline</p>
              <h3>Install one skill or the complete set.</h3>
              <p>Codex and Claude Code share the same provider-neutral contracts. Calling one skill never starts the full cycle.</p>
              <div class="command-box">
                <code>${escapeHtml(installCommand)}</code>
                <button type="button" data-copy="${escapeHtml(installCommand)}" aria-label="Copy install command">Copy</button>
              </div>
              <p class="copy-status" role="status" aria-live="polite"></p>
            </article>
          </div>

          <div class="skills-heading reveal">
            <p class="mini-label">Current capability surface</p>
            <h3>Nine independently callable skills</h3>
          </div>
          <ul class="skills-grid">${renderSkills(data.skills)}</ul>
        </div>
      </section>

      <section class="section-shell section-block" id="history" aria-labelledby="history-title">
        <div class="section-heading reveal">
          <div>
            <p class="eyebrow">Project evolution</p>
            <h2 id="history-title">The path from prompts to policy</h2>
          </div>
          <p>Each milestone records the problem discovered, the control added, and a direct link to its implementation evidence.</p>
        </div>
        <div class="history-list">${renderHistory(data.history)}</div>
      </section>

      <section class="roadmap-band" id="roadmap" aria-labelledby="roadmap-title">
        <div class="section-shell section-block">
          <div class="section-heading reveal">
            <div>
              <p class="eyebrow">Next evidence</p>
              <h2 id="roadmap-title">What the baseline still has to earn</h2>
            </div>
            <p>The next phase measures the quality of the agent's decisions, not only whether a curated automation suite passes.</p>
          </div>
          <div class="roadmap-list">${renderRoadmap(data.roadmap)}</div>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="section-shell footer-inner">
        <div>
          <span class="brand-mark" aria-hidden="true">HQ</span>
          <p>Holistic QA · Evidence before confidence.</p>
        </div>
        <div class="footer-links">
          <a class="text-link" href="data/project.json">Machine-readable snapshot<span aria-hidden="true">↓</span></a>
          ${externalLink(data.snapshot.qualityRunUrl, "Quality run")}
          ${externalLink(data.snapshot.benchmarkRunUrl, "Benchmark run")}
          ${externalLink(data.repository.url, "Source")}
        </div>
        <p class="footer-meta">Baseline ${escapeHtml(data.snapshot.commit)} · <span data-current-year>2026</span></p>
      </div>
    </footer>
    <script src="assets/site.js" defer></script>
  </body>
</html>
`;
}
