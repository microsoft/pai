const httpErrors = require('http-errors');
const statuses = require('statuses');

const createError = exports = module.exports = (status, code, message) => {
    const error = httpErrors(statuses(status), message, {code});
    Error.captureStackTrace(error, createError);
    return error;
};

const createUnknownError = exports.unknown = (cause) => {
    if (cause instanceof httpErrors.HttpError) {
        return cause;
    }
    const message = cause instanceof Error ? cause.message : String(cause);
    const error = createError('Internal Server Error', 'ERR_UNKNOWN', message);
    if (cause instanceof Error) {
        error.stack = cause.stack;
    } else {
        Error.captureStackTrace(error, createUnknownError);
    }
    return error;
};
