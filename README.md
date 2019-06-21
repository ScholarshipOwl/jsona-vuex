# jsona-vuex
Library for working with [jsona](https://github.com/olosegres/jsona) data formater.

## Item store

Basic store generation and usage.

```
import httpClient from 'axios';
import { itemStore } from 'jsona-vuex';

const store = new Vuex.Store(
  itemStore({
    resource: 'person',
    httpClient,
  })
);
```

### Load resource

You may load specific resource data by it is ID into store

```
store.dispatch('load', { id: 1 })
  .then(person => console.log('person model', person));
```

### Update resource or create

```
store.dispatch('save', { item })
  .then(person => console.log('new person model', person));
```

### Delete loaded resource

```
store.dispatch('delete')
  .then(person => console.log('deleted person model', person));
```
