package watchdog

import (
	"errors"

	"github.com/prometheus/client_golang/prometheus"
)

type Exporter struct {
	collector *PromMetricCollector
}

func NewExporter(c *PromMetricCollector) (*Exporter, error) {
	if c == nil {
		return nil, errors.New("Invalid collector")
	}
	return &Exporter{
		collector: c,
	}, nil
}

func (e *Exporter) Collect(ch chan<- prometheus.Metric) {
	metrics := e.collector.getMetrics()
	for _, m := range metrics {
		ch <- m
	}
}

func (e *Exporter) Describe(ch chan<- *prometheus.Desc) {
	metrics := e.collector.getMetrics()
	for _, m := range metrics {
		ch <- m.Desc()
	}
}
