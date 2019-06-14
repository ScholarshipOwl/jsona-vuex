import { Jsona } from 'jsona';

export const SET_ITEM = 'SET_ITEM';

export default (opts) => {
  verifyOptions(opts);
  const config = mergeWithDefaultConfig(opts);
  const { httpClient } = config;

  const state = initialState(config);

  const mutations = {
    [SET_ITEM]: (state, item) => {
      state.item = item;
    }
  };

  const actions = {
    load (ctx, id) {
      const path = buildPath(id, config);

      return httpClient
        .get(path)
        .then(({ data }) => {
          const item = config.jsona.deserialize(data);
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
  let basePath = `${config.resource}/${id}`;

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
