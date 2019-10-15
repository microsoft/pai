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
	"runtime/debug"
	"sort"
	"strconv"
	"strings"
	"syscall"
	"time"
)

func Quote(s string) string {
	return `"` + s + `"`
}

func ReferEnvVar(name string) string {
	return "$(" + name + ")"
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
	return string(ToJsonBytes(obj))
}

func FromJson(jsonStr string, objAddr interface{}) {
	FromJsonBytes([]byte(jsonStr), objAddr)
}

func ToJsonBytes(obj interface{}) []byte {
	jsonBytes, err := json.Marshal(obj)
	if err != nil {
		panic(fmt.Errorf("Failed to marshal Object %#v to JSON: %v", obj, err))
	}
	return jsonBytes
}

func FromJsonBytes(jsonBytes []byte, objAddr interface{}) {
	err := json.Unmarshal(jsonBytes, objAddr)
	if err != nil {
		panic(fmt.Errorf("Failed to unmarshal JSON %#v to Object: %v", string(jsonBytes), err))
	}
}

func GetPanicDetails(recoveredObj interface{}) string {
	return fmt.Sprintf("\n  panic: %#v\n  %v", recoveredObj, GetCallStack())
}

func GetCallStack() string {
	return strings.Replace(strings.Replace(string(debug.Stack()),
		"\t", "  ", -1),
		"\n", "\n    ", -1)
}

func ToIndicesString(indices []int32) string {
	strIndices := []string{}

	for _, i := range indices {
		strIndices = append(strIndices, fmt.Sprint(i))
	}
	indicesStr := strings.Join(strIndices, ",")
	return indicesStr
}

func StringsContains(s []string, e string) bool {
	for _, te := range s {
		if te == e {
			return true
		}
	}
	return false
}

func Int32ToString(i int32) string {
	s := strconv.FormatInt(int64(i), 10)
	return s
}

func StringToInt32(s string) int32 {
	i, err := strconv.ParseInt(s, 10, 32)
	if err != nil {
		panic(fmt.Sprintf("invalid literal for int32: %v", err))
	}
	return int32(i)
}

func SortInt32(n []int32) {
	tmp := make([]int, len(n))
	for i := 0; i < len(n); i++ {
		tmp[i] = int(n[i])
	}
	sort.Ints(tmp)
	for i := 0; i < len(tmp); i++ {
		n[i] = int32(tmp[i])
	}
}
