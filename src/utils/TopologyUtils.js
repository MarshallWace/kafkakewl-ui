export const topology = {
    fullyQualifiedId(topologyId, localId) {
        topologyId = topologyId || "";
        localId = localId || "";
        if (topologyId.length > 0 && localId.length > 0) {
            return topologyId + "." + localId;
        } else {
            return topologyId + localId;
        }
    }
}

export const application = {
    type(app) {
        if (app.type.kafkaStreamsAppId) return "kstreams";
        if (app.type.connector) return "connector";
        if (app.type.connectReplicator) return "replicator";
        return "simple"
    },
    consumerGroup: app => app.type.consumerGroup || app.type.kafkaStreamsAppId,
    transactionalId: app => app.type.transactionalId,
    kafkaStreamsAppId: app => app.type.kafkaStreamsAppId,
    isKafkaStreams: app => app.type.kafkaStreamsAppId
}

const isStopped = status => status === "MaybeStopped" || status === "Stopped";

export const aggregatedConsumerGroupStatus = {
  toPrettyString({ best, worst }) {
    switch (worst) {
      case undefined:
        return undefined;
      case "Ok":
        return "OK";
      case "Unknown":
        return "?";
      case "Warning":
        return "Lagging";
      case "Error":
        return "Stopping";
      case "MaybeStopped":
        return isStopped(best) ? "Stopped?" : "Partially Stopped?";
      case "Stopped":
        return isStopped(best) ? "Stopped" : "Partially Stopped";
      default:
        return worst;
    }
  },
  isWarning({ best, worst }) {
      switch (worst) {
        case "Unknown":
        case "Warning":
          return true;
        case "Ok":
        case "Error":
        case "MaybeStopped":
        case "Stopped":
        default:
          return false;
      }
  },
  isError({ best, worst }) {
      switch (worst) {
        case "Error":
        case "MaybeStopped":
        case "Stopped":
          return true;
        case "Ok":
        case "Unknown":
        case "Warning":
        default:
          return false;
      }
  }
}