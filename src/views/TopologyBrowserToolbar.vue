<template>
  <div class="row gutter-x-xs">
    <div class="col"><q-input v-model.lazy="filter" color="tertiary" inverted autofocus placeholder="topology filter" /></div>
  </div>
</template>

<script>
import _ from "lodash";
import { generateFlinkVisualizerJsonFor } from "../utils/FlinkUtils.js"

export default {
  name: "TopologyBrowserToolbar",
  props: {
    debounceMs: { type: Number, default: 300 },
    initialFilter: String
  },
  created() {
    this.debouncedApplyFilter = _.debounce(this.applyFilter, this.debounceMs);
  },
  mounted() {
    this.applyFilter(this.initialFilter);
  },
  computed: {
    filter: {
      get() {
        return this.$store.state.topologies.currentTopologyFilter;
      },
      set(newFilter) {
        this.debouncedApplyFilter(newFilter);
      }
    }
  },
  methods: {
    applyFilter(newFilter) {
      this.$store.commit("topologies/setCurrentTopologyFilter", newFilter);
      // TODO: this looks dodgy, are we sure this is the best way?
      const currentPath = this.$router.history.current.path
      if (newFilter && newFilter.length > 0) {
        this.$router.push({ path: currentPath, query: { filter: newFilter } });
      } else {
        this.$router.push({ path: currentPath });
      }
    }
  },
};
</script>

<style scoped lang="scss">
</style>
