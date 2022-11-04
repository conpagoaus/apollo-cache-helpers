import { ApolloCache, ApolloClient, TypedDocumentNode } from "@apollo/client";
import { isArray } from "@apollo/client/cache/inmemory/helpers";
import { OperationDefinitionNode, FieldNode } from "graphql";

import produce, { Draft } from "immer";

interface ICacheData {
  [key: string]: unknown;
}
interface ICacheListData extends ICacheData, Array<any> {}

type LoggerFunc = {
  (...data: any[]): void;
  (message?: any, ...optionalParams: any[]): void;
};
type ILogger = {
  debug: LoggerFunc;
  warn: LoggerFunc;
  info: LoggerFunc;
};
type CacheOptions = {
  debug: boolean;
  logger: ILogger;
};

type InputOptions = Partial<CacheOptions>;

const defaultOptions = {
  debug: false,
  logger: console,
};

export function prependToCache<T extends ICacheData, V, I>(
  args: Pick<CacheArgs<T, V>, "cache" | "query" | "variables"> & {
    data: I;
  }
) {
  const selectionName = getSelectionName(args.query);

  updateCache({
    ...args,
    updateFn: (draft) => {
      const array = draft[selectionName] as Array<I>;
      if (isArray(array)) {
        array.unshift(args.data);
      } else {
        throw new Error(
          `Cannot prepend to non array, check that selection ${selectionName} is an array`
        );
      }
    },
  });
}

export function appendToCache<T extends ICacheData, V, I>(
  args: Pick<CacheArgs<T, V>, "cache" | "query" | "variables"> & {
    data: I;
  }
) {
  const selectionName = getSelectionName(args.query);

  updateCache({
    ...args,
    updateFn: (draft) => {
      const array = draft[selectionName] as Array<I>;
      if (isArray(array)) {
        array.push(args.data);
      } else {
        throw new Error(
          `Cannot append to non array, check that selection ${selectionName} is an array`
        );
      }
    },
  });
}

export type CacheArgs<T extends ICacheData, V> = {
  cache: ApolloCache<unknown>;
  query: TypedDocumentNode<T, V>;
  variables?: V;
  updateFn: (draft: Draft<NonNullable<T>>) => any;
  inputOptions?: InputOptions;
};

function getSelectionName<T extends ICacheData, V>(
  query: CacheArgs<T, V>["query"]
) {
  const operation = query.definitions.find(
    (x) => x.kind === "OperationDefinition"
  ) as OperationDefinitionNode;
  const field = operation.selectionSet.selections.find(
    (x) => x.kind === "Field"
  ) as FieldNode;
  const selectionName = field.name.value;
  return selectionName;
}

export function updateCache<T extends ICacheData, V>({
  cache,
  query,
  variables,
  updateFn,
  inputOptions,
}: CacheArgs<T, V>) {
  const options = { ...defaultOptions, ...inputOptions };
  logDebug(options, { query, variables });

  const cachedData = cache.readQuery<T>({
    query,
    variables,
  });

  logDebug(options, "cachedData", cachedData);

  if (cachedData) {
    const updatedData = produce(cachedData, updateFn);

    logDebug(options, "Writing to cache", updatedData);

    cache.writeQuery({
      query,
      variables,
      data: updatedData,
    });
  } else {
    const operationName = getQueryName<T, V>(query);
    logWarn(options, "No cached data found for query", operationName);
  }
}

function getQueryName<T extends ICacheData, V>(query: TypedDocumentNode<T, V>) {
  const operation = query.definitions.find(
    (def) => def.kind === "OperationDefinition"
  ) as OperationDefinitionNode;
  const operationName = operation.name?.value;
  return operationName;
}

export function cacheToString(cache: ApolloCache<unknown>) {
  const data = cache.extract();
  return JSON.stringify(data, null, 2);
}

// Logging
export function logCache(client: ApolloClient<unknown>) {
  console.log(cacheToString(client.cache));
}

function logDebug(options: CacheOptions, ...rest: any[]) {
  if (options.debug) {
    options.logger.debug(...rest);
  }
}

function logWarn(options: CacheOptions, ...rest: any[]) {
  options.logger.warn(...rest);
}
