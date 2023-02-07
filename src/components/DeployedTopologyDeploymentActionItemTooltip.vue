<template>
  <q-tooltip :delay="1000">
    <q-list no-border multiline dense>
      <q-item v-for="actionResult in actionResults" :key="actionResult.action">
        <small>
          <q-item-main :label="actionResult.action" label-lines="3">
            <q-item-tile v-if="actionResult.result" text-color="black"><span class="text-italic">{{actionResult.result}}</span></q-item-tile>
          </q-item-main>
        </small>
      </q-item>
    </q-list>
  </q-tooltip>
</template>

<style>
</style>

<script>

export default {
  name: "DeployedTopologyDeploymentActionItemTooltip",
  props: {
    actionResults: Array,
  }
};
</script>
