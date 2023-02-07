import _ from "lodash";

import { application } from "./TopologyUtils.js";

export function createGraphFromResolvedTopologies(resolvedDeployedTopologies) {
    resolvedDeployedTopologies = resolvedDeployedTopologies.filter(rdt => rdt);

    function propertiesTooltipHtml(properties) {
        return properties
            .filter(([k, v]) => k && v && v.toString().length > 0)
            .map(([k, v]) => `<span>${k}: ${v}<span>`)
            .join("<br/>");
    }

    function topicTooltipHtml(id, topic) {
        const properties = [
            ["name", topic.name],
            ["description", topic.description],
            ["partitions", topic.partitions],
            ["replication-factor", topic.replicationFactor],
            ["config", `${Object.entries(topic.config).map(([k, v]) => `${k}: '${v}'`).join(", ")}`],
        ];
        return propertiesTooltipHtml(properties);
    }

    function applicationTooltipHtml(id, app) {
        const properties = [
            ["description", app.description],
            ["user", app.user],
            ["type", application.type(app)],
            ["consumer-group", application.consumerGroup(app) || "n/a"],
            ["transactional-id", application.transactionalId(app)],
            ["kafka-streams-id", application.kafkaStreamsAppId(app)]
        ];
        return propertiesTooltipHtml(properties);
    }

    const topics = _.flatMap(
        resolvedDeployedTopologies,
        resolvedDeployedTopology => 
            Object.entries(resolvedDeployedTopology.topics || []).map(([id, topic]) => ({ id, label: id, class: "type-TOPIC", tooltipHtml: topicTooltipHtml(id, topic), topic: topic, isTopic: true }))
    );
    const applications = _.flatMap(
        resolvedDeployedTopologies,
        resolvedDeployedTopology => 
            Object.entries(resolvedDeployedTopology.applications || []).map(([id, app]) => ({ id, label: id, class: "type-APPLICATION", tooltipHtml: applicationTooltipHtml(id, app), application: app, isApplication: true }))
    );
    const topicsApplications = topics.concat(applications);
    const topicsApplicationsIds = new Set(topicsApplications.map(n => n.id));

    const edges = _.flatMap(
        resolvedDeployedTopologies,
        resolvedDeployedTopology => 
            (resolvedDeployedTopology.relationships || [])
            .map(r => {
                switch (r.relationship) {
                    case "consume":
                        return { from: r.id2, to: r.id1, isConsume: true, relationship: r.relationship, labelString: "consuming", class: "type-EDGE type-CONSUME" };
                    case "produce":
                        return { from: r.id1, to: r.id2, isProduce: true, relationship: r.relationship, labelString: "produce", class: "type-EDGE type-PRODUCE" };
                    default:
                        return { from: r.id1, to: r.id2, isCustom: true, relationship: r.relationship, labelString: r.relationship, class: `type-EDGE type-EDGE-CUSTOM type-${r.relationship.toUpperCase()}` };
                }
            })
    );
    
    const additionalNodes = _.uniqBy(
        _.flatMap(
            edges,
            r => [r.from, r.to].filter(id => !topicsApplicationsIds.has(id)).map(id => ({ id, label: id, class: "type-EXTERNAL" }))
        ),
        n => n.id
    );
    const nodes = topicsApplications.concat(additionalNodes).map((n, i) => ({ numeric_id: i, uniqueId: n.id, ...n }));
    const nodesById = new Map(nodes.map(n => [n.id, n]));
    edges.forEach(e => {
      const fromNode = nodesById.get(e.from);
      const toNode = nodesById.get(e.to);
      if (e.isConsume) {
        e.consumerApplicationId = toNode.id;
        e.consumedTopicId = fromNode.id;
      }
      if (e.isProduce) {
        e.producerApplicationId = fromNode.id;
        e.producedTopicId = toNode.id;
      }
      e.from = fromNode.numeric_id;
      e.to = toNode.numeric_id;
      e.uniqueId = `[${fromNode.id}]-${e.relationship}->[${toNode.id}]`;
    });
    nodes.forEach(n => { 
      n.nodeId = n.id;
      n.id = n.numeric_id;
      delete n.numeric_id;
    });

    return { nodes, edges };
}
