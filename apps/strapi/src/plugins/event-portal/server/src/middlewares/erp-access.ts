export default () => {
  return async (_ctx: any, next: () => Promise<unknown>) => next();
};
