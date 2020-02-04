package main

import (
	"flag"
	"net/http"
	"os"
	"strconv"
	"time"

	"k8s.io/klog"

	"github.com/microsoft/watchdog/pkg/watchdog"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	collectionInterval int
	gcInterval         int
	port               int
)

func init() {
	klog.InitFlags(nil)
	flag.Set("v", "2")

	flag.IntVar(&collectionInterval, "collection-interval", 180, "Interval betweem two collections (seconds)")
	flag.IntVar(&gcInterval, "gc-interval", 60, "Interval between two garbage collections (minutes)")
	flag.IntVar(&port, "port", 9001, "exporter port number")

	flag.Parse()
}

func main() {
	klog.Info("Watchdog service starts")
	os.Setenv("KUBE_APISERVER_ADDRESS", "http://10.151.40.4:8080")
	client, err := watchdog.NewK8sClient()
	if err != nil {
		panic(err.Error())
	}
	pc := watchdog.NewPromMetricCollector(client, time.Duration(collectionInterval)*time.Second)
	expoter, err := watchdog.NewExporter(pc)
	if err != nil {
		panic(err.Error())
	}
	prometheus.MustRegister(expoter)
	http.Handle("/metrics", promhttp.Handler())
	http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`<html>ok</html>`))
	})

	gc := watchdog.NewGarbageCollector(client, time.Duration(gcInterval)*time.Minute)
	pc.Start()
	gc.Start()
	http.ListenAndServe(":"+strconv.FormatInt(int64(port), 10), nil)
}
