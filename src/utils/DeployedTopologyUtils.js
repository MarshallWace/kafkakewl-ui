export const deploymentAction = {
    isSafe: a => a.safety.Safe,
    isUnsafeButAllowed: a => a.safety.UnsafeAllowed,
    isUnsafeAndNotAllowed: a => a.safety.UnsafeNotAllowed,
    isUnsafeAndPartiallyAllowed: a => a.safety.UnsafePartiallyAllowed,

    isAllowed: a => deploymentAction.isUnsafeButAllowed(a) || deploymentAction.isSafe(a),
    isNotFullyAllowed: a => deploymentAction.isUnsafeAndNotAllowed(a) || deploymentAction.isUnsafeAndPartiallyAllowed(a),

    hasExecutionSucceeded: a => a.execution && a.execution.success,
    hasExecutionFailed: a => a.execution && !a.execution.success,
    hasAllowedExecutionSucceeded: a => deploymentAction.isAllowed(a) && deploymentAction.hasExecutionSucceeded(a),

    executedAction: a => a.execution && a.execution.action,
    executedActionResult: a => a.execution && a.execution.result,
};
