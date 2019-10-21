import Vue from 'vue';
import Vuex from 'vuex';
import deepmerge from 'deepmerge';
import { Jsona } from 'jsona';
import jsonaStore, {
  SET_ITEM,
  SET_COLLECTION
} from './store';

Vue.use(Vuex);

const jsona = new Jsona();

const testItemRaw = {
  data: {
    id: '1',
    type: 'test',
    attributes: {
      title: 'Test attribute'
    }
  }
};

const testCollectionRaw = {
  data: [
    {
      id: '1',
      type: 'test',
      attributes: {
        title: 'Test attribute 1'
      }
    },
    {
      id: '2',
      type: 'test',
      attributes: {
        title: 'Test attribute 2'
      }
    },
    {
      id: '3',
      type: 'test',
      attributes: {
        title: 'Test attribute 3'
      }
    }
  ]
};

describe('Store', () => {
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
      ...jsonaStore('test', {
        httpClient
      })
    });
  });

  describe('verify error cases', () => {
    it('fail if resource not provided', () => {
      expect(() => jsonaStore()).toThrow(Error);
    });

    it('fail if httpClient not provided', () => {
      expect(() => jsonaStore('test')).toThrow(Error);
    });
  });

  describe('store configurations', () => {
    it('provide httpClient as a function', (done) => {
      httpClient.get.mockResolvedValue({
        data: testItemRaw
      });

      store = new Vuex.Store({
        ...jsonaStore('test', {
          httpClient (str) {
            expect(str).toBe(store);
            return httpClient;
          }
        })
      });

      store.dispatch('load', { id: 1 })
        .then(item => {
          expect(item.id).toBe('1');
          done();
        });
    });
    it('provide resource as a function', (done) => {
      httpClient.get.mockResolvedValue({
        data: testItemRaw
      });

      store = new Vuex.Store({
        ...jsonaStore(() => {
          return 'test/1/related';
        }, {
          httpClient
        })
      });

      store.dispatch('load')
        .then(item => {
          expect(item.id).toBe('1');
          expect(httpClient.get).toHaveBeenCalledWith('test/1/related', {});
          done();
        });
    });
  });

  describe('item store actions', () => {
    it('load item', (done) => {
      httpClient.get.mockResolvedValue({
        data: testItemRaw
      });

      expect(store.getters.item).toBe(null);
      expect(store.state.item).toBe(null);

      store.dispatch('load', { id: 1 })
        .then(item => {
          expect(store.getters.loaded).toBe(true);
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

      store.commit(SET_ITEM, item);

      httpClient.post.mockResolvedValue({ data: testItemRaw });

      store.dispatch('create')
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

    it('create item from raw', (done) => {
      const form = {
        data: {
          type: 'test',
          attributes: {
            title: 'New item title'
          }
        }
      };

      httpClient.post.mockResolvedValue({ data: testItemRaw });

      store.dispatch('create', { form })
        .then(item => {
          expect(item.id).toBe('1');
          expect(item.type).toBe('test');
          expect(item.title).toBe('Test attribute');
          expect(store.state.item).toBe(item);
          expect(store.getters.item).toBe(item);
          expect(httpClient.post).toHaveBeenCalledWith('test', form, {});
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

      store.dispatch('update')
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

  describe('collection store actions', () => {
    it('load collection', (done) => {
      httpClient.get.mockResolvedValue({
        data: testCollectionRaw
      });

      expect(store.getters.collection).toBe(null);
      expect(store.state.collection).toBe(null);

      store.dispatch('load')
        .then(collection => {
          expect(Array.isArray(collection)).toBe(true);
          expect(store.state.collection).toBe(collection);
          expect(collection.length).toBe(3);
          expect(collection[1].title).toBe('Test attribute 2');
          expect(httpClient.get).toHaveBeenCalledWith('test', {});
          done();
        });
    });

    it('create collection item', (done) => {
      store.commit(SET_COLLECTION, jsona.deserialize(testCollectionRaw));

      const item = {
        type: 'test',
        title: 'New item title'
      };

      const postData = {
        data: {
          type: 'test',
          attributes: {
            title: item.title
          }
        }
      };

      httpClient.post.mockResolvedValue({
        data: {
          data: {
            id: '4',
            type: 'test',
            attributes: {
              title: item.title
            }
          }
        }
      });

      store.dispatch('create', { item })
        .then(newItem => {
          expect(newItem).not.toBe(item);
          expect(newItem.title).toBe('New item title');
          expect(store.state.collection.length).toBe(4);
          expect(store.state.collection.includes(newItem)).toBe(true);
          expect(httpClient.post).toHaveBeenCalledWith('test', postData, {});
          done();
        });
    });

    it('update collection item', (done) => {
      store.commit(SET_COLLECTION, jsona.deserialize(testCollectionRaw));

      const item = store.state.collection[2];
      item.title = 'Updated item title';

      const expectedData = {
        data: {
          id: '3',
          type: 'test',
          attributes: {
            title: item.title
          }
        }
      };

      httpClient.patch.mockResolvedValue({
        data: {
          data: {
            id: '3',
            type: 'test',
            attributes: {
              title: item.title
            }
          }
        }
      });

      store.dispatch('update', { item })
        .then(updatedItem => {
          expect(updatedItem).not.toBe(item);
          expect(updatedItem.title).toBe('Updated item title');
          expect(store.state.collection.length).toBe(3);
          expect(store.state.collection.includes(updatedItem)).toBe(true);
          expect(httpClient.patch).toHaveBeenCalledWith('test/3', expectedData, {});
          done();
        });
    });

    it('delete item from collection', (done) => {
      store.commit(SET_COLLECTION, jsona.deserialize(testCollectionRaw));

      const item = store.state.collection[0];

      httpClient.delete.mockResolvedValue({});

      store.dispatch('delete', { item })
        .then(deletedItem => {
          expect(deletedItem).toBe(item);
          expect(store.state.collection.length).toBe(2);
          expect(store.state.collection.includes(deletedItem)).toBe(false);
          expect(httpClient.delete).toHaveBeenCalledWith('test/1', {});
          done();
        });
    });
  });
});
