package watchdog

import (
	"net/http"

	"github.com/prometheus/client_golang/prometheus/promhttp"
)

type Exporter struct{}

func (e *Exporter) Start() {
	http.Handle("/metrics", promhttp.Handler())
}
