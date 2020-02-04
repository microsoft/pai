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

package common

import (
	"bytes"
	"compress/gzip"
	"encoding/json"
	"flag"
	"fmt"
	"gopkg.in/yaml.v2"
	"io/ioutil"
	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/klog"
	"log"
	"math/rand"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func Quote(s string) string {
	return `"` + s + `"`
}

func ReferEnvVar(name string) string {
	return "$(" + name + ")"
}

func ReferPlaceholder(name string) string {
	return "{{" + name + "}}"
}

func PtrString(o string) *string {
	return &o
}

func PtrInt32(o int32) *int32 {
	return &o
}

func NilInt32() *int32 {
	return nil
}

func PtrInt64(o int64) *int64 {
	return &o
}

func PtrFloat64(o float64) *float64 {
	return &o
}

func PtrBool(o bool) *bool {
	return &o
}

func NilBool() *bool {
	return nil
}

func PtrUID(o types.UID) *types.UID {
	return &o
}

func PtrUIDStr(s string) *types.UID {
	return PtrUID(types.UID(s))
}

func PtrDeletionPropagation(o meta.DeletionPropagation) *meta.DeletionPropagation {
	return &o
}

func PtrTime(o meta.Time) *meta.Time {
	return &o
}

func PtrNow() *meta.Time {
	now := meta.Now()
	return &now
}

func SecToDuration(sec *int64) time.Duration {
	return time.Duration(*sec) * time.Second
}

func IsTimeout(leftDuration time.Duration) bool {
	// Align with the AddAfter method of the workqueue
	return leftDuration <= 0
}

func CurrentLeftDuration(startTime meta.Time, timeoutSec *int64) time.Duration {
	currentDuration := time.Since(startTime.Time)
	timeoutDuration := SecToDuration(timeoutSec)
	leftDuration := timeoutDuration - currentDuration
	return leftDuration
}

func InitAll() {
	InitLogger()
	InitRandSeed()
}

func InitLogger() {
	// Defaulting
	klog.InitFlags(flag.CommandLine)
	flag.Set("v", "2")

	// Configure klog from command line
	flag.Parse()

	// Only support stderr logging and not support file logging.
	// To achieve file logging, user can redirect the stderr to file and rotate the
	// file to avoid out of disk.
	// This is because currently file logging in klog has some limitations:
	// 1. klog will never remove old files even if the log_file_max_size is exceeded.
	//    So, the total log data size cannot be limited.
	// 2. We do not have the chance to flush log to file, if a panic is called in
	//    an unmanaged goroutine and no one can recover it in the goroutine.
	//    So, even if the log about the panic itself can be lost.
	flag.Set("logtostderr", "true")
	flag.Set("alsologtostderr", "true")
	flag.Set("stderrthreshold", "INFO")
	klog.SetOutput(ioutil.Discard)

	// Redirect the default golang log to klog
	log.SetOutput(KlogWriter{})
	log.SetFlags(0)
}

func InitRandSeed() {
	rand.Seed(time.Now().UTC().UnixNano())
}

func NewStopChannel() <-chan struct{} {
	stopCh := make(chan struct{})

	// Stop on shutdown signal:
	// Must be a buffered channel, otherwise the shutdown signal may be lost.
	shutdownCh := make(chan os.Signal, 1)
	signal.Notify(shutdownCh, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		s := <-shutdownCh
		klog.Warningf("Received shutdown signal: %v", s)
		close(stopCh)
	}()

	return stopCh
}

// Rand in range [min, max]
func RandInt64(min int64, max int64) int64 {
	return min + rand.Int63n(max-min+1)
}

func ToYaml(obj interface{}) string {
	yamlBytes, err := yaml.Marshal(obj)
	if err != nil {
		panic(fmt.Errorf("Failed to marshal Object %#v to YAML: %v", obj, err))
	}
	return string(yamlBytes)
}

func FromYaml(yamlStr string, objAddr interface{}) {
	err := yaml.Unmarshal([]byte(yamlStr), objAddr)
	if err != nil {
		panic(fmt.Errorf("Failed to unmarshal YAML %#v to Object: %v", yamlStr, err))
	}
}

func ToJson(obj interface{}) string {
	jsonBytes, err := json.Marshal(obj)
	if err != nil {
		panic(fmt.Errorf("Failed to marshal Object %#v to JSON: %v", obj, err))
	}
	return string(jsonBytes)
}

func FromJson(jsonStr string, objAddr interface{}) {
	err := json.Unmarshal([]byte(jsonStr), objAddr)
	if err != nil {
		panic(fmt.Errorf("Failed to unmarshal JSON %#v to Object: %v", jsonStr, err))
	}
}

func Compress(rawStr string) ([]byte, error) {
	compressedBuffer := &bytes.Buffer{}
	compressor := gzip.NewWriter(compressedBuffer)
	if _, err := compressor.Write([]byte(rawStr)); err != nil {
		return nil, fmt.Errorf(
			"Failed to compress %#v when writing: %v",
			rawStr, err)
	} else {
		if err := compressor.Close(); err != nil {
			return nil, fmt.Errorf(
				"Failed to compress %#v when closing: %v",
				rawStr, err)
		} else {
			return compressedBuffer.Bytes(), nil
		}
	}
}

func Decompress(compressedBytes []byte) (string, error) {
	compressedReader := bytes.NewReader(compressedBytes)
	if decompressor, err := gzip.NewReader(compressedReader); err != nil {
		return "", fmt.Errorf(
			"Failed to decompress %#v when initializing: %v",
			compressedBytes, err)
	} else {
		if rawBytes, err := ioutil.ReadAll(decompressor); err != nil {
			return "", fmt.Errorf(
				"Failed to decompress %#v when reading: %v",
				compressedBytes, err)
		} else {
			return string(rawBytes), nil
		}
	}
}
