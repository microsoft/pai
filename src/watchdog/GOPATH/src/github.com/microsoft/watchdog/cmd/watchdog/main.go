package main

import (
	"net/http"
	"os"
	"time"

	"github.com/microsoft/watchdog/pkg/watchdog"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
	os.Setenv("KUBE_APISERVER_ADDRESS", "http://10.151.40.4:8080")
	c, _ := watchdog.NewPromMetricCollector()
	expoter, err := watchdog.NewExporter(c)
	if err != nil {
		panic(err.Error())
	}
	prometheus.MustRegister(expoter)
	http.Handle("/metrics", promhttp.Handler())
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`<html>
             <head><title>Watchdog Exporter</title></head>
             <body>
             <h1>Watchdog Exporter</h1>
             <p><a href='/metrics'>Metrics</a></p>
             </body>
             </html>`))
	})
	go func() {
		for {
			c.Collect()
			time.Sleep(30 * time.Second)
		}
	}()
	http.ListenAndServe("localhost:3000", nil)
}
