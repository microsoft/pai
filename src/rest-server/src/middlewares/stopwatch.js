'use strict';

const onHeaders = require('on-headers');
const {startStopwatch, recordTime} = require('@pai/utils/stopwatch');

function stopwatchMiddleware(req, res, next) {
    // start transfer response data
    onHeaders(res, () => {
        recordTime(`${req.method} ${req.originalUrl} response start`);
    });

    // response data transferred
    res.on('finish', () => {
        recordTime(`${req.method} ${req.originalUrl} response finish`);
    });

    startStopwatch();
    next();
}

module.exports = stopwatchMiddleware;
