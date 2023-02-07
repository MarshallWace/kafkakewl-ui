<template>
  <div>
    <div :class="type.class">
      <div class="row">
        <div :class="'deployment-side row flex-center ' + type.color.sideClass">
          <q-icon :name="type.icon" :color="type.color.icon" size="24px" class="col-auto" />
        </div>
        <div :class="'col row justify-start content-center ' + type.color.mainClass">
          <span class="q-ml-xs">{{ deployedTopology.kafkaClusterId }}</span>
        </div>
        <div :class="'col-auto row flex-center ' + type.color.mainClass">
          <div>
            <div class="row justify-end">
              <q-chip dense dense text-color="card-title-chip-text" class="transparent q-ml-sm col-auto title-chip" icon="person">{{ deployedTopology.metadata.createdBy }}</q-chip>
              <q-chip v-if="hasVersion" dense :color="versionColor" text-color="card-title-chip-text" class="q-ml-sm col-auto title-chip">{{ version }}</q-chip>
            </div>
            <div class="row justify-end">
              <q-chip dense text-color="card-title-chip-text" class="transparent q-ml-sm col-auto title-chip" icon-right="access_time">{{ formattedTimeStampUtc }}</q-chip>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import _ from "lodash";
import { dateToPrettyString } from "../utils/Utils.js"
import { deploymentAction } from "../utils/DeployedTopologyUtils.js";

export default {
  name: "DeployedTopologyInfoCard",
  props: {
    latestTopologyVersion: Number,
    deployedTopology: Object
  },
  computed: {
    successType() {
      return { icon: "check_circle", color: { icon: "deployment-success-icon", sideClass: "bg-deployment-success-side", mainClass: "bg-deployment-success-main" }, class: "deployment deployment-success" };
    },
    warningType() {
      return { icon: "warning", color: { icon: "deployment-warning-icon", sideClass: "bg-deployment-warning-side", mainClass: "bg-deployment-warning-main" }, class: "deployment deployment-warning" };
    },
    errorType() {
        return { icon: "warning", color: { icon: "deployment-error-icon", sideClass: "bg-deployment-error-side", mainClass: "bg-deployment-error-main" },  class: "deployment deployment-error" };
    },

    deploymentActions() {
      return this.deployedTopology.kafkaClusterActions;
    },
    type() {
      if (this.deploymentActions.find(deploymentAction.hasExecutionFailed)) {
        return this.errorType;
      } else if (this.deploymentActions.find(deploymentAction.isNotFullyAllowed)) {
        return this.warningType;
      } else if (!this.deployedTopology.allActionsSuccessful) {
        return this.warningType; // this shouldn't happen, just in case
      } else {
        return this.successType;
      }
    },
    formattedTimeStampUtc() {
      return dateToPrettyString(this.deployedTopology.metadata.timeStampUtc);
    },
    hasVersion() {
      return this.deployedTopology.topologyWithVersion;
    },
    isLatestVersion() {
      return this.deployedTopology.topologyWithVersion && this.latestTopologyVersion === this.deployedTopology.topologyWithVersion.version;
    },
    version() {
      return this.isLatestVersion ? "latest" : `v${this.deployedTopology.topologyWithVersion.version}`;
    },
    versionColor() {
      return this.isLatestVersion ? "card-title-chip-latestversion-bg" : "card-title-chip-nonlatestversion-bg";
    },
    actionResults() {
      const unsafeOperations = this.deployedTopology.unsafeOperations.map(o => ({ action: o.action, result: o.result }));
      const failedOperations = this.deployedTopology.failedOperations.map(o => ({ action: o.action, result: _.truncate(o.result, { length: 500 }) }));
      return unsafeOperations.concat(failedOperations);
    },
    hasActionResults() {
      return this.actionResults.length > 0;
    }
  },
};
</script>

<style scoped lang="stylus">
@import '~variables'

.deployment-side {
  width: 48px;
  height: 48px;
  background: transparent;
  border-top-left-radius: $card-border-radius;
  border-bottom-left-radius: $card-border-radius;
}

.bg-deployment-success-side {}
.bg-deployment-success-main {}
.text-deployment-success-icon { color: $card-success-icon; }

.bg-deployment-warning-side {}
.bg-deployment-warning-main {}
.text-deployment-warning-icon { color: $card-warning-icon; }

.bg-deployment-error-side { background: $card-error-side-bg; }
.bg-deployment-error-main { background: $card-error-main-bg; }
.text-deployment-error-icon { color: $card-error-icon; }

.deployment {
  color: $card-subtitle-text;
  background: $card-deployment-bg;
  border-radius: $card-border-radius;
  height: 48px;
}

.title-chip {
  font-size: 10px;
  font-weight: 700;
}

.bg-card-title-chip-latestversion-bg {
  background: $card-chip-version-bg;
}

.bg-card-title-chip-nonlatestversion-bg {
  background: transparent;
}

.text-card-title-chip-text {
  color: $card-chip-text;
}
</style>
