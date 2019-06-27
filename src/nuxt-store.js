import jsonaStore from './store';

function findDefinedStore (nuxtStore) {
  if (nuxtStore.$axios) {
    return nuxtStore.$axios;
  }
  if (nuxtStore.$http) {
    return nuxtStore.$http;
  }
  throw new Error('Can\'t find http module. Please enable it or provide "httpClient"');
}

export default function nuxtJsonaStore (resource, storeConfig) {
  const store = jsonaStore(resource, {
    httpClient: findDefinedStore,
    ...storeConfig
  });

  store.state = () => ({ ...store.state });

  return store;
};
