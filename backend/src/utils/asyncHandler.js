/**
 * Envolve um handler assíncrono para que rejeições de Promise sejam
 * encaminhadas ao error handler do Express via `next(err)`.
 *
 * @param {import('express').RequestHandler} fn
 * @returns {import('express').RequestHandler}
 */
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
