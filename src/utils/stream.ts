export const isAsyncIterable = <T>(value: unknown): value is AsyncIterable<T> => {
  if (value == null) {
    return false;
  }

  return typeof (value as AsyncIterable<T>)[Symbol.asyncIterator] === 'function';
};

export const drainIterable = async <T>(iterable: AsyncIterable<T>): Promise<T[]> => {
  const result: T[] = [];
  for await (const chunk of iterable) {
    result.push(chunk);
  }
  return result;
};
