import Vue from 'vue';
import Vuex from 'vuex';
import nuxtJsonaStore from './nuxt-store';

Vue.use(Vuex);

describe('nuxt store', () => {
  it('test fail initilization', () => {
    const store = new Vuex.Store(nuxtJsonaStore('test'));
    expect(() => store.dispatch('load')).toThrow(Error);
  });
  it('initialize with $http', (done) => {
    const store = new Vuex.Store(nuxtJsonaStore('test'));
    store.$http = {
      get: jest.fn().mockResolvedValue({ data: {} })
    };

    store.dispatch('load').then(done);
  });
  it('initialize with $axios', (done) => {
    const store = new Vuex.Store(nuxtJsonaStore('test'));
    store.$axios = {
      get: jest.fn().mockResolvedValue({ data: {} })
    };

    store.dispatch('load').then(done);
  });
});
