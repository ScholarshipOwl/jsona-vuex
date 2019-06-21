import Vue from 'vue';
import Vuex from 'vuex';
import deepmerge from 'deepmerge';
import { Jsona } from 'jsona';
import itemStore, {
  SET_ITEM
} from './item-store';

Vue.use(Vuex);

const testItemRaw = {
  data: {
    id: '1',
    type: 'test',
    attributes: {
      title: 'Test attribute'
    }
  }
};

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
    const jsona = new Jsona();
    let httpClient;
    let store;

    beforeEach(() => {
      httpClient = {
        get: jest.fn(),
        post: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn()
      };
      store = new Vuex.Store({
        ...itemStore({
          resource: 'test',
          httpClient
        })
      });
    });

    it('fail when id not provided', () => {
      expect(() => store.dispatch('load')).toThrow(Error);
    });

    it('load simple item', (done) => {
      httpClient.get.mockResolvedValue({
        data: testItemRaw
      });

      expect(store.getters.item).toBe(null);
      expect(store.state.item).toBe(null);

      store.dispatch('load', { id: 1 })
        .then(item => {
          expect(item.id).toBe('1');
          expect(item.type).toBe('test');
          expect(item.title).toBe('Test attribute');
          expect(store.state.item).toBe(item);
          expect(store.getters.item).toBe(item);
          expect(store.getters.loading).toBe(false);
          expect(httpClient.get).toHaveBeenCalledWith('test/1', {});
          done();
        });
    });

    it('create item', (done) => {
      const sendData = deepmerge(testItemRaw, { data: { id: null } });
      const item = jsona.deserialize(sendData);

      httpClient.post.mockResolvedValue({ data: testItemRaw });

      store.dispatch('save', { item })
        .then(item => {
          expect(item.id).toBe('1');
          expect(item.type).toBe('test');
          expect(item.title).toBe('Test attribute');
          expect(store.state.item).toBe(item);
          expect(store.getters.item).toBe(item);
          expect(httpClient.post).toHaveBeenCalledWith('test', sendData, {});
          done();
        });
    });

    it('update item', (done) => {
      const item = jsona.deserialize(testItemRaw);
      const expectedData = deepmerge(testItemRaw, {
        data: {
          attributes: {
            title: 'Changed value'
          }
        }
      });

      httpClient.patch.mockResolvedValue({ data: expectedData });

      store.commit(SET_ITEM, item);

      item.title = 'Changed value';

      store.dispatch('save')
        .then(newItem => {
          expect(newItem.id).toBe('1');
          expect(newItem.type).toBe('test');
          expect(newItem.title).toBe('Changed value');
          expect(store.state.item).toBe(newItem);
          expect(store.getters.item).toBe(newItem);
          expect(item).not.toBe(newItem);
          expect(httpClient.patch).toHaveBeenCalledWith('test/1', expectedData, {});
          done();
        });
    });

    it('delete item', (done) => {
      const item = jsona.deserialize(testItemRaw);

      store.commit(SET_ITEM, item);

      httpClient.delete.mockResolvedValue({});

      store.dispatch('delete')
        .then(respItem => {
          expect(respItem).toBe(item);
          expect(store.state.item).toBe(null);
          expect(httpClient.delete).toHaveBeenCalledWith('test/1', {});
          done();
        });
    });
  });
});
