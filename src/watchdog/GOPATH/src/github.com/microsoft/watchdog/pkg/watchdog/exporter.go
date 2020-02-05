// MIT License
//
// Copyright (c) Microsoft Corporation. All rights reserved.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE

package watchdog

import (
	"errors"

	"github.com/prometheus/client_golang/prometheus"
)

// Exporter used to export collected metrics
type Exporter struct {
	collector *PromMetricCollector
}

// NewExporter create exporter instance
func NewExporter(c *PromMetricCollector) (*Exporter, error) {
	if c == nil {
		return nil, errors.New("Invalid collector")
	}
	return &Exporter{
		collector: c,
	}, nil
}

// Collect will called by prometheus, put the collected metrics into the channel
func (e *Exporter) Collect(ch chan<- prometheus.Metric) {
	metrics := e.collector.getMetrics()
	for _, m := range metrics {
		ch <- m
	}
}

// Describe will called by prometheus
func (e *Exporter) Describe(ch chan<- *prometheus.Desc) {
	metrics := e.collector.getMetrics()
	for _, m := range metrics {
		ch <- m.Desc()
	}
}
