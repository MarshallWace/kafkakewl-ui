<template>
  <div>
    <DagreD3Graph 
      :fitToContent="true"
      :maxWidth="windowWidth"
      :maxHeight="windowHeight-60"
      :minZoomFactor="0.1"
      :graphAttrs="graphAttrs"
      :nodes="graph.nodes"
      :edges="graph.edges"
    />
  </div>
</template>

<script>
import _ from "lodash";
import { mapState, mapGetters } from "vuex";
import DagreD3Graph from "../components/DagreD3Graph.vue";
import { getResolvedDeployedTopologiesFor } from "../utils/ResolvedDeployedTopologyUtils.js"
import { createGraphFromResolvedTopologies } from "../utils/DagreD3Utils.js"

export default {
  name: "DeployedTopologiesGraph",
  components: { DagreD3Graph },
  props: {
    kafkaClusterId: String
  },
  data() {
    return {
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      resolvedDeployedTopologies: []
    }
  },
  mounted() {
    window.addEventListener('resize', () => {
      this.windowWidth = window.innerWidth;
      this.windowHeight = window.innerHeight;
    });

    this.updateResolvedDeployedTopologies();
  },
  methods: {
    updateResolvedDeployedTopologies() {
      getResolvedDeployedTopologiesFor(this.kafkaClusterId, this.currentTopologyFilter).then(rdts => {
        this.resolvedDeployedTopologies = rdts;
      });
    }
  },
  computed: {
    graphAttrs() {
      return {
        ranker: "network-simplex",
        rankdir: "LR",
        rankdir_dimension_threshold: 10.0,
        rankdir_if_above_threshold: "TD"
      };
    },
    graph() {
      return createGraphFromResolvedTopologies(this.resolvedDeployedTopologies);
    },
    ...mapGetters({
      currentTopologyFilter: "topologies/currentTopologyFilter"
    })
  },
  watch: {
    currentTopologyFilter: function(newTopologyFilter, oldTopologyFilter) {
      if (!_.isEqual(oldTopologyFilter, newTopologyFilter)) { 
        this.updateResolvedDeployedTopologies();
      }
    },
  }
};
</script>

<style>
</style>
