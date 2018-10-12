// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

const Bottleneck = require('bottleneck').default;

// Per user configuration
exports.user = {
    maxConcurrent: Number(process.env.USER_MAX_CONCURRENT) || 2,
    highWater: Number(process.env.USER_HIGH_WATER) || 5,
    // When adding a new job to a limiter, if the queue length reaches highWater, do not add the new job.
    strategy: Bottleneck.strategy.OVERFLOW,
};

exports.anonymous = {
    maxConcurrent: Number(process.env.ANOMYMOUS_MAX_CONCURRENT) || 20,
    highWater: Number(process.env.ANOMYMOUS_HIGH_WATER) || 50,
    // When adding a new job to a limiter, if the queue length reaches highWater, do not add the new job.
    strategy: Bottleneck.strategy.OVERFLOW,
};
