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

import { isNil } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

export default class Timer extends React.Component {
  constructor(props) {
    super(props);
    this.timer = null;
  }

  componentDidMount() {
    this.startTimer();
  }

  componentDidUpdate(prevProps) {
    const { interval, func } = this.props;
    if (prevProps.interval !== interval || prevProps.func !== func) {
      this.stopTimer();
      this.startTimer();
    }
  }

  componentWillUnmount() {
    this.stopTimer();
  }

  startTimer() {
    const { interval, func } = this.props;
    this.stopTimer();
    if (!isNil(interval) && interval > 0 && !isNil(func)) {
      this.timer = setInterval(func, interval);
    }
  }

  stopTimer() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  render() {
    return null;
  }
}

Timer.propTypes = {
  interval: PropTypes.number,
  func: PropTypes.func,
};
