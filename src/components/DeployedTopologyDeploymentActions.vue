<template>
  <div class="col">
    <DeployedTopologyDeploymentActionItem v-for="action in actions" :key="action.action" :action="action" class="row-auto" />
  </div>
</template>

<style scoped lang="stylus">
@import '~variables'

</style>

<script>
import DeployedTopologyDeploymentActionItem from "../components/DeployedTopologyDeploymentActionItem.vue";

export default {
  name: "DeployedTopologyDeploymentActions",
  components: { DeployedTopologyDeploymentActionItem },
  props: {
    actions: Array,
  }
};
</script>
