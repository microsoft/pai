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

package main

import (
	"flag"
	"net/http"
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

	flag.IntVar(&collectionInterval, "collection-interval", 180, "Interval between two collections (seconds)")
	flag.IntVar(&gcInterval, "gc-interval", 60, "Interval between two garbage collections (minutes)")
	flag.IntVar(&port, "port", 9101, "exporter port number")

	flag.Parse()
}

func main() {
	klog.Infof("Watchdog service starts with collection interval: %v seconds, gc interval: %v minutes",
		collectionInterval, gcInterval)
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
	klog.Infof("Start service at port: %v", port)
	http.ListenAndServe(":"+strconv.FormatInt(int64(port), 10), nil)
}
