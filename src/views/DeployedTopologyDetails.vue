<template>
  <q-page class="flex">
    <div class="row" style="width: 100%; height: 100%">
      <DagreD3Graph class="col-12 q-my-sm"
        :fitToContent="true"
        :minHeight="70"
        :maxHeight="900"
        :graphAttrs="graphAttrs"
        :graph="graph"
        @actualRankdirChanged="onActualRankdirChanged"
      />
      <DeployedTopologyInfoDetailedCard v-if="topology && deployedTopology" class="col-12"
        :latestTopologyVersion="topology.metadata.version"
        :deployedTopology="deployedTopology"/>
      <div class="col-12">
        <DeployedTopologyDeploymentActions :actions="deploymentActions" />
      </div>
    </div>
  </q-page>
</template>

<script>
import Vue from "vue";
import { mapState, mapGetters } from "vuex";
import DeployedTopologyDeploymentActions from "../components/DeployedTopologyDeploymentActions.vue";
import DeployedTopologyInfoDetailedCard from "../components/DeployedTopologyInfoDetailedCard.vue";
import { application, aggregatedConsumerGroupStatus } from "../utils/TopologyUtils.js";
import { createGraphFromResolvedTopologies } from "../utils/DagreD3Utils.js"

export default {
  name: "DeployedTopologyDetails",
  components: { DeployedTopologyDeploymentActions, DeployedTopologyInfoDetailedCard },
  props: {
    kafkaClusterId: String,
    topologyId: String,
    nodeIdsToExpand: Array
  },
  data() {
    return {
      getGetTopologyMetricsInterval: null
    };
  },
  mounted() {
    this.dispatchGetTopologyDetails();
    this.dispatchGetTopologyMetrics().then(() => this.initializeGetTopologyMetricsInterval());
  },
  beforeDestroy() {
    this.clearGetTopologyMetricsInterval();
  },
  methods: {
    clearGetTopologyMetricsInterval() {
      if (this.getGetTopologyMetricsInterval) {
        clearInterval(this.getGetTopologyMetricsInterval);
      }
    },
    initializeGetTopologyMetricsInterval() {
      this.clearGetTopologyMetricsInterval();
      this.getGetTopologyMetricsInterval = setInterval(() => this.dispatchGetTopologyMetrics(), 5000);
    },
    dispatchGetTopologyDetails() {
      const deployedTopologyDetailsPromise = this.$store.dispatch(
        "deployedTopologyDetails/getTopologyDetails",
        { kafkaClusterId: this.kafkaClusterId, topologyId: this.topologyId }
      );
      const resolvedDeployedTopologiesPromise = this.$store.dispatch(
        "resolvedDeployedTopologies/getResolvedDeployedTopologies",
        { kafkaClusterId: this.kafkaClusterId, topologyId: this.topologyId, nodeIdsToExpand: this.nodeIdsToExpand }
      );
      const topologyPromise = this.$store.dispatch("topologyDetails/getTopology", { topologyId: this.topologyId });
      return Promise.all([deployedTopologyDetailsPromise, topologyPromise]);
    },
    dispatchGetTopologyMetrics() {
      return this.$store.dispatch("deployedTopologyDetails/getTopologyMetrics", { kafkaClusterId: this.kafkaClusterId, topologyIds: this.resolvedDeployedTopologyIds });
    },
    onActualRankdirChanged(event) {
      console.log("DeployedTopologyDetails.onActualRankdirChanged: ", event);
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
      const resolvedDeployedTopologiesToShow = this.resolvedDeployedTopologies;
      const graph = createGraphFromResolvedTopologies(resolvedDeployedTopologiesToShow);
      ((graph && graph.edges) || [])
        .forEach(e => {
          if (e.isConsume) {
            const applicationConsumerGroupTopicInfo = this.deployedTopologyApplicationConsumerGroupTopicMetrics({ applicationId: e.consumerApplicationId, topicId: e.consumedTopicId });
            if (applicationConsumerGroupTopicInfo) {
              e.totalLag = applicationConsumerGroupTopicInfo.totalLag;
              e.totalConsumedPerSecond = applicationConsumerGroupTopicInfo.totalConsumedPerSecond;
              e.partitions = Object.entries(applicationConsumerGroupTopicInfo.partitions)
                .map(([partition, partitionInfo]) => ({ partition, lag: partitionInfo.lag, consumedPerSecond: partitionInfo.consumedPerSecond }) );
              e.status = aggregatedConsumerGroupStatus.toPrettyString(applicationConsumerGroupTopicInfo.aggregatedConsumerGroupStatus);
              if (aggregatedConsumerGroupStatus.isWarning(applicationConsumerGroupTopicInfo.aggregatedConsumerGroupStatus)) {
                e.class = e.class + " consumer-edge-warning";
              } else if (aggregatedConsumerGroupStatus.isError(applicationConsumerGroupTopicInfo.aggregatedConsumerGroupStatus)) {
                e.class = e.class + " consumer-edge-error";
              }
            }
          }
          if ((this.highlights.edge !== undefined && e.from === this.highlights.edge.v && e.to === this.highlights.edge.w) 
              || (this.highlights.node !== undefined && (e.from === this.highlights.node || e.to === this.highlights.node))) {
              e.class = e.class + " highlighted"
          }
        })
      graph.nodes
        .forEach(tn => {
          if (tn.isTopic) {
            const topicMetrics = this.deployedTopologyTopicMetrics({ topicId: tn.nodeId});
            tn.topicMetrics = topicMetrics;
          }
          if ((this.highlights.node !== undefined && this.highlights.node === tn.id) 
            || (this.highlights.edge !== undefined && (this.highlights.edge.v === tn.id || this.highlights.edge.w === tn.id)) ) {
            tn.class = tn.class  + " highlighted"
          }
        });
      return graph;
    },
    ...mapState({
      topology: state => state.topologyDetails.topology,
      highlights: state => state.topologyDetails.highlights
    }),
    ...mapGetters({
      deployedTopology: "deployedTopologyDetails/deployedTopology",
      resolvedDeployedTopologies: "resolvedDeployedTopologies/resolvedDeployedTopologies",
      resolvedDeployedTopologyIds: "resolvedDeployedTopologies/topologyIds",
      deployedTopologyApplicationConsumerGroupTopicMetrics: "deployedTopologyDetails/deployedTopologyApplicationConsumerGroupTopicMetrics",
      deployedTopologyTopicMetrics: "deployedTopologyDetails/deployedTopologyTopicMetrics"
    }),
    deploymentActions() {
      return this.deployedTopology && this.deployedTopology.kafkaClusterActions;
    },
    type() {
      if (this.deploymentActions && this.deploymentActions.find(deploymentAction.hasExecutionFailed)) {
        return "negative";
      } else if (this.deploymentActions && this.deploymentActions.find(deploymentAction.isNotFullyAllowed)) {
        return "warning";
      } else if (this.deployedTopology && !this.deployedTopology.allActionsSuccessful) {
        // this shouldn't happen, just in case
        return "warning";
      } else if (this.deployedTopology) {
        return "positive";
      } else {
        return "info";
      }
    },
    hasVersion() {
      return this.deployedTopology && this.deployedTopology.topologyWithVersion !== undefined;
    },
    isLatestVersion() {
      return this.deployedTopology && this.deployedTopology.topologyWithVersion && this.topology.metadata.version === this.deployedTopology.topologyWithVersion.version;
    },
    version() {
      return this.isLatestVersion ? "latest" : `v${this.deployedTopology.topologyWithVersion.version}`;
    },
    versionColor() {
      return this.isLatestVersion ? "primary" : "secondary";
    },
  },
};
</script>

<style lang="stylus">
@import '~variables'

g.type-TOPIC > rect {
  fill: $graph-topic-topology-bg;
}

g.type-TOPIC.highlighted > rect {
  stroke-width: 2px !important;
  stroke: blue !important;
}

g.type-APPLICATION > rect {
  fill: $graph-application-topology-bg;
}

g.type-APPLICATION.highlighted > rect {
  stroke-width: 2px !important;
  stroke: blue !important;
}

g.type-EXTERNAL > rect {
  fill: $graph-topic-external-bg;
}

g.type-EXTERNAL.highlighted > rect {
  stroke-width: 2px !important;
  stroke: blue !important;
}

.edgeLabels text {
  fill: $graph-edge-text;
}

.dagre-d3-tip {
  background: rgba(0xf, 0xf0, 0, 1.0);
}

g.type-PRODUCE > path {
  stroke: $graph-edge-produce;
  stroke-width: 1.5px;
}
g.type-PRODUCE marker > path {
  stroke: $graph-edge-produce;
  fill: $graph-edge-produce;
  stroke-width: 1.5px;
}

g.type-CONSUME > path{
  stroke: $graph-edge-consume-info;
  stroke-width: 1.5px;
}
g.type-CONSUME marker > path {
  stroke: $graph-edge-consume-info;
  fill: $graph-edge-consume-info;
  stroke-width: 1.5px;
}

g.type-CONSUME.consumer-edge-warning > path{
  stroke: $graph-edge-consume-warning;
  stroke-width: 1.5px;
}
g.type-CONSUME.consumer-edge-warning marker > path {
  stroke: $graph-edge-consume-warning;
  fill: $graph-edge-consume-warning;
  stroke-width: 1.5px;
}

g.type-CONSUME.consumer-edge-error > path{
  stroke: $graph-edge-consume-error;
  stroke-width: 1.5px;
}
g.type-CONSUME.consumer-edge-error marker > path {
  stroke: $graph-edge-consume-error;
  fill: $graph-edge-consume-error;
  stroke-width: 1.5px;
}

g.type-EDGE-CUSTOM > path {
  stroke: $graph-edge-other;
  stroke-width: 1.5px;
}
g.type-EDGE-CUSTOM marker > path {
  stroke: $graph-edge-other;
  fill: $graph-edge-other;
  stroke-width: 1.5px;
}

g.type-EDGE.highlighted > path {
  stroke: blue !important;
}

</style>
