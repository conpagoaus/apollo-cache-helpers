import { ApolloCache, ApolloClient, TypedDocumentNode } from "@apollo/client";
import { OperationDefinitionNode } from "graphql";

import produce, { Draft } from "immer";

interface ICacheData {
  [key: string]: unknown;
}
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

export function logCache(client: ApolloClient<unknown>) {
  console.log(client.cache.extract());
}
const defaultOptions = {
  debug: false,
  logger: console,
};

export function updateCache<T extends ICacheData, V>({
  cache,
  query,
  variables,
  updateFn,
  inputOptions,
}: {
  cache: ApolloCache<unknown>;
  query: TypedDocumentNode<T, V>;
  variables?: V;
  updateFn: (draft: Draft<NonNullable<T>>) => any;
  inputOptions?: InputOptions;
}) {
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

function logDebug(options: CacheOptions, ...rest: any[]) {
  if (options.debug) {
    options.logger.debug(...rest);
  }
}

function logWarn(options: CacheOptions, ...rest: any[]) {
  options.logger.warn(...rest);
}
