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

package webserver

import (
	"context"
	"encoding/json"
	"fmt"
	si "github.com/microsoft/hivedscheduler/pkg/api"
	"github.com/microsoft/hivedscheduler/pkg/common"
	"github.com/microsoft/hivedscheduler/pkg/internal"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/klog"
	ei "k8s.io/kubernetes/pkg/scheduler/api"
	"net"
	"net/http"
	"strings"
	"time"
)

const (
	ComponentName = "webserver"
)

// The WebServer of HivedScheduler.
type WebServer struct {
	sConfig *si.Config

	// The backend http server
	server *http.Server

	// All paths to serve
	paths si.WebServerPaths

	// Scheduler Extender Callbacks from K8S Default Scheduler
	eHandlers internal.ExtenderHandlers

	// Scheduler Inspect Callbacks
	iHandlers internal.InspectHandlers
}

func NewWebServer(sConfig *si.Config,
	eHandlers internal.ExtenderHandlers,
	iHandlers internal.InspectHandlers) *WebServer {
	klog.Infof("Initializing " + ComponentName)

	ws := &WebServer{
		sConfig: sConfig,
		server: &http.Server{
			Addr: *sConfig.WebServerAddress,
		},
		paths:     si.WebServerPaths{Paths: []string{}},
		eHandlers: eHandlers,
		iHandlers: iHandlers,
	}

	ws.route(si.RootPath, ws.serve(ws.serveRootPath))
	ws.route(si.FilterPath, ws.serve(ws.serveFilterPath))
	ws.route(si.BindPath, ws.serve(ws.serveBindPath))
	ws.route(si.PreemptPath, ws.serve(ws.servePreemptPath))
	ws.route(si.AffinityGroupsPath, ws.serve(ws.serveAffinityGroups))
	return ws
}

func (ws *WebServer) route(path string, handler servePathHandler) {
	http.HandleFunc(path, handler)
	ws.paths.Paths = append(ws.paths.Paths, path)
}

func (ws *WebServer) AsyncRun(stopCh <-chan struct{}) <-chan struct{} {
	ln, err := net.Listen("tcp", *ws.sConfig.WebServerAddress)
	if err != nil {
		panic(fmt.Errorf(
			"Failed to listen on WebServerAddress: %v, %v",
			*ws.sConfig.WebServerAddress, err))
	}

	stoppedCh := make(chan struct{})
	go func() {
		defer close(stoppedCh)
		<-stopCh

		klog.Errorf("Stopping " + ComponentName)
		ctx, cancel := context.WithTimeout(context.Background(), 0)
		ws.server.Shutdown(ctx)
		cancel()
	}()

	go func() {
		// Blocking until error
		if err := ws.server.Serve(tcpKeepAliveListener{ln.(*net.TCPListener)}); err != nil {
			panic(fmt.Errorf("Error occurred while running WebServer: %v", err))
		}
	}()

	klog.Infof("Running " + ComponentName)

	return stoppedCh
}

// Copied from Golang net/http/server.go
type tcpKeepAliveListener struct {
	*net.TCPListener
}

func (ln tcpKeepAliveListener) Accept() (net.Conn, error) {
	tc, err := ln.AcceptTCP()
	if err != nil {
		return nil, err
	}
	tc.SetKeepAlive(true)
	tc.SetKeepAlivePeriod(3 * time.Minute)
	return tc, nil
}

// Error should be delivered by panic
type servePathHandler func(w http.ResponseWriter, r *http.Request)

func (ws *WebServer) serve(handler servePathHandler) servePathHandler {
	return func(w http.ResponseWriter, r *http.Request) {
		// The default error handling
		defer internal.HandleWebServerPanic(func(err *si.WebServerError) {
			// http.StatusOK is appended by default, so only need to explicitly specify
			// error statusCode.
			w.WriteHeader(err.Code)
			w.Write(common.ToJsonBytes(err.Message))
		})

		w.Header().Set("Content-Type", "application/json")
		handler(w, r)
	}
}

func (ws *WebServer) serveRootPath(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		panic(si.NewWebServerError(
			http.StatusNotFound,
			fmt.Sprintf("Path not found: %v", r.URL.Path)))
	}

	w.Write(common.ToJsonBytes(ws.paths))
}

func (ws *WebServer) serveFilterPath(w http.ResponseWriter, r *http.Request) {
	// recoverPanic to send error message to K8S
	defer internal.HandleWebServerPanic(func(err *si.WebServerError) {
		w.Write(common.ToJsonBytes(&ei.ExtenderFilterResult{Error: err.Error()}))
	})

	var args ei.ExtenderArgs
	if err := json.NewDecoder(r.Body).Decode(&args); err != nil {
		panic(internal.NewBadRequestError(fmt.Sprintf(
			"Failed to unmarshal web request body to ExtenderArgs: %v", err)))
	}

	// Args Defaulting
	if args.NodeNames == nil {
		args.NodeNames = &[]string{}
	}

	// Args Validation
	if args.Pod == nil {
		panic(internal.NewBadRequestError(fmt.Sprintf(
			"ExtenderArgs: Pod field should not be nil: %v",
			common.ToJson(args))))
	}

	w.Write(common.ToJsonBytes(ws.eHandlers.FilterHandler(args)))
}

func (ws *WebServer) serveBindPath(w http.ResponseWriter, r *http.Request) {
	// recoverPanic to send error message to K8S
	defer internal.HandleWebServerPanic(func(err *si.WebServerError) {
		w.Write(common.ToJsonBytes(&ei.ExtenderBindingResult{Error: err.Error()}))
	})

	var args ei.ExtenderBindingArgs
	if err := json.NewDecoder(r.Body).Decode(&args); err != nil {
		panic(internal.NewBadRequestError(fmt.Sprintf(
			"Failed to unmarshal web request body to ExtenderBindingArgs: %v", err)))
	}

	// Args Validation
	if args.PodNamespace == "" || args.PodName == "" ||
		args.PodUID == types.UID("") || args.Node == "" {
		panic(internal.NewBadRequestError(fmt.Sprintf(
			"ExtenderBindingArgs: All fields should not be empty: %v",
			common.ToJson(args))))
	}

	w.Write(common.ToJsonBytes(ws.eHandlers.BindHandler(args)))
}

func (ws *WebServer) servePreemptPath(w http.ResponseWriter, r *http.Request) {
	// Cannot send error message to K8S by ExtenderPreemptionResult, fallback to
	// the default error handling.

	var args ei.ExtenderPreemptionArgs
	if err := json.NewDecoder(r.Body).Decode(&args); err != nil {
		panic(internal.NewBadRequestError(fmt.Sprintf(
			"Failed to unmarshal web request body to ExtenderPreemptionArgs: %v", err)))
	}

	// Args Defaulting
	if args.NodeNameToMetaVictims == nil {
		args.NodeNameToMetaVictims = map[string]*ei.MetaVictims{}
	}

	// Args Validation
	if args.Pod == nil {
		panic(internal.NewBadRequestError(fmt.Sprintf(
			"ExtenderPreemptionArgs: Pod field should not be nil: %v",
			common.ToJson(args))))
	}

	w.Write(common.ToJsonBytes(ws.eHandlers.PreemptHandler(args)))
}

func (ws *WebServer) serveAffinityGroups(w http.ResponseWriter, r *http.Request) {
	name := strings.TrimPrefix(r.URL.Path, si.AffinityGroupsPath)
	if name == "" {
		if r.Method == http.MethodGet {
			w.Write(common.ToJsonBytes(ws.iHandlers.GetAffinityGroupsHandler()))
			return
		}
	} else {
		if r.Method == http.MethodGet {
			w.Write(common.ToJsonBytes(ws.iHandlers.GetAffinityGroupHandler(name)))
			return
		}
	}

	panic(internal.NewBadRequestError(fmt.Sprintf(
		"NotImplemented: %v: %v",
		r.Method, r.URL.Path)))
}
