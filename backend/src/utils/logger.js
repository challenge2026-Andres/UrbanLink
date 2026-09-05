/**
 * Logger mínimo com níveis e timestamp ISO.
 *
 * Mantido simples de propósito (sem dependência externa). Se o projeto crescer,
 * trocar por pino/winston sem alterar os pontos de chamada.
 */

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const currentLevel = process.env.LOG_LEVEL && LEVELS[process.env.LOG_LEVEL] !== undefined
  ? LEVELS[process.env.LOG_LEVEL]
  : LEVELS.info;

/**
 * @param {'error'|'warn'|'info'|'debug'} level
 * @param {string} message
 * @param {Record<string, unknown>} [meta] Dados estruturados adicionais.
 */
function log(level, message, meta) {
  if (LEVELS[level] > currentLevel) return;
  const entry = { ts: new Date().toISOString(), level, message, ...meta };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  error: (msg, meta) => log('error', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
};
