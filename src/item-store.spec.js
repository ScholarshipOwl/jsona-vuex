import Vue from 'vue';
import Vuex from 'vuex';
import itemStore from './item-store';

Vue.use(Vuex);

describe('Item store', () => {
  describe('verify error cases', () => {
    it('fail if httpClient not provided', () => {
      expect(() => itemStore()).toThrow(Error);
    });

    it('fail if resource not provided', () => {
      expect(() => itemStore({ httpClient: {} })).toThrow(Error);
    });
  });

  describe('load item', () => {
    let httpClient;
    let store;

    beforeEach(() => {
      httpClient = {
        get: jest.fn()
      };
      store = new Vuex.Store({
        ...itemStore({
          resource: 'test',
          httpClient
        })
      });
    });

    it('load simple item', (done) => {
      httpClient.get.mockResolvedValue({
        data: {
          data: {
            id: '1',
            type: 'test',
            attributes: {
              title: 'Test attribute'
            }
          }
        }
      });

      expect(store.getters.item).toBe(null);
      expect(store.state.item).toBe(null);

      store.dispatch('load', 1)
        .then(item => {
          expect(item.id).toBe('1');
          expect(item.type).toBe('test');
          expect(item.title).toBe('Test attribute');
          expect(store.state.item).toBe(item);
          expect(store.getters.item).toBe(item);
          done();
        });
    });
  });
});
