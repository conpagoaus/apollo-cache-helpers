# apollo-cache-helpers
Helpers to make working with @apollo/client cache easier

## Setup
npm:
```
npm install @conpagoaus/apollo-cache-helpers
```
yarn:
```
yarn add @conpagoaus/apollo-cache-helpers
```


## Usage
### Addition to cache
This covers a use case when we perform a mutation which adds a entry to a list and would like to see new entry without refetching original query: 
Adding todo without refetching `GetTodos` query.

As Apollo cannot determine which query it needs to inject data to, we need to help it a bit.
For this we have two functions `appendToCache` and `prependToCache`
Example usage:
```
appendToCache({
      cache: client.cache,
      query: TEST_LIST_QUERY,
      data: {
        id: "2",
        name: "Jane",
      },
    });
```
This call will append a new item to the end of **first** selection set of specified query. 
`prependToCache` does the same but adds a new item to the beginning of the list. 

Limitations:
- These functions only work with queries with single selection set. PR's are welcome to include support for multiple.
- Query must return selection set with array type.

### Removal from cache
Cache removal is performed using `removeFromCache` function. We also(unless specified otherwise) will remove normalized values of removed item from cache.
Keep this in mind for item being used in multiple queries.
Example usage:
```
removeFromCache({
      cache: client.cache,
      query: TEST_LIST_QUERY,
      data: {
        id: testClients[0].id,
      },
    });
```
This call will remove first client from query result set as well as remove first client from normalized cache. If we want to avoid removing from normalized cache we can specify
`removeNormalized: false` option allows to only remove from query results without removing from normalized cache. 


Options:
- removeNormalized - enabled by default. Determines if removeFromCache should also remove item from apollo normalized cache.

Limitations:
- The removal function only work with queries with single selection set. PR's are welcome to include support for multiple.
- Query must return selection set with array type.


### Any other updates
For any other updates `updateCache` function is provided with [`immer`](https://immerjs.github.io/immer/) support - no need to worry about not mutating things. 
We can change what is needed and `immer` will handle making an immutable change. 
Example usage:

```
updateCache({
      cache: client.cache,
      query: TEST_QUERY,
      variables: { id: "1" },
      updateFn: (draft) => {
        draft.client.name = "test";
      }
});
```
This function call will update client name in result set of the query specified. 
Make sure to pass all the variables which were used in original query - otherwise Apollo won't be able to match queries. 
In that scenario and any other mismatches library will print console warning `No cached data found`.

Options:
- inputOptions.debug - disable by default. Enables debugging logging to help identify what is being written to cache.
- inputOptions.logger - console by default. Logger can be redirected to any other logger supporting `ILogger` type.
