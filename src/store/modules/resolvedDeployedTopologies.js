import _ from "lodash";

import kafkakewlApi from "../../api/kafkakewl.js";
import { topology as topologyUtils } from "../../utils/TopologyUtils.js";

const store = {
    namespaced: true,
    state: {
        resolvedDeployedTopologies: [],
        topologyIds: []
    },
    getters: {
        resolvedDeployedTopologies: state => state.resolvedDeployedTopologies,
        topologyIds: state => state.topologyIds
    },
    mutations: {
        setTopologyIds(state, topologyIds) {
            state.topologyIds = topologyIds;
        },
        setResolvedDeployedTopologies(state, { resolvedDeployedTopologies, topologyId, nodeIdsToExpand }) {
            const nodeIdsToExpandSet = new Set(nodeIdsToExpand.concat(nodeIdsToExpand.map(nid => topologyUtils.fullyQualifiedId(topologyId, nid))));
            const expandAll = nodeIdsToExpandSet.has("*");
            function includeRelationship(relationship) {
                return (relationship.topologyId1 === topologyId && (expandAll || nodeIdsToExpandSet.has(relationship.id1))) || 
                       (relationship.topologyId2 === topologyId && (expandAll || nodeIdsToExpandSet.has(relationship.id2)));
            }

            state.resolvedDeployedTopologies = Object.entries(resolvedDeployedTopologies)
                .map(([rdtid, rdt]) => {
                    rdt.topologyId = rdtid;
                    if (rdtid !== topologyId) {
                        // this is actually not 100% correct: it doesn't handle relationships where each end is in a different topology
                        rdt.relationships = rdt.relationships.filter(includeRelationship);

                        Object.entries(rdt.topics)
                            .filter(([id, _]) => rdt.relationships.find(fr => fr.id1 !== id && fr.id2 !== id))
                            .forEach(([id, _]) => delete rdt.topics[id]);

                        Object.entries(rdt.applications)
                            .filter(([id, _]) => rdt.relationships.find(fr => fr.id1 !== id || fr.id2 !== id))
                            .forEach(([id, _]) => delete rdt.applications[id]);
                    }
                    return rdt;
                })
                .filter(rdt => rdt.topologyId === topologyId || rdt.relationships.length > 0);

            state.topologyIds = (state.resolvedDeployedTopologies || []).map(rdt => rdt.topologyId);
        }
    },
    actions: {
        getResolvedDeployedTopologies({ commit }, { kafkaClusterId, topologyId, nodeIdsToExpand }) {
            // before getting the resolved topologies, initialize the topologyIds to the current topology, so that the metrics also can be started downloading
            commit("setTopologyIds", [topologyId]);
            if (nodeIdsToExpand && nodeIdsToExpand.length > 0) {
                // if there is a node to be expanded, we need to download all resolved-deployed-topologies to be able to find the connecting nodes
                return kafkakewlApi
                    .getResolvedDeployedTopologies(kafkaClusterId)
                    .then(data => commit("setResolvedDeployedTopologies", { resolvedDeployedTopologies: data.Succeeded.response.deployedTopologies, topologyId, nodeIdsToExpand }));
            } else {
                // download only this topologies' resolved deployed topology
                return kafkakewlApi
                    .getResolvedDeployedTopology(kafkaClusterId, topologyId)
                    .then(data => commit("setResolvedDeployedTopologies", { resolvedDeployedTopologies: data.Succeeded.response.deployedTopologies, topologyId, nodeIdsToExpand }));
            }
        }
    }
  }

export default store;
