import Vue from "vue";
import Vuex from "vuex";
import topologies from "./modules/topologies"
import deployedTopologyDetails from "./modules/deployedTopologyDetails"
import topologyDetails from "./modules/topologyDetails"
import resolvedDeployedTopologies from "./modules/resolvedDeployedTopologies"

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    topologies,
    deployedTopologyDetails,
    topologyDetails,
    resolvedDeployedTopologies
  },
  strict: process.env.NODE_ENV !== 'production'
});
