<template>
  <div>
    <q-modal v-model="topologyJsonModalOpened" :content-css="{minWidth: '30vw', minHeight: '50vh'}" content-classes="json-modal" >
    <q-modal-layout>
    <pre class="json"><code>{{topologyJson}}</code></pre>
    <q-btn
      icon="close"
      color="primary"
      class="top-right fixed"
      @click="onCloseTopologyJsonModal"
    />
    </q-modal-layout>
    </q-modal>
    <div class="col q-pa-sm card">
      <div class="row-auto row items-center q-pt-sm">
        <div class="row flex-center card-side" @click="onOpenTopologyJsonModal">
          <q-icon name="developer_board" size="24px" class="col-auto text-card-icon" color="card-icon" />
        </div>
        <div class="col q-ml-xs">
          <div class="row no-wrap justify-between q-mb-xs">
            <span class="col text-card-title-text ellipsis">{{ topologyInfo.topologyId }}</span>
            <q-chip dense text-color="card-chip-text" class="transparent col-auto title-chip" icon="person">{{ topologyInfo.topology.metadata.createdBy }}</q-chip>
            <q-chip dense color="card-chip-version-bg" text-color="card-chip-text title-chip" class="col-auto">v{{ topologyInfo.topology.metadata.version }}</q-chip>
          </div>
          <div class="row no-wrap justify-between">
            <span class="row text-card-subtitle-text ellipsis">{{ description }}</span>
            <div class="row-auto justify-end">
              <q-chip dense text-color="card-chip-text" class="transparent col-auto title-chip" icon-right="access_time">{{ formattedTimeStampUtc }}</q-chip>
            </div>
          </div>
        </div>
      </div>
      <DeployedTopologyInfoCard
        class="q-mt-xs row-auto"
        v-for="deployedTopology in topologyInfo.deployedTopologiesWithMetrics"
        :key="deployedTopology.kafkaClusterId"
        :latestTopologyVersion="topologyInfo.topology.metadata.version"
        :deployedTopology="deployedTopology"/>
    </div>
  </div>
</template>

<script>
import { dateToPrettyString } from "../utils/Utils.js"
import kafkakewlApi from "../api/kafkakewl.js"
import DeployedTopologyInfoCard from "./DeployedTopologyInfoCard.vue"

export default {
  name: "TopologyInfoCard",
  components: { DeployedTopologyInfoCard },
  data() {
    return {
      topologyJsonModalOpened: false,
      topologyJson: ""
    }
  },
  props: {
    topologyInfo: Object
  },
  methods: {
    onOpenTopologyJsonModal(event) {
      kafkakewlApi.getTopology(this.topologyInfo.topologyId)
        .then(d => {
          this.topologyJson = JSON.stringify(d.Succeeded.response.topology.entity, null, 2);
        })
      this.topologyJsonModalOpened = true;
    },
    onCloseTopologyJsonModal(event) {
      this.topologyJsonModalOpened = false;
    }
  },
  computed: {
    description() {
      return this.topologyInfo.topology.description || this.topologyInfo.topology.namespace || "-";
    },
    formattedTimeStampUtc() {
      return dateToPrettyString(this.topologyInfo.topology.metadata.timeStampUtc);
    }
  }
};
</script>

<style scoped lang="stylus">
@import '~variables'

.top-right {
  position: absolute;
  top: 20px;
  right: 30px;
}

.json {
  color: $card-title-text;
}

.card {
  background: $card-background;
  border-radius: $card-border-radius;
}

.card-side {
  width: 48px;
  height: 48px;
  border-top-left-radius: $card-border-radius;
  border-bottom-left-radius: $card-border-radius;
}
.card-side:hover {
  cursor: pointer;
}

.text-card-icon {
  color: $card-title-text;
}
.text-card-icon:hover {
  color: darken($card-title-text, 20%);
}

.text-card-title-text {
  color: $card-title-text;
  font-size: 16px;
}

.text-card-subtitle-text {
  color: $card-subtitle-text;
  font-size: 12px;
}

.title-chip {
  font-size: 10px;
  font-weight: 700;
}

.bg-card-chip-version-bg {
  background: $card-chip-version-bg;
}

.text-card-chip-text {
  color: $card-chip-text;
}
</style>
