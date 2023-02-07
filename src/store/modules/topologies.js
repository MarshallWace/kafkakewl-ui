import kafkakewlApi from "../../api/kafkakewl.js"

class TopologyInfoCompact {
    constructor(topologyId, { topology = { metadata: {} }, deployments = [], deployedTopologies = [], deployedTopologiesMetrics = [] }) {
        this.topologyId = topologyId;
        this.topology = topology;
        this.deployments = deployments;
        this.deployedTopologies = deployedTopologies;
        this.deployedTopologiesMetrics = deployedTopologiesMetrics;
        this.deployedTopologiesWithMetrics = deployedTopologies;
        this.mergeDeployedTopologiesWithMetrics();
    }

    mergeDeployedTopologiesWithMetrics() {
        this.deployedTopologiesWithMetrics =
            this.deployedTopologies.map(dt => {
                let dtm = this.deployedTopologiesMetrics.find(dtm => dtm.kafkaClusterId === dt.kafkaClusterId)
                // This was here to test the different statuses
                // if (dt.topologyId === "connect" || dt.topologyId === "datahub.datasetobject") {
                //     dtm = { aggregateConsumerGroupStatus: "Unknown" }
                // }
                // if (dt.topologyId === "datahub.dremio") {
                //     dtm = { aggregateConsumerGroupStatus: "Warning" }
                // }
                // if (dt.topologyId === "dataplatform.impact-net") {
                //     dtm = { aggregateConsumerGroupStatus: "Error" }
                // }
                // if (dt.topologyId === "dataplatform.parsefile") {
                //     dtm = { aggregateConsumerGroupStatus: "MaybeStopped" }
                // }
                // if (dt.topologyId === "dataplatform.secid") {
                //     dtm = { aggregateConsumerGroupStatus: "Stopped" }
                // }
                if (dtm) {
                    return { ...dtm, ...dt };
                } else {
                    return dt;
                }
            });
    }

    removeDeployment(kafkaClusterId) {
        const index = this.deployments.findIndex(d => d.kafkaClusterId === kafkaClusterId);
        if (index >= 0) {
            this.deployments.splice(index, 1);
        }
    }

    removeDeployedTopology(kafkaClusterId) {
        const index = this.deployedTopologies.findIndex(d => d.kafkaClusterId === kafkaClusterId);
        if (index >= 0) {
            this.deployedTopologies.splice(index, 1);
        }
    }

    removeDeployedTopologyMetrics(kafkaClusterId) {
        const index = this.deployedTopologiesMetrics.findIndex(d => d.kafkaClusterId === kafkaClusterId);
        if (index >= 0) {
            this.deployedTopologiesMetrics.splice(index, 1);
        }
    }

    addOrUpdateDeployment(deployment) {
        this.removeDeployment(deployment.kafkaClusterId);
        this.deployments.push(deployment);
    }

    addOrUpdateDeployedTopology(deployedTopology) {
        this.removeDeployedTopology(deployedTopology.kafkaClusterId);
        this.deployedTopologies.push(deployedTopology);
        this.mergeDeployedTopologiesWithMetrics();
    }

    addOrUpdateDeployedTopologyMetrics(deployedTopologyMetrics) {
        this.removeDeployedTopologyMetrics(deployedTopologyMetrics.kafkaClusterId);
        this.deployedTopologiesMetrics.push(deployedTopologyMetrics);
        this.mergeDeployedTopologiesWithMetrics();
    }

    toString() {
        return `${topologyId} - [${deployments.map(d => d.kafkaClusterId)}]`;
    }
}

function findTopologyInfoInState(state, topologyId) {
    return state.topologyInfos.find(t => t.topologyId === topologyId);
}

const store = {
    namespaced: true,
    state: {
        topologyInfos: [],
        currentTopologyFilter: ""
    },
    getters: {
        currentTopologyFilter: state => state.currentTopologyFilter,
        filteredTopologyInfos: state => {
            const filter = (state.currentTopologyFilter || "").toLowerCase();
            return state.topologyInfos.filter(t => t.topologyId.toLowerCase().includes(filter));
        },
        topologyInfo: state => topologyId => findTopologyInfoInState(state, topologyId),
    },
    mutations: {
        setCurrentTopologyFilter(state, topologyFilter) {
            state.currentTopologyFilter = topologyFilter;
        },
        setTopologies(state, topologiesResponse) {
            const topologiesResponseIdsMap = new Set();
            for (const t of topologiesResponse) {
                const topologyId = t.metadata.id;
                let topology = t.entity;
                topology.topologyId = topologyId;
                topology.metadata = t.metadata;
                const existingTopologyInfo = findTopologyInfoInState(state, topologyId);
                // either merge into an existing one or create a new one
                if (existingTopologyInfo) {
                    existingTopologyInfo.topology = topology;
                } else {
                    state.topologyInfos.push(new TopologyInfoCompact(topologyId, { topology }));
                    state.topologyInfos.sort((t1, t2) => t1.topologyId.localeCompare(t2.topologyId));
                }
                topologiesResponseIdsMap.add(topologyId);
            }

            // finding the topology infos which are no longer in the set of topologies
            const removedTopologies = state.topologyInfos
                .map((ti, i) => [ti, i])
                .filter(([ti, i]) => !topologiesResponseIdsMap.has(ti.topologyId))

            // removing the topology infos that are no long in the set of topologies - remove with splice, maintaining the remove-index after removals
            let numberOfRemovedTopologies = 0;
            for (const [, i] of removedTopologies) {
                // assuming that the removed-indices are increasing in this array:
                state.topologyInfos.splice(i - numberOfRemovedTopologies, 1);
                numberOfRemovedTopologies += 1;
            }
        },
        setDeployments(state, deploymentsResponse) {
            for (const d of deploymentsResponse) {
                const topologyId = d.entity.topologyId;
                let deployment = d.entity;
                deployment.metadata = d.metadata;
                const existingTopologyInfo = findTopologyInfoInState(state, topologyId);
                // either merge into an existing one or create a new one
                if (existingTopologyInfo) {
                    existingTopologyInfo.addOrUpdateDeployment(deployment);
                } else {
                    state.topologyInfos.push(new TopologyInfoCompact(topologyId, { deployments: [deployment] }));
                    state.topologyInfos.sort((t1, t2) => t1.topologyId.localeCompare(t2.topologyId));
                }
            }
        },
        setDeployedTopologies(state, deployedTopologiesResponse) {
            for (const dt of deployedTopologiesResponse) {
                const topologyId = dt.entity.topologyId;
                let deployedTopology = dt.entity;
                deployedTopology.metadata = dt.metadata;
                const existingTopologyInfo = findTopologyInfoInState(state, topologyId);
                // either merge into an existing one or create a new one
                if (existingTopologyInfo) {
                    existingTopologyInfo.addOrUpdateDeployedTopology(deployedTopology);
                } else {
                    state.topologyInfos.push(new TopologyInfoCompact(topologyId, { deployedTopologies: [deployedTopology] }));
                    state.topologyInfos.sort((t1, t2) => t1.topologyId.localeCompare(t2.topologyId));
                }
            }
        },
        setDeployedTopologiesMetrics(state, deployedTopologiesMetricsResponse) {
            for (const dtm of deployedTopologiesMetricsResponse) {
                const topologyId = dtm.topologyId;
                const existingTopologyInfo = findTopologyInfoInState(state, topologyId);
                // either merge into an existing one or create a new one
                if (existingTopologyInfo) {
                    existingTopologyInfo.addOrUpdateDeployedTopologyMetrics(dtm);
                } else {
                    state.topologyInfos.push(new TopologyInfoCompact(topologyId, { deployedTopologiesMetrics: [dtm] }));
                    state.topologyInfos.sort((t1, t2) => t1.topologyId.localeCompare(t2.topologyId));
                }
            }
        }
    },
    actions: {
        getTopologyInfo({ commit }) {
            const topologiesPromise = kafkakewlApi
                .getTopologies()
                .then(data => commit('setTopologies', data.Succeeded.response.topologies))

            const deploymentsPromise = kafkakewlApi
                .getDeployments()
                .then(data => commit('setDeployments', data.Succeeded.response.deployments))

            const deployedTopologiesPromise = kafkakewlApi
                .getDeployedTopologies()
                .then(data => commit('setDeployedTopologies', data.Succeeded.response.deployedTopologies))

            const deployedTopologiesMetricsPromise = kafkakewlApi
                .getDeployedTopologiesMetrics()
                .then(data => commit('setDeployedTopologiesMetrics', data.Succeeded.response.deployedTopologiesMetrics))

            return Promise.all([topologiesPromise, deploymentsPromise, deployedTopologiesPromise, deployedTopologiesMetricsPromise]);
        }
    }
  }


export default store;
