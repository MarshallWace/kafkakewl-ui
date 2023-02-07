<template>
  <div class="row">
    <DeployedTopologyDeploymentActionItemTooltip v-if="actionResult" :actionResults="[actionResult]" />
    <div :class="'deployment-action-side row flex-center ' + sideClass">
      <q-icon :name="icon" :color="color" size="16px" class="col-auto" />
    </div>
    <div :class="'col row justify-start content-center ' + mainClass">
      <span class="q-ml-xs deployment-action-text">{{ action.action }}</span>
    </div>
    <div :class="'col-auto row flex-center ' + mainClass">
      <div>
        <div class="row justify-end">
          <span class="q-ml-xs deployment-action-text-safety q-pr-sm">{{ safety }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="stylus">
@import '~variables'

.deployment-action-side {
  width: 48px;
  height: 24px;
  background: transparent;
}

.deployment-action-text {
  color: $deployment-action-text;
  font-size: 14px;
}
.deployment-action-text-safety {
  color: $deployment-action-text-safety;
  font-size: 10px;
}

.text-deployment-action-success-icon { color: $card-success-icon; }
.text-deployment-action-warning-icon { color: $card-warning-icon; }
.text-deployment-action-error-icon { color: $card-error-icon; }

</style>

<script>
import _ from "lodash";
import { deploymentAction } from "../utils/DeployedTopologyUtils.js"
import DeployedTopologyDeploymentActionItemTooltip from "../components/DeployedTopologyDeploymentActionItemTooltip.vue"

// 

export default {
  name: "DeployedTopologyDeploymentActionItem",
  components: { DeployedTopologyDeploymentActionItemTooltip },
  props: {
    action: Object,
  },
  computed: {
    actionDetails() {
      if (deploymentAction.hasAllowedExecutionSucceeded(this.action)) {
        return { 
          icon: "check_circle", 
          color: "deployment-action-success-icon",
          sideClass: "bg-deployment-success-side"
        };
      } else if (deploymentAction.hasExecutionFailed(this.action)) {
        return { 
          icon: "warning", 
          color: "deployment-action-error-icon", 
          sideClass: "bg-deployment-error-side",
          actionResult: { action: deploymentAction.executedAction(this.action), result: _.truncate(deploymentAction.executedActionResult(this.action), { length: 500 }) } 
        };
      } else if (deploymentAction.isNotFullyAllowed(this.action)) {
        return {
          icon: "warning",
          color: "deployment-action-warning-icon",
          sideClass: "bg-deployment-warning-side",
          actionResult: deploymentAction.isUnsafeAndPartiallyAllowed(this.action)
            // displaying tooltip only if it was partially allowed (there was a successful execution)
            ? { action: deploymentAction.executedAction(this.action) } 
            // if it wasn't allowed at all, no tooltip
            : undefined
        };
      }
      console.error("DeployedTopologyDeploymentActionItem: invalid action: ", this.action);
      return {};
    },
    icon() {
      return this.actionDetails.icon;
    },
    color() {
      return this.actionDetails.color;
    },
    sideClass() {
      return this.actionDetails.sideClass;
    },
    mainClass() {
      return this.actionDetails.mainClass;
    },
    actionResult() {
      return this.actionDetails.actionResult;
    },
    safety() {
      if (deploymentAction.isSafe(this.action)) return "safe";
      if (deploymentAction.isUnsafeButAllowed(this.action)) return "unsafe-allowed";
      if (deploymentAction.isUnsafeAndNotAllowed(this.action)) return "unsafe-not-allowed";
      if (deploymentAction.isUnsafeAndPartiallyAllowed(this.action)) return "unsafe-partially-allowed";
    }
  }
};
</script>
