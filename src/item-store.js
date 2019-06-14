import { Jsona } from 'jsona';

export const SET_ITEM = 'SET_ITEM';

export default (opts) => {
  verifyOptions(opts);
  const config = mergeWithDefaultConfig(opts);

  const state = initialState(config);

  const mutations = {
    [SET_ITEM]: (state, item) => {
      state.item = item;
    }
  };

  const actions = {
    /**
     * Load resource by id.
     *
     * @param  {string|integer} id  Resource id
     *
     * @return {Promise}  Promise that resolves the model.
     */
    load (ctx, id) {
      const path = buildPath(id, config);
      const { httpClient, jsona } = config;

      return httpClient.get(path)
        .then(({ data }) => {
          const item = jsona.deserialize(data);
          ctx.commit(SET_ITEM, item);
          return item;
        });
    },
    /**
     * Save (create or update) current resource item.
     *
     * @param {object}  options         Request configurations.
     * @param {object}  options.item    Jsona model item to send with the request.
     * @param {object}  options.form    Data object that will be send instead of item.
     * @param {string}  options.method  Ovveride HTTP method.
     * @param {object}  options.http    HTTP config.
     *
     * @return {Promise}  Promise that resolves the model.
     */
    save (ctx, options = {}) {
      const { httpClient, jsona, updateMethod = 'patch' } = config;
      const item = options.item || ctx.state.item;
      const data = options.form || jsona.serialize({ stuff: item });
      const method = options.method || (item.id ? updateMethod : 'post');
      const url = buildPath(item.id, config);

      return httpClient[method](url, data, options.http || {})
        .then(({ data }) => {
          const item = jsona.deserialize(data);
          ctx.commit(SET_ITEM, item);
          return item;
        });
    }
  };

  const getters = {
    item: ({ item }) => item
  };

  return {
    state,
    mutations,
    actions,
    getters
  };
};

/**
 * Generate initial state.
 */
const initialState = (config) => {
  return {
    item: null
  };
};

/**
 * Build URL path to the resource.
 */
const buildPath = (id, config) => {
  let basePath = `${config.resource}`;

  if (id) {
    basePath += `/${id}`;
  }

  return basePath;
};

/**
 * Verify that provided options for create store has everything we need.
 */
const verifyOptions = (options) => {
  const needKeys = [
    'resource',
    'httpClient'
  ];

  needKeys.forEach((k) => {
    if (!options[k]) {
      throw new Error(`${k} - config must be provided`);
    }
  });
};

/**
 * Merge provided options with default configurations.
 */
const mergeWithDefaultConfig = (options) => {
  const jsona = options.jsona || new Jsona();

  return {
    jsona,
    ...options
  };
};
