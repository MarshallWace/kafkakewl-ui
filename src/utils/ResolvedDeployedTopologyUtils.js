import _ from "lodash";
import kafkakewlApi from "../api/kafkakewl.js"

export function getResolvedDeployedTopologies(kafkaClusterId) {
    return kafkakewlApi
        .getResolvedDeployedTopologies(kafkaClusterId)
        .then(data => {
            return Object.entries(data.Succeeded.response.deployedTopologies)
                .map(([topologyId, resolvedDeployedTopology]) => ({ kafkaClusterId, topologyId, ...resolvedDeployedTopology }));
        });
}

export function getResolvedDeployedTopologiesFor(kafkaClusterId, topologyFilter) {
    topologyFilter = (topologyFilter || "").toLowerCase();

    return getResolvedDeployedTopologies(kafkaClusterId)
        .then(rdts => rdts.filter(rdt => rdt.topologyId.toLowerCase().includes(topologyFilter)))
}
