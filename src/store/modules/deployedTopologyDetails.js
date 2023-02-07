import kafkakewlApi from "../../api/kafkakewl.js";

const store = {
    namespaced: true,
    state: {
        deployedTopology: undefined,
        deployedTopologiesMetrics: []
    },
    getters: {
        deployedTopology: state => state.deployedTopology,
        deployedTopologyMetrics: state => topologyId => state.deployedTopologiesMetrics.find(dtm => dtm.topologyId === topologyId),
        deployedTopologyApplicationConsumerGroupTopicMetrics: (state, getters) => ({ applicationId, topicId }) => {
            return state.deployedTopologiesMetrics
                .map(dtm => {
                    const applicationMetrics = dtm.applications && dtm.applications[applicationId];
                    const topicMetrics = applicationMetrics && applicationMetrics.consumerGroupStatus && 
                        applicationMetrics.consumerGroupStatus.topics && applicationMetrics.consumerGroupStatus.topics[topicId];
                    return topicMetrics;
                })
                .find(atm => atm !== undefined);
        },
        deployedTopologyTopicMetrics: (state, getters) => ({ topicId }) => {
            return state.deployedTopologiesMetrics
                .map(dtm => dtm.topics && dtm.topics[topicId])
                .find(atm => atm !== undefined);
        }
    },
    mutations: {
        setDeployedTopology(state, deployedTopologyResponse) {
            state.deployedTopology = { metadata: deployedTopologyResponse.metadata, ...deployedTopologyResponse.entity };
        },
        setDeployedTopologyMetrics(state, deployedTopologyMetricsResponse) {
            const index = state.deployedTopologiesMetrics.findIndex(dtm => dtm.topologyId === deployedTopologyMetricsResponse.topologyId);
            if (index >= 0) {
                state.deployedTopologiesMetrics.splice(index, 1);
            }
            state.deployedTopologiesMetrics.push(deployedTopologyMetricsResponse);
        },
    },
    actions: {
        getTopologyDetails({ commit }, { kafkaClusterId, topologyId }) {
            return kafkakewlApi
                .getDeployedTopology(kafkaClusterId, topologyId)
                .then(data => commit("setDeployedTopology", data.Succeeded.response.deployedTopology));
        },
        getTopologyMetrics({ commit }, { kafkaClusterId, topologyIds }) {
            Promise.all(
                topologyIds.map(topologyId => {
                    kafkakewlApi
                        .getDeployedTopologyMetrics(kafkaClusterId, topologyId)
                        .then(data => commit("setDeployedTopologyMetrics", data.Succeeded.response.deployedTopologyMetrics)); 
                })
            );
        }
    }
}

export default store;
