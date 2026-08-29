import { validateExecutionContext } from "./validation.mjs";

function deny(code, reason, approvalNeeded = null) {
  return { allowed: false, code, reason, approval_needed: approvalNeeded };
}

export function evaluateCapability(context, capability) {
  const contextErrors = validateExecutionContext(context);
  if (contextErrors.length > 0) {
    return deny("invalid_context", contextErrors.join("; "));
  }
  if (
    capability === null ||
    typeof capability !== "object" ||
    typeof capability.name !== "string" ||
    capability.name.length === 0 ||
    typeof capability.state_changing !== "boolean"
  ) {
    return deny("invalid_capability", "Capability requires a name and state_changing boolean");
  }

  if (context.environment === "production") {
    if (!context.production_authorized) {
      return deny("production_disabled", "Production is disabled without explicit authorization", "production");
    }
    if (capability.state_changing) {
      return deny("production_mutation_denied", "State-changing production capabilities are prohibited");
    }
    if (!context.allowed_capabilities.includes(capability.name)) {
      return deny(
        "production_capability_not_authorized",
        "Production read-only capability is not separately authorized",
        capability.name,
      );
    }
    return { allowed: true, code: "authorized", reason: "Authorized production read-only capability", approval_needed: null };
  }

  if (context.mode === "autonomous" && !context.allowed_capabilities.includes(capability.name)) {
    return deny(
      "capability_not_pre_authorized",
      "Autonomous mode permits only pre-authorized capabilities",
      capability.name,
    );
  }

  if (
    context.mode === "guided" &&
    capability.state_changing &&
    !context.approvals.includes(capability.name)
  ) {
    return deny(
      "approval_required",
      "Guided state-changing capability requires recorded approval",
      capability.name,
    );
  }

  return { allowed: true, code: "authorized", reason: "Capability is authorized", approval_needed: null };
}
