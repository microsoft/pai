'use strict';

const httpContext = require('express-http-context');
const logger = require('../config/logger');

const STOPWATCH_KEY = 'debug.stopwatch';

class Stopwatch {
    constructor() {
        this.startTime = null;
        this.lastTime = null;
    }

    _print(message, interval, total) {
        logger.info('Stopwatch:' + JSON.stringify({message, interval, total}));
    }

    start() {
        this.startTime = Date.now();
        this.lastTime = this.startTime;
    }

    lap(message) {
        let now = Date.now();
        let interval = now - this.lastTime;
        let total = now - this.startTime;
        this.lastTime = now;
        this._print(message, interval, total);
    }
}

function startStopwatch() {
    const stopwatch = new Stopwatch();
    stopwatch.start();
    httpContext.set(STOPWATCH_KEY, stopwatch);
}

function recordTime(message) {
    const stopwatch = httpContext.get(STOPWATCH_KEY);
    if (stopwatch) {
        stopwatch.lap(message);
    }
}

module.exports = {
    Stopwatch: Stopwatch,
    startStopwatch,
    recordTime,
};
