import {
  ApolloClient,
  gql,
  InMemoryCache,
  TypedDocumentNode,
} from "@apollo/client";
import { test, expect, beforeEach, vi, describe } from "vitest";
import { updateCache } from ".";

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

let client: ApolloClient<unknown>;
beforeEach(() => {
  client = new ApolloClient({
    cache: new InMemoryCache(),
  });
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

    expect(client.cache.extract()).toEqual({});
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
