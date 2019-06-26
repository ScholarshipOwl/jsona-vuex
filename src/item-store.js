import { Jsona } from 'jsona';

export const SET_ITEM = 'SET_ITEM';
export const SET_LOADING = 'SET_LOADING';

const defaultConfig = {
  /**
   * Jsona object
   * @type {object}
   */
  jsona: new Jsona(),
  /**
   * Include names used for Jsona serialization
   * @type {Array}
   */
  includeNames: [],
  /**
   * HTTP method will be used for sending update requests
   * @type {String}
   */
  updateMethod: 'patch',
  /**
   * HTTP Client that will be used to send requests
   * @type {Object|Function}
   */
  httpClient: null,
  /**
   * HTTP client configurations send with each request.
   * @type {Object}
   */
  httpConfig: {},
  /**
   * Default item object to be set on store
   * @type {Object}
   */
  item: null
};

export default (storeConfig) => {
  const config = { ...defaultConfig, ...storeConfig };
  const { httpClient, jsona, resource } = config;

  if (!httpClient) {
    throw new Error('"httpClient" must be set to initiate store.');
  }

  if (!resource) {
    throw new Error('"resource" must be set to initiate store.');
  }

  // Allow provide httpClient as a function that will be generated depend on context.
  function getHttpClient (store, ctx) {
    return typeof config.httpClient === 'function' ? config.httpClient(store, ctx) : config.httpClient;
  };

  const state = {
    item: config.item,
    loading: false
  };

  const mutations = {
    [SET_ITEM]: (state, item) => {
      state.item = item;
    },
    [SET_LOADING]: (state, isLoading) => {
      state.loading = !!isLoading;
    }
  };

  const actions = {
    /**
     * Load resource by id.
     *
     * @param {object|string|integer}   options             Request configurations.
     * @param {object}                  options.id          ID of item to be loaded
     * @param {object}                  options.httpConfig  HTTP config.
     *
     * @return {Promise}  Promise that resolves the model.
     */
    load (ctx, options) {
      if (!options || typeof options.id === 'undefined') {
        throw new Error('"id" for load is not set.');
      }

      const path = `${resource}/${options.id}`;
      const httpConfig = { ...config.httpConfig, ...options.httpConfig };

      ctx.commit(SET_LOADING, true);

      return getHttpClient(this, ctx).get(path, httpConfig)
        .finally(() => ctx.commit(SET_LOADING, false))
        .then(({ data }) => {
          const item = jsona.deserialize(data);
          ctx.commit(SET_ITEM, item);
          return item;
        });
    },
    /**
     * Save (create or update) current resource item.
     *
     * @param {object}  options               Request configurations.
     * @param {object}  options.item          Jsona model item to send with the request.
     * @param {object}  options.form          Data object that will be send instead of item.
     * @param {string}  options.method        Ovveride HTTP method.
     * @param {object}  options.httpConfig    HTTP config.
     * @param {object}  options.includeNames  Include object in serialization
     *
     * @return {Promise}  Promise that resolved with model with new data.
     */
    save (ctx, options = {}) {
      const item = options.item || ctx.state.item;
      const method = options.method || (item.id ? config.updateMethod : 'post');
      const includeNames = options.includeNames || config.includeNames;

      const path = `${resource}${item.id ? '/' + item.id : ''}`;
      const httpConfig = { ...config.httpConfig, ...options.httpConfig };
      const data = options.form || jsona.serialize({ stuff: item, includeNames });

      ctx.commit(SET_LOADING, true);

      return getHttpClient(this, ctx)[method](path, data, httpConfig)
        .finally(() => ctx.commit(SET_LOADING, false))
        .then(({ data }) => {
          const item = jsona.deserialize(data);
          ctx.commit(SET_ITEM, item);
          return item;
        });
    },
    /**
     * Delete current resource item
     *
     * @param {object} options              Request configurations
     * @param {object} options.httpConfig   HTTP config.
     *
     * @return {Promise}  Promise that resolved with deleted item.
     */
    delete (ctx, options = {}) {
      const item = ctx.state.item;
      const path = `${resource}/${item.id}`;
      const httpConfig = { ...config.httpConfig, ...options.httpConfig };

      ctx.commit(SET_LOADING, true);

      return getHttpClient(this, ctx).delete(path, httpConfig)
        .finally(() => ctx.commit(SET_LOADING, false))
        .then(() => {
          ctx.commit(SET_ITEM, null);
          return item;
        });
    }
  };

  const getters = {
    item: ({ item }) => item,
    loading: ({ loading }) => loading
  };

  return {
    state,
    mutations,
    actions,
    getters
  };
};
