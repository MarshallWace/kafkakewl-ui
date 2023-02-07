import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store/index";

import "./styles/quasar.styl";
import "quasar-extras/material-icons";
import {
  Quasar,
  QBtn,
  QLayout,
  QLayoutHeader,
  QLayoutDrawer,
  QPage,
  QPageSticky,
  QPageContainer,
  QToolbar,
  QToolbarTitle,
  QList,
  QListHeader,
  QItemSeparator,
  QItem,
  QItemSide,
  QItemMain,
  QCard,
  QCardTitle,
  QCardMain,
  QCardMedia,
  QCardSeparator,
  QCardActions,
  QItemTile,
  QAlert,
  QTooltip,
  QChip,
  QInput,
  QTable,
  QTh,
  QTr,
  QTd,
  QTableColumns,
  QCollapsible,
  QIcon,
  QModal,
  QModalLayout
} from "quasar";

import TopologyInfoCard from "./components/TopologyInfoCard.vue";
import DeployedTopologyInfoCard from "./components/DeployedTopologyInfoCard.vue";
import DeployedTopologyInfoDetailedCard from "./components/DeployedTopologyInfoDetailedCard.vue";
import DeployedTopologyDeploymentActions from "./components/DeployedTopologyDeploymentActions.vue";
import DeployedTopologyDeploymentActionItem from "./components/DeployedTopologyDeploymentActionItem.vue";
import DeployedTopologyDeploymentActionItemTooltip from "./components/DeployedTopologyDeploymentActionItemTooltip.vue";
import ConsumerGroupStatus from "./components/ConsumerGroupStatus.vue";
import DagreD3Graph from "./components/DagreD3Graph.vue";

Vue.use(Quasar, {
  config: {},
  components: {
    QBtn,
    QLayout,
    QLayoutHeader,
    QLayoutDrawer,
    QPage,
    QPageSticky,
    QPageContainer,
    QToolbar,
    QToolbarTitle,
    QList,
    QListHeader,
    QItemSeparator,
    QItem,
    QItemSide,
    QItemMain,
    QCard,
    QCardTitle,
    QCardMain,
    QCardMedia,
    QCardSeparator,
    QCardActions,
    QItemTile,
    QAlert,
    QTooltip,
    QChip,
    QInput,
    QTable,
    QTh,
    QTr,
    QTd,
    QTableColumns,
    QCollapsible,
    QIcon,
    QModal,
    QModalLayout,
    TopologyInfoCard,
    DeployedTopologyInfoCard,
    DeployedTopologyInfoDetailedCard,
    DeployedTopologyDeploymentActions,
    DeployedTopologyDeploymentActionItem,
    DeployedTopologyDeploymentActionItemTooltip,
    ConsumerGroupStatus,
    DagreD3Graph
  },
  directives: {},
  plugins: {}
});

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
