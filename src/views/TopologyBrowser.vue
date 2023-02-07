<template>
  <q-page class="flex q-pt-md" >
    <div class="row gutter-sm" style="width: 100%; height: 100%">
      <div v-for="topologyInfo in filteredTopologyInfos" class="col-12 col-lg-6 col-xl-4">
        <TopologyInfoCard :key="topologyInfo.topologyId" :topologyInfo="topologyInfo" />
      </div>
    </div>
  </q-page>
</template>

<style>
</style>

<script>
import { mapState, mapGetters } from "vuex";
import TopologyInfoCard from "../components/TopologyInfoCard.vue";

export default {
  name: "TopologyBrowser",
  components: { TopologyInfoCard },
  data() {
    return {
      getTopologyInfoInterval: null
    };
  },
  mounted() {
    this.dispatchGetTopologyInfoInterval()
      .then(() => {
        this.initializeGetTopologyInfoInterval();
      });
  },
  beforeDestroy() {
    this.clearGetTopologyInfoInterval();
  },
  methods: {
    clearGetTopologyInfoInterval() {
      if (this.getTopologyInfoInterval) {
        clearInterval(this.getTopologyInfoInterval);
      }
    },
    initializeGetTopologyInfoInterval() {
      this.clearGetTopologyInfoInterval();
      this.getTopologyInfoInterval = setInterval(() => this.dispatchGetTopologyInfoInterval(), 30000);
    },
    dispatchGetTopologyInfoInterval() {
      return this.$store.dispatch("topologies/getTopologyInfo");
    }
  },
  computed: {
    ...mapGetters({
      filteredTopologyInfos: "topologies/filteredTopologyInfos"
    })
  }
};
</script>
