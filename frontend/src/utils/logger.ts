type Level = 'info' | 'warn' | 'error' | 'debug';

function format(level: Level, msg: string, meta?: Record<string, any>) {
	const ts = new Date().toISOString();
	const payload = meta ? ` | meta=${JSON.stringify(meta)}` : '';
	return `[AKIG][${ts}][${level.toUpperCase()}] ${msg}${payload}`;
}

export const logger = {
	info: (msg: string, meta?: Record<string, any>) => console.info(format('info', msg, meta)),
	warn: (msg: string, meta?: Record<string, any>) => console.warn(format('warn', msg, meta)),
	error: (msg: string, meta?: Record<string, any>) => console.error(format('error', msg, meta)),
	debug: (msg: string, meta?: Record<string, any>) => console.debug(format('debug', msg, meta)),
};

export const useLogger = (scope?: string) => {
	return {
		info: (msg: string, meta?: Record<string, any>) => logger.info(scope ? `${scope}: ${msg}` : msg, meta),
		warn: (msg: string, meta?: Record<string, any>) => logger.warn(scope ? `${scope}: ${msg}` : msg, meta),
		error: (msg: string, meta?: Record<string, any>) => logger.error(scope ? `${scope}: ${msg}` : msg, meta),
		debug: (msg: string, meta?: Record<string, any>) => logger.debug(scope ? `${scope}: ${msg}` : msg, meta),
	};
};
