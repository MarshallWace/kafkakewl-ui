import _ from "lodash";
import kafkakewlApi from "../api/kafkakewl.js"
import { getResolvedDeployedTopologiesFor } from "./ResolvedDeployedTopologyUtils.js"

export function generateFlinkVisualizerJson(resolvedDeployedTopologies) {
    const topics = _.flatMap(
        resolvedDeployedTopologies,
        resolvedDeployedTopology => 
            Object.entries(resolvedDeployedTopology.topics).map(([id, topic]) => ({ id, nodeType: "Topic", type: `TOPIC: ${topic.name}` }))
    );

    const applications = _.flatMap(
        resolvedDeployedTopologies,
        resolvedDeployedTopology => 
            Object.entries(resolvedDeployedTopology.applications).map(([id, app]) => ({ id, nodeType: "Application", type: `APPLICATION: ${id}` }))
    );

    const nodes = topics.concat(applications);
    const nodeIdSet = new Set(nodes.map(n => n.id));

    const relationships = _.flatMap(
        resolvedDeployedTopologies,
        resolvedDeployedTopology => 
            resolvedDeployedTopology.relationships
            .map(r => {
                switch (r.relationship) {
                    case "consume":
                        return { from: r.id2, to: r.id1, type: r.relationship };
                    case "produce":
                        return { from: r.id1, to: r.id2, type: r.relationship };
                    default:
                        return { from: r.id1, to: r.id2, type: r.relationship };
                }
            })
    );


    // HACK: removing the cycles (simple version, works only between 2 nodes), removing the consume relationship, if there is any
    const relationshipsWithNoCycles = Object.entries(_.groupBy(relationships, r => [r.from, r.to].sort().join("->")))
        .map(([key, g]) => {
            if (g.length > 1) {
                const consumeIndex = g.findIndex(r => r.type === "consume");
                if (consumeIndex >= 0) {
                    g.splice(consumeIndex, 1);
                }
            }
            return g[0];
        });
    const relationshipsByFrom = new Map(Object.entries(_.groupBy(relationshipsWithNoCycles, r => r.from)));
    const relationshipsByTo = new Map(Object.entries(_.groupBy(relationshipsWithNoCycles, r => r.to)));

    const additionalNodes = _.uniqBy(
        _.flatMap(
            relationshipsWithNoCycles,
            r => [r.from, r.to].filter(id => !nodeIdSet.has(id)).map(id => ({ id, nodeType: "External",  type: `EXTERNAL: ${id}` }))
        )
    );
    const allNodes = nodes.concat(additionalNodes).map((n, i) => ({ flinkId: i, ...n }));
    const allNodesById = new Map(allNodes.map(n => [n.id, n]));
    const flinkNodes = allNodes
        .map(n => {
            let pact = n.nodeType;
            const hasIncomingEdge = relationshipsByTo.has(n.id);
            const hasOutgoingEdge = relationshipsByFrom.has(n.id);
            if (hasIncomingEdge === hasOutgoingEdge) {
                pact = n.nodeType
            } else if (hasIncomingEdge) {
                pact = "Data Sink"
            } else if (hasOutgoingEdge) {
                pact = "Data Source"
            }
            return { 
                ...n,
                // replacing the id
                id: n.flinkId,
                kewlId: n.id,
                // a few more fields
                pact,
                contents: n.type,
                // parallelism: 15,
                // predecessors
                predecessors: (relationshipsByTo.get(n.id) || [])
                    .map(r => ({ id: allNodesById.get(r.from).flinkId, ship_strategy: r.type, side: "second" }))
            };
        });

    // topological ordering
    function getNodesWithNoIncomingEdgesFrom(nodes, excludingIncomingEdgesFromIds) {
        return nodes.filter(n => !excludingIncomingEdgesFromIds.has(n.id) &&  n.predecessors.every(p => excludingIncomingEdgesFromIds.has(p.id)));
    }
    let orderedFlinkNodes = [];
    const currentBeforeNodeIds = new Set();
    while (orderedFlinkNodes.length < flinkNodes.length) {
        const nextNodes = getNodesWithNoIncomingEdgesFrom(flinkNodes, currentBeforeNodeIds);
        if (nextNodes.length === 0) {
            console.error("Cycle in the following nodes: ", flinkNodes.filter(n => !currentBeforeNodeIds.has(n.id)));
            break;
        }
        orderedFlinkNodes.push(...nextNodes);
        nextNodes.forEach(n => currentBeforeNodeIds.add(n.id));
    }

    return JSON.stringify({ nodes: orderedFlinkNodes });
}

export function generateFlinkVisualizerJsonFor(kafkaClusterId, topologyFilter) {
    getResolvedDeployedTopologiesFor(kafkaClusterId, topologyFilter).then(generateFlinkVisualizerJson)
}