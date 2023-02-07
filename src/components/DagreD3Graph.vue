<template>
  <div>
    <svg id="svg-dagred3-graph-canvas" width="100%" height="100%" />
  </div>
</template>

<script>
import _ from "lodash";
import dagreD3 from "dagre-d3";
import * as d3 from 'd3'
import d3tip from "d3-tip";

function bound(min, max, value) {
  return Math.max(min || Number.MIN_SAFE_INTEGER, Math.min(max || Number.MAX_SAFE_INTEGER, value));
}

function boundNonNegative(min, max, value) {
  return bound(min || 0, max, value);
}

function diffItems(items1, items2, getUniqueIdFunc = (i => i.uniqueId)) {
  const items1UniqueIds = items1.map(i => [getUniqueIdFunc(i), i]);
  const items2UniqueIds = items2.map(i => [getUniqueIdFunc(i), i]);
  const items1ByUniqueId = new Map(items1UniqueIds);
  const items2ByUniqueId = new Map(items2UniqueIds);
  const onlyInItems1 = items1.filter(i => !items2ByUniqueId.has(getUniqueIdFunc(i)));
  const onlyInItems2 = items2.filter(i => !items1ByUniqueId.has(getUniqueIdFunc(i)));
  const differences = items1UniqueIds.map(i => i[0]).filter(k => items2ByUniqueId.has(k))
      .map(k => {
        const item1 = items1ByUniqueId.get(k);
        const item2 = items2ByUniqueId.get(k);
        return [item1, item2];
      })
      .filter(([item1, item2]) => !_.isEqual(item1, item2));
  const sameUniqueIds = onlyInItems1.length === 0 && onlyInItems2.length === 0;
  const noDifferences = differences.length === 0;

  return {
    onlyInItems1,
    onlyInItems2,
    differences,
    sameUniqueIds,
    areIdentical: sameUniqueIds && noDifferences,
  };
}

function createEdgeLabelTextContent(labelString, totalLag, totalPerSecond, status) {
  function createRateLabel(messagesPerSecond) {
    if (messagesPerSecond !== undefined && !isNaN(messagesPerSecond)) {
      return messagesPerSecond < 0.9 && messagesPerSecond > 0.0 ? `${round(messagesPerSecond * 60.0)} / min` : `${round(messagesPerSecond)} / sec`;
    } else {
      return `? / sec`;
    }
  }
  let consumptionRate =  totalPerSecond !== undefined ? createRateLabel(totalPerSecond): undefined
  let lagInfo =  totalLag !== undefined ? `(${totalLag} lag)` : undefined

  return [labelString, consumptionRate, lagInfo, status].filter(t => t !== undefined).join(" ");
}

function updateEdgeLabelSvg(labelSvg, labelString, totalLag, totalConsumedPerSecond, status) {
  d3.select(labelSvg).select("tspan").text(createEdgeLabelTextContent(labelString, totalLag, totalConsumedPerSecond, status));
}

function createEdgeLabelSvg(labelString, totalLag, totalConsumedPerSecond, status) {
  if (labelString) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "text");
    svg.setAttribute("class", "custom-svg")
    const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
    tspan.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve");
    tspan.setAttribute("dy", "1em");
    tspan.setAttribute("x", "1");
    tspan.textContent = createEdgeLabelTextContent(labelString, totalLag, totalConsumedPerSecond, status);
    svg.appendChild(tspan);
    return svg;
  } else {
    return undefined;
  }
}

function removeEdgeLabelProperties(e) {
  return {...e, label: undefined, labelString: undefined, totalLag: undefined, totalConsumedPerSecond: undefined, status: undefined};
}

function round(n) {
    return Math.ceil(n * 1000) / 1000.0;
}

function createNodeLabelMessagesPerSecondTextContent(node) {
  const messagesPerSecond = node.topicMetrics && node.topicMetrics.metrics && node.topicMetrics.metrics.incomingMessagesPerSecond;
  if (messagesPerSecond !== undefined) {
    return messagesPerSecond < 0.9 && messagesPerSecond != 0.0 ? `received: ${round(messagesPerSecond * 60.0)} / min` : `received: ${round(messagesPerSecond)} / sec`;
  } else {
    return `received: ? / sec`;
  }
}

function createTopicNodeLabelSvg(node) {
  if (node) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "text");
    const tspan1 = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
    tspan1.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve");
    tspan1.setAttribute("class", "node-topic-id")
    tspan1.setAttribute("dy", "1em");
    tspan1.setAttribute("x", "1");
    tspan1.textContent = node.nodeId;
    svg.appendChild(tspan1);

    const tspan2 = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
    tspan2.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve");
    tspan2.setAttribute("class", "node-topic-messagesPerSecond")
    tspan2.setAttribute("dy", "1.5em");
    tspan2.setAttribute("x", "1");
    tspan2.textContent = createNodeLabelMessagesPerSecondTextContent(node);
    svg.appendChild(tspan2);
    return svg;
  } else {
    return undefined;
  }
}

function updateNodeLabelSvg(g, node) {
  d3.select(g).select("tspan.node-topic-messagesPerSecond").text(createNodeLabelMessagesPerSecondTextContent(node));
}

function removeNodeLabelProperties(n) {
  return {...n, label: undefined, topicMetrics: undefined};
}

export default {
  name: "DagreD3Graph",
  props: {
    fitToContent: { type: Boolean, default: false } ,
    minWidth: Number,
    minHeight: Number,
    maxWidth: Number,
    maxHeight: Number,
    minZoomFactor: { type: Number, default: 0.5 },
    optionalZoomFactor: { type: Number, default: 1.0 },
    maxZoomFactor: { type: Number, default: 1.0 },
    graphAttrs: Object,
    graph: Object,
  },
  data() {
    return {
      dagreRender: new dagreD3.render(),
      dagreGraph: null,
      svg: null,
      svgGroup: null,
      actualGraphAttrs: {},
      zoom: null,
      nodeTip: null,
      edgeTip: null
    }
  },
  computed: {
    nodes() {
      return (this.graph && this.graph.nodes) || [];
    },
    edges() {
      return (this.graph && this.graph.edges) || [];
    },
  },
  methods: {
    getNodeById(id) {
      return this.nodes.find(n => n.id === id);
    },
    renderGraph() {
      this.dagreRender(d3.select(this.$el).select("svg g"), this.dagreGraph);
      // setting up the tooltip for the nodes
      let nodeTip = this.nodeTip
      let store = this.$store
      this.svgGroup.selectAll('.node rect')
        .on('mouseover', function(d){ 
          let id = parseInt(d)
          nodeTip.show(d, this); 
          store.dispatch("topologyDetails/setHighlights", {node: id});
        })
        .on('mouseout', (d) => { 
          this.nodeTip.hide(d); 
          store.dispatch("topologyDetails/setHighlights", {node: undefined});
        });
      // setting up the tooltip for the edges
      let edgeTip = this.edgeTip
      this.svgGroup.selectAll('.edgeLabel')
        .on('mouseover', function(d){
          edgeTip.show(d, this); 
          store.dispatch("topologyDetails/setHighlights", {edge: {v: parseInt(d.v), w: parseInt(d.w)}});
        })
        .on('mouseout', (d) => { 
          this.edgeTip.hide(d); 
          store.dispatch("topologyDetails/setHighlights", {edge: undefined});
        });
    },
    prepareEdges(edges) {
      return edges.map(e => ({...e, label: createEdgeLabelSvg(e.labelString, e.totalLag, e.totalConsumedPerSecond, e.status), labelType: "svg"}));
    },
    prepareNodes(nodes) {
      return nodes.map(n => {
        if (n.isTopic && n.nodeId) {
          return {...n, label: createTopicNodeLabelSvg(n), labelType: "svg"};
        } else {
          return n;
        }
      });
    },
    updateGraphNodes(changedNodes) {
      const [newNodesWithNonLabelChanges, newNodesWithLabelChanges] = _.partition(
        changedNodes,
        ([newNode, oldNode]) => !_.isEqual(removeNodeLabelProperties(newNode), removeNodeLabelProperties(oldNode))
      );
      if (newNodesWithNonLabelChanges.length > 0) {
        // there are changes which impact
        console.log("updateGraphNodes: changedNodes (non-label) =", newNodesWithNonLabelChanges);
        this.prepareNodes(newNodesWithNonLabelChanges.map(([n,]) => n)).forEach(n => this.dagreGraph.setNode(n.id, {...n}));
        this.renderGraph();
      }
      if (newNodesWithLabelChanges.length > 0) {
        console.log("updateGraphNodes: changedNodes (label) =", newNodesWithLabelChanges);
        newNodesWithLabelChanges.forEach(([n,]) => {
          const dagreNode = this.dagreGraph.node(n.id);
          updateNodeLabelSvg(dagreNode.elem, n);
        });
      }
    },
    updateGraphEdges(changedEdges) {
      const [newEdgesWithNonLabelChanges, newEdgesWithLabelChanges] = _.partition(
        changedEdges, 
        ([newEdge, oldEdge]) => !_.isEqual(removeEdgeLabelProperties(newEdge), removeEdgeLabelProperties(oldEdge))
      );
      if (newEdgesWithNonLabelChanges.length > 0) {
        // there are changes which impact
        console.log("updateGraphEdges: changedEdges (non-label) =", newEdgesWithNonLabelChanges);
        this.prepareEdges(newEdgesWithNonLabelChanges.map(([e, _]) => e)).forEach(e => this.dagreGraph.setEdge(e.from, e.to, {...e}));
        this.renderGraph();
      }
      if (newEdgesWithLabelChanges.length > 0) {
        console.log("updateGraphEdges: changedEdges (label) =", newEdgesWithLabelChanges);
        newEdgesWithLabelChanges.forEach(([e, _]) => {
          const dagreEdge = this.dagreGraph.edge(e.from, e.to);
          updateEdgeLabelSvg(dagreEdge.label, e.labelString, e.totalLag, e.status);
        });
      }
    },
    createGraph(graphAttrsOverrides = {}) {
      console.log("createGraph: graphAttrsOverrides= ", graphAttrsOverrides);
      const graphAttrs = { ...this.graphAttrs, ...graphAttrsOverrides };
      this.dagreGraph = new dagreD3.graphlib.Graph()
        .setGraph(graphAttrs)
        .setDefaultEdgeLabel(() => ({}));

      // copying nodes and edges for dagred3 graphlib, so that it doesn't modify (add its properties) to our original ones => we can diff the original with updates!
      this.prepareNodes(this.nodes).forEach(n => this.dagreGraph.setNode(n.id, {...n}));
      this.prepareEdges(this.edges).forEach(e => this.dagreGraph.setEdge(e.from, e.to, e));
      this.renderGraph();

      let svgWidth = parseInt(this.svg.style("width").replace(/px/, ""));
      let svgHeight = parseInt(this.svg.style("height").replace(/px/, ""));
      console.log("createGraph: svg: width =", svgWidth, "svg height =", svgHeight);

      if (this.nodes.length > 0 || this.edges.length > 0) {
        // only if it's not empty (otherwise the width and height would be infinite)

        const graphPaddingX = 40;
        const graphPaddingY = 20;
        const graphWidth = this.dagreGraph.graph().width + graphPaddingX * 2;
        const graphHeight = this.dagreGraph.graph().height + graphPaddingY * 2;
        const graphWidthHeightRatio = graphWidth / graphHeight;
        console.log("createGraph: graph: width =", graphWidth, "height =", graphHeight, "ratio =", graphWidthHeightRatio);

        // choosing the smaller zoom factor so that it fits both x and y directions
        const zoomFactor = Math.min(svgWidth / graphWidth, svgHeight / graphHeight);
        console.log("createGraph: zoomFactor = ", zoomFactor);

        // constraining the zoom factor between minZoomFactor and maxZoomFactor
        let zoomFactorBounded = boundNonNegative(this.minZoomFactor, this.maxZoomFactor, zoomFactor);
        console.log("createGraph: createGraph: zoomScaleBounded = ", zoomFactorBounded);

        const actualGraphWidth = graphWidth * zoomFactorBounded;
        const actualGraphHeight = graphHeight * zoomFactorBounded;
        const actualGraphWidthHeightRatio = actualGraphWidth / actualGraphHeight;

        console.log("createGraph: actual graph: width =", actualGraphWidth, "height =", actualGraphHeight, "ratio =", actualGraphWidthHeightRatio);
        if (this.graphAttrs && this.graphAttrs.rankdir_dimension_threshold && this.graphAttrs.rankdir_if_above_threshold) {
          // if the graph too small and AND it's wider than the threshold
          // TODO hack, it shouldn't be hardcoded, should the whole layout and fit-to-content rethought
          if (zoomFactorBounded <= 0.5 && actualGraphWidthHeightRatio > this.graphAttrs.rankdir_dimension_threshold) {
            // we try another rankdir
            console.log("createGraph: actual graph: dimension ratio ", actualGraphWidthHeightRatio, " above threshold ", this.graphAttrs.rankdir_dimension_threshold, "changing rankdir to ", this.graphAttrs.rankdir_if_above_threshold);
            return this.createGraph({ rankdir: this.graphAttrs.rankdir_if_above_threshold });
          }
        }

        if (this.fitToContent) {
          // we try to set the svg size according to the content - with taking the minWidth, maxWidth, minHeight and maxHeight into account (if they are defined) as well as the minZoomFactor and maxZoomFactor.

          if (this.optionalZoomFactor) {
            const optionalZoomFactorBounded = boundNonNegative(this.minZoomFactor, this.maxZoomFactor, this.optionalZoomFactor);
            console.log("createGraph: optionalZoomFactorBounded =", optionalZoomFactorBounded);
            if (optionalZoomFactorBounded !== zoomFactor) {
              // simplification: let's try the optimal zoom factor, and then bound to the min/max sizes (not optimal solution, but good enough for now)
              // in reality a linear optimization could work here to satisfy all constraints and optimize for the minimal difference between optimal and actual zoom factor
              const optimalGraphWidth = graphWidth * optionalZoomFactorBounded;
              const optimalGraphHeight = graphHeight * optionalZoomFactorBounded;
              console.log("createGraph: optimalGraph: width =", optimalGraphWidth, "height = ", optimalGraphHeight);
              const optimalGraphWidthBounded = bound(this.minWidth || svgWidth, this.maxWidth || svgWidth, optimalGraphWidth);
              const optimalGraphHeightBounded = bound(this.minHeight || svgHeight, this.maxHeight || svgHeight, optimalGraphHeight);
              console.log("createGraph: optimalGraphBounded width =", optimalGraphWidthBounded, "height = ", optimalGraphHeightBounded);

              if (svgWidth !== optimalGraphWidthBounded) {
                svgWidth = optimalGraphWidthBounded;
                console.log("createGraph: svg width updated ", svgWidth);
                this.svg.attr("width", svgWidth);
              }
              if (svgHeight !== optimalGraphHeightBounded) {
                svgHeight = optimalGraphHeightBounded;
                console.log("createGraph: svg height updated ", svgHeight);
                this.svg.attr("height", svgHeight);
              }

              zoomFactorBounded = boundNonNegative(this.minZoomFactor, this.maxZoomFactor, Math.min(svgWidth / graphWidth, svgHeight / graphHeight));
              console.log("createGraph: zoomScaleBounded after fit-to-content = ", zoomFactorBounded);
            }
          }
        } else {
          // the svg size is given, we try to display the graph with the minZoomFactor and maxZoomFactor constraints.
        }

        console.log("createGraph: final graph: width =", graphWidth, "height =", graphHeight, "ratio =", graphWidth / graphHeight);

        // zoom
        const translateX = Math.max(0, (svgWidth / 2) - ((graphWidth * zoomFactorBounded) / 2)) + graphPaddingX;
        const translateY = Math.max(0, (svgHeight / 2) - ((graphHeight * zoomFactorBounded) / 2)) + graphPaddingY;
        const isUpdate = false;
        const svgZoom = isUpdate ? this.svg.transition().duration(500) : this.svg;
        svgZoom.call(this.zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(zoomFactorBounded));
      }

      // finally set the actual graphAttrs
      this.actualGraphAttrs = graphAttrs;
      this.$emit('actualRankdirChanged', this.actualGraphAttrs.rankdir);
    }
  },
  watch: {
    graph: function(newGraph, oldGraph) {
      if (newGraph.nodes.find(e => !e.uniqueId)) console.error("DagreD3Graph.graph-watch: all nodes must have a unique id attribute");
      if (newGraph.edges.find(e => !e.uniqueId)) console.error("DagreD3Graph.graph-watch: all edges must have a unique id attribute");
      const nodesDiff = diffItems(newGraph.nodes, oldGraph.nodes);
      const edgesDiff = diffItems(newGraph.edges, oldGraph.edges);
      if (!nodesDiff.areIdentical || !edgesDiff.areIdentical) {
        // the new graph is different in some way
        console.log("DagreD3Graph.graph-watch: ", newGraph, oldGraph);
        if (nodesDiff.sameUniqueIds && edgesDiff.sameUniqueIds)  {
          // the new graph has the exact same node ids and edge ids (meaning, the layout can remain, we just need to update those nodes/edges)
          // the edges have differences => we can update, no need to re-generate the whole graph
          if (!edgesDiff.areIdentical) this.updateGraphEdges(edgesDiff.differences);
          if (!nodesDiff.areIdentical) this.updateGraphNodes(nodesDiff.differences);
        } else {
          // new/removed nodes or edges, let's just re-create everything
          this.createGraph();
        }
      }
    }
  },
  mounted() {
    this.svg = d3.select(this.$el).select("#svg-dagred3-graph-canvas");
    this.svgGroup = this.svg.append("g");

    // setting up the zoom
    this.zoom = d3.zoom().on("zoom", () => {
      this.svgGroup.attr("transform", d3.event.transform);
    });
    this.svg.call(this.zoom);

    // setting up the tooltip for nodes
    this.nodeTip = d3tip()
      .html(d => {
        
        const node = this.getNodeById(parseInt(d));
        const nodeTooltip = node.tooltipHtml || node.tooltip;
        return nodeTooltip && `<div class="dagre-d3-tip">${nodeTooltip}</div>`;
      })
      .direction("se")
      .offset([-10, -10]);
    this.svgGroup.call(this.nodeTip);

    // setting up the tooltip for edges
    this.edgeTip = d3tip()
      .html(d => {
        const edge = this.dagreGraph.edge(d.v, d.w);
        if (!edge || !edge.partitions || edge.totalLag === 0) {
          return undefined;
        }

        return (
          `<div class="dagre-d3-tip">` +
            `<div class="row row-auto">
            <div class="col-4 col-auto q-pr-sm" style="text-align: right">partition</div>
            <div class="col-4 col-auto" style="text-align: right">msg/sec</div>
            <div class="col-4 col-auto" style="text-align: right">lag</div>
            
          </div>` +
            edge.partitions
              .filter(p => p.lag > 0)
              .map(p =>
              `<div class="row row-auto">
                <div class="col-4 col-auto q-pr-sm" style="text-align: right">${p.partition}</div>
                <div class="col-4 col-auto" style="text-align: right">${p.consumedPerSecond ? round(p.consumedPerSecond): `?`}</div>
                <div class="col-4 col-auto" style="text-align: right">${p.lag}</div>
              </div>`)
              .join('\n') +
          `</div>`);
      })
      .direction("se")
      .offset([-10, -10]);
    this.svgGroup.call(this.edgeTip);

    // the initial graph
    this.createGraph();
  },
  beforeDestroy() {
    this.nodeTip.hide();
    this.edgeTip.hide();
  },
};
</script>

<style>
.node text,
.edgeLabel text,
.node-topic-id
{
  font-weight: 300;
  font-size: 14px;
}
.node text,
.node-topic-id
{
  pointer-events: none;
}
.node-topic-messagesPerSecond
{
  font-weight: 300;
  font-size: 10px;
  pointer-events: none;
}
.node rect {
  stroke: #999;
  fill: #fff;
  stroke-width: 1.5px;
  rx: 5;
  ry: 5;
}
.dagre-d3-tip {
  line-height: 1;
  font-size: 14px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  border-radius: 2px;
}
.edgePath path {
  stroke: #333;
  stroke-width: 1.5px;
}
</style>;