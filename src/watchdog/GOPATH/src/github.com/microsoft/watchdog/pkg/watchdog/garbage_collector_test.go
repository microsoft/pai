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
	"net/http"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestGarbageCollection(t *testing.T) {
	m := newMockK8sServer()
	m.addResponseByFile("/apis/scheduling.k8s.io/v1/priorityclasses",
		"../../testdata/priority_class_list.json", http.MethodGet)
	m.addResponseByFile("/api/v1/namespaces/default/secrets", "../../testdata/secret_list.json", http.MethodGet)
	m.addResponseByFile("/apis/frameworkcontroller.microsoft.com/v1/namespaces/default/frameworks",
		"../../testdata/framework_list.json", http.MethodGet)
	m.addResponse("/api/v1/namespaces/default/secrets/059cf3d85cb5f6280e9606d47551554c-configcred", "",
		http.MethodDelete)
	m.addResponse("/apis/scheduling.k8s.io/v1/priorityclasses/059cf3d85cb5f6280e9606d47551554c-priority",
		"", http.MethodDelete)
	url := m.start()
	defer m.stop()

	os.Setenv("KUBE_APISERVER_ADDRESS", url)
	c, _ := NewK8sClient()
	gc := NewGarbageCollector(c, time.Minute)
	gc.collect()
	removedPcNum := gc.removeOrphanPriorityClasses()
	removedSecretNum := gc.removeOrphanSecrets()
	assert.Equal(t, 1, removedPcNum)
	assert.Equal(t, 1, removedSecretNum)
}
