
export const checkAuth = async (ctx, next) => {
  if (!ctx.state.isSignedIn()) {
    ctx.throw(401);
  }
  await next();
};

export default checkAuth;
