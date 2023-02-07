import Vue from "vue";
import Router from "vue-router";
import DefaultLayout from "./layouts/Default.vue";
import TopologyBrowser from "./views/TopologyBrowser.vue";
import TopologyBrowserToolbar from "./views/TopologyBrowserToolbar.vue";
import DeployedTopologyDetails from "./views/DeployedTopologyDetails.vue";
import DeployedTopologiesGraph from "./views/DeployedTopologiesGraph.vue";
import About from "./views/About.vue";
import NotFound from "./views/NotFound.vue";

Vue.use(Router);

export default new Router({
  mode: 'history',
  routes: [
    {
      path: "/",
      component: DefaultLayout,
      children: [
        {
          path: "",
          name: "topologyBrowser",
          components: {
            default: TopologyBrowser,
            toolbar: TopologyBrowserToolbar
          },
          props: {
            toolbar: route => ({ initialFilter: route.query.filter }),
          }
        },
        {
          path: "/deployed/:kafkaClusterId/:topologyId",
          name: "deployedTopologyDetails",
          component: DeployedTopologyDetails,
          props: route => ({
            kafkaClusterId: route.params.kafkaClusterId,
            topologyId: route.params.topologyId,
            nodeIdsToExpand: (route.query.expand && route.query.expand.split(",")) || []
          })
        },
        {
          path: "/about",
          name: "about",
          component: About
        },
        {
          path: "/graph/:kafkaClusterId",
          name: "graph",
          components: {
            default: DeployedTopologiesGraph,
            toolbar: TopologyBrowserToolbar
          },
          props: {
            default: route => ({ kafkaClusterId: route.params.kafkaClusterId }),
            toolbar: route => ({ initialFilter: route.query.filter, debounceMs: 1000 }),
          }
        }
      ]
    },
    {
      path: '*',
      component: NotFound
    }
  ]
});
