import defaultConfig from './config';

export const SET_ITEM = 'SET_ITEM';
export const SET_LOADING = 'SET_LOADING';
export const SET_LOADED = 'SET_LOADED';
export const SET_COLLECTION = 'SET_COLLECTION';
export const UPDATE_COLLECTION_ITEM = 'UPDATE_COLLECTION_ITEM';
export const DELETE_COLLECTION_ITEM = 'DELETE_COLLECTION_ITEM';

export default function jsonaStore (resource, storeConfig) {
  const config = {
    ...defaultConfig,
    ...storeConfig
  };

  if (!resource) {
    throw new Error('"resource" must be set to initiate store.');
  }

  if (!config.httpClient) {
    throw new Error('"httpClient" must be set to initiate store.');
  }

  const state = {
    item: null,
    collection: null,
    loading: false,
    loaded: false
  };

  const mutations = {
    [SET_COLLECTION]: (state, collection) => {
      state.collection = collection;
    },
    [SET_ITEM]: (state, item) => {
      state.item = item;
    },
    [SET_LOADING]: (state, isLoading) => {
      state.loading = !!isLoading;
    },
    [SET_LOADED]: (state, isLoaded) => {
      state.loaded = !!isLoaded;
    },
    [UPDATE_COLLECTION_ITEM]: (state, item) => {
      const index = state.collection.findIndex(({ id }) => id === item.id);
      if (index !== -1) {
        state.collection.splice(index, 1, item);
      } else {
        state.collection.push(item);
      }
    },
    [DELETE_COLLECTION_ITEM]: (state, item) => {
      state.collection = state.collection.filter(({ id }) => id !== item.id);
    }
  };

  function agrigateResponseData (data, { commit, state }) {
    const result = config.jsona.deserialize(data);

    if (Array.isArray(result)) {
      commit(SET_COLLECTION, result);
    } else if (state.collection) {
      commit(UPDATE_COLLECTION_ITEM, result);
    } else {
      commit(SET_ITEM, result);
    }

    commit(SET_LOADED, true);

    return result;
  }

  function buildHttpClient (store) {
    return typeof config.httpClient === 'function' ? config.httpClient(store) : config.httpClient;
  }

  function buildResourcePath (store) {
    return typeof resource === 'function' ? resource(store) : resource;
  }

  const actions = {
    /**
     * Load resource or all resources. Depends if "id" provided.
     *
     * @param {object|string|integer}   options             Request configurations.
     * @param {object}                  options.id          ID of item to be loaded
     * @param {object}                  options.httpConfig  HTTP config.
     *
     * @return {Promise}  Promise that resolves the model.
     */
    load (context, { id, httpConfig, reload = true } = {}) {
      if (!reload && context.state.loaded) {
        if (context.state.collection) {
          return Promise.resolve(context.state.collection);
        }
        if (!id || (context.state.item && context.state.item.id === id)) {
          return Promise.resolve(context.state.item);
        }
      }

      const path = `${buildResourcePath(this)}${id ? `/${id}` : ''}`;

      context.commit(SET_LOADING, true);

      if (!reload && context.state.loaded) {
        return Promise.resolve(context.state.item);
      }

      return buildHttpClient(this)
        .get(path, { ...config.httpConfig, ...httpConfig })
        .finally(() => context.commit(SET_LOADING, false))
        .then(({ data }) => agrigateResponseData(data, context));
    },
    /**
     * Create new resource
     *
     * @param {object}  options               Request configurations.
     * @param {object}  options.item          Jsona model item to send with the request.
     * @param {object}  options.form          Data object that will be send instead of item.
     * @param {object}  options.httpConfig    HTTP config.
     *
     * @return {Promise}  Promise with resolved new model.
     */
    create (context, { item, form, httpConfig } = {}) {
      const path = buildResourcePath(this);
      const createItem = item || context.state.item;
      const data = form || config.jsona.serialize({ stuff: createItem });

      context.commit(SET_LOADING, true);

      return buildHttpClient(this)
        .post(path, data, { ...config.httpConfig, ...httpConfig })
        .finally(() => context.commit(SET_LOADING, false))
        .then(({ data }) => agrigateResponseData(data, context));
    },
    /**
     * Save (create or update) current resource item.
     *
     * @param {object}  options               Request configurations.
     * @param {object}  options.item          Jsona model item to send with the request.
     * @param {object}  options.form          Data object that will be send instead of item.
     * @param {string}  options.method        Ovveride HTTP method.
     * @param {object}  options.httpConfig    HTTP config.
     *
     * @return {Promise}  Promise that resolved with model with new data.
     */
    update (context, { item, form, httpConfig, method } = {}) {
      const updateItem = item || context.state.item;
      const updateMethod = method || config.updateMethod;

      const path = `${buildResourcePath(this)}/${updateItem.id}`;
      const data = form || config.jsona.serialize({ stuff: updateItem });
      const params = { ...config.httpConfig, ...httpConfig };

      context.commit(SET_LOADING, true);

      return buildHttpClient(this)[updateMethod](path, data, params)
        .finally(() => context.commit(SET_LOADING, false))
        .then(({ data }) => agrigateResponseData(data, context));
    },
    /**
     * Delete current resource item
     *
     * @param {object} options              Request configurations
     * @param {object} options.httpConfig   Item that must be deleted.
     * @param {object} options.httpConfig   HTTP config.
     *
     * @return {Promise}  Promise that resolved with deleted item.
     */
    delete ({ commit, state }, { item, httpConfig } = {}) {
      const removeItem = item || state.item;
      const path = `${buildResourcePath(this)}/${removeItem.id}`;

      commit(SET_LOADING, true);

      return buildHttpClient(this)
        .delete(path, { ...config.httpConfig, ...httpConfig })
        .finally(() => commit(SET_LOADING, false))
        .then(() => {
          if (state.collection) {
            commit(DELETE_COLLECTION_ITEM, removeItem);
          } else {
            commit(SET_ITEM, null);
          }
          return removeItem;
        });
    }
  };

  const getters = {
    item: ({ item }) => item,
    collection: ({ collection }) => collection,
    loading: ({ loading }) => loading,
    loaded: ({ loaded }) => loaded
  };

  return {
    state,
    mutations,
    actions,
    getters
  };
};
