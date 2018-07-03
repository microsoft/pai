import { HttpError } from "http-errors";

declare type Status = 
    'Bad Request' |
    'Conflict' |
    'Forbidden' |
    'Internal Server Error' |
    'Not Found' |
    'Unauthorized';
declare type Code =
    'ERR_BAD_CONFIGURATION' |
    'ERR_CONFLICT_JOB' |
    'ERR_CONFLICT_USER' |
    'ERR_FORBIDDEN_USER' |
    'ERR_INCORRECT_PASSWORD' |
    'ERR_INVALID_PARAMETERS' |
    'ERR_NO_API' |
    'ERR_NO_JOB' |
    'ERR_NO_JOB_CONFIG' |
    'ERR_NO_JOB_SSH' |
    'ERR_NO_USER' |
    'ERR_NO_VIRTUAL_CLUSTER' |
    'ERR_REMOVE_ADMIN' |
    'ERR_UNAUTHORIZED_USER' |
    'ERR_UNKNOWN';

declare function createError(status: Status, code: Code, message: string): HttpError;
declare namespace createError {
    declare function unknown(cause: Error | string): HttpError;
}

export = createError;
