import axios from "axios";

const kafkakewl_api_url = process.env.VUE_APP_KAFKAKEWL_API_URL;
console.log(`kafkakewl-api: ${kafkakewl_api_url}`);

export const kafkakewl = axios.create({
    baseURL: kafkakewl_api_url,
    headers: {
        'Accept': "application/json"
    },
    withCredentials: true
})

function get(path) {
    return kafkakewl
        .get(path)
        .then(response => response.data)
        .catch(err => console.log(err))
}

function getTopologies() {
    return get("/topology?compact=true");
}

function getDeployments() {
    return get("/deployment");
}

function getDeployedTopologies() {
    return get("/deployedtopology?compact=true");
}

function getDeployedTopologiesMetrics() {
    return get("/metrics/deployedtopology?compact=true");
}

function getTopology(topologyId) {
    return get(`/topology/${topologyId}`);
}

function getDeployment(kafkaClusterId, topologyId) {
    return get(`/deployment/${kafkaClusterId}/${topologyId}`);
}

function getDeployedTopology(kafkaClusterId, topologyId) {
    return get(`/deployedtopology/${kafkaClusterId}/${topologyId}`);
}

function getDeployedTopologyMetrics(kafkaClusterId, topologyId) {
    return get(`/metrics/deployedtopology/${kafkaClusterId}/${topologyId}`);
}

function getDeployedTopologyTopics(kafkaClusterId, topologyId) {
    return get(`/deployedtopology/${kafkaClusterId}/${topologyId}/topic`);
}

function getDeployedTopologyTopicDetails(kafkaClusterId, topologyId, topicId) {
    return get(`/deployedtopology/${kafkaClusterId}/${topologyId}/topic/${topicId}`);
}

function getDeployedTopologyApplications(kafkaClusterId, topologyId) {
    return get(`/deployedtopology/${kafkaClusterId}/${topologyId}/application`);
}

function getDeployedTopologyApplicationDetails(kafkaClusterId, topologyId, applicationId) {
    return get(`/deployedtopology/${kafkaClusterId}/${topologyId}/application/${applicationId}`);
}

function getResolvedDeployedTopology(kafkaClusterId, topologyId) {
    return get(`/resolved/deployedtopology/${kafkaClusterId}/${topologyId}`);
}

function getResolvedDeployedTopologies(kafkaClusterId) {
    return get(`/resolved/deployedtopology/${kafkaClusterId}`);
}

export default {
    getTopologies,
    getDeployments,
    getDeployedTopologies,
    getDeployedTopologiesMetrics,
    getTopology,
    getDeployment,
    getDeployedTopology,
    getDeployedTopologyMetrics,
    getDeployedTopologyTopics,
    getDeployedTopologyTopicDetails,
    getDeployedTopologyApplications,
    getDeployedTopologyApplicationDetails,
    getResolvedDeployedTopology,
    getResolvedDeployedTopologies
}