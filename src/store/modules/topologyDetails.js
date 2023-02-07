import kafkakewlApi from "../../api/kafkakewl.js";

const store = {
    namespaced: true,
    state: {
        topology: { metadata: {}, topics: {}, applications: {}, relationships: {} },
        highlights: {node: undefined, edge: undefined}
    },
    getters: {
    },
    mutations: {
        setTopology(state, topologyResponse) {
            let topology = topologyResponse.entity;
            topology.topologyId = topologyResponse.metadata.id;
            topology.metadata = topologyResponse.metadata;
            state.topology = topology;
        },
        setHighlights(state, highlights) {
          state.highlights = {...highlights}
        }
    },
    actions: {
        getTopology({ commit }, { topologyId }) {
            return kafkakewlApi
                .getTopology(topologyId)
                .then(data => commit("setTopology", data.Succeeded.response.topology));
        },
        setHighlights({ commit }, highlights) {
            return new Promise(() =>  commit("setHighlights", highlights))
        }

    }
  }


export default store;
