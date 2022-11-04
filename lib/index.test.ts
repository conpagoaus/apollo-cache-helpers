import {
  ApolloClient,
  gql,
  InMemoryCache,
  TypedDocumentNode,
} from "@apollo/client";
import { test, expect, beforeEach, vi, describe } from "vitest";
import {
  appendToCache,
  cacheToString,
  prependToCache,
  updateCache,
} from "./index";

type GetClientByIdQuery = {
  client: {
    id: string;
    name: string;
  };
};
type GetClientByIdQueryVariables = {};
const TEST_QUERY = gql`
  query GetClientById($id: ID!) {
    client(id: $id) {
      id
      name
    }
  }
` as TypedDocumentNode<GetClientByIdQuery, GetClientByIdQueryVariables>;

type GetClientListQuery = {
  clients: {
    id: string;
    name: string;
  }[];
};
type GetClientListQueryVariables = {};
const TEST_LIST_QUERY = gql`
  query GetClientList {
    clients {
      id
      name
    }
  }
` as TypedDocumentNode<GetClientListQuery, GetClientListQueryVariables>;

let client: ApolloClient<unknown>;
beforeEach(() => {
  client = new ApolloClient({
    cache: new InMemoryCache(),
  });
});

describe("cache update", () => {
  test("does not touch cache when trying to update non existing query", () => {
    updateCache({
      cache: client.cache,
      query: TEST_QUERY,
      variables: { id: "1" },
      updateFn: ({ client }) => {
        client.name = "Jane";
      },
    });
    expect(client.cache.extract()).toEqual({});
  });
  test("can update existing cache", () => {
    client.cache.writeQuery({
      query: TEST_QUERY,
      variables: { id: "1" },
      data: {
        client: {
          id: "1",
          name: "John",
        },
      },
    });

    updateCache({
      cache: client.cache,
      query: TEST_QUERY,
      variables: { id: "1" },
      updateFn: ({ client }) => {
        client.name = "Jane";
      },
    });

    const result = client.readQuery({
      query: TEST_QUERY,
      variables: { id: "1" },
    });
    expect(result?.client.name).toBe("Jane");
  });
});

describe("cache addition", () => {
  test("errors if query doesn't have an array as selection set", () => {
    client.writeQuery({
      query: TEST_QUERY,
      variables: { id: "1" },
      data: {
        client: {
          id: "1",
          name: "John",
        },
      },
    });
    expect(() => {
      appendToCache({
        cache: client.cache,
        query: TEST_QUERY,
        variables: { id: "1" },
        data: {
          id: "1",
          name: "John",
        },
      });
    }).toThrow("Cannot append to non array");
  });
  test("does not touch cache when trying to append to non existing query", () => {
    appendToCache({
      cache: client.cache,
      query: TEST_LIST_QUERY,
      variables: {},
      data: {
        id: "1",
        name: "John",
      },
    });
    expect(cacheToString(client.cache)).toEqual("{}");
  });
  test("can add to existing cache", () => {
    client.cache.writeQuery({
      query: TEST_LIST_QUERY,
      data: {
        clients: [
          {
            id: "1",
            name: "John",
          },
        ],
      },
    });

    appendToCache({
      cache: client.cache,
      query: TEST_LIST_QUERY,
      data: {
        id: "2",
        name: "Jane",
      },
    });

    const result = client.readQuery({
      query: TEST_LIST_QUERY,
    });
    expect(result?.clients.length).toBe(2);
  });
  test("can prepend to existing cache", () => {
    client.cache.writeQuery({
      query: TEST_LIST_QUERY,
      data: {
        clients: [
          {
            id: "1",
            name: "John",
          },
        ],
      },
    });

    prependToCache({
      cache: client.cache,
      query: TEST_LIST_QUERY,
      data: {
        id: "2",
        name: "Jane",
      },
    });

    const result = client.readQuery({
      query: TEST_LIST_QUERY,
    });
    expect(result?.clients[0].id).toBe("2");
  });
});

describe("logging", () => {
  const fakeLogger = {
    debug: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  };
  test("it warns about trying to update non existing cache", () => {
    updateCache({
      cache: client.cache,
      query: TEST_QUERY,
      variables: { id: "1" },
      updateFn: (draft) => {
        draft.client.name = "test";
      },
      inputOptions: {
        logger: fakeLogger,
      },
    });

    expect(fakeLogger.warn).toHaveBeenCalled();
  });
  test("can update existing cache with debugging", () => {
    client.cache.writeQuery({
      query: TEST_QUERY,
      variables: { id: "1" },
      data: {
        client: {
          id: "1",
          name: "John",
        },
      },
    });

    updateCache({
      cache: client.cache,
      query: TEST_QUERY,
      variables: { id: "1" },
      updateFn: ({ client }) => {
        client.name = "Jane";
      },
      inputOptions: { debug: true, logger: fakeLogger },
    });

    expect(fakeLogger.debug).toHaveBeenCalled();
  });
});
