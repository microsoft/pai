package watchdog

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"testing"

	v1 "k8s.io/api/core/v1"
)

func TestCollector(t *testing.T) {
	list, _ := ioutil.ReadFile("../../testdata/podlist.json")
	podList := v1.PodList{}
	json.Unmarshal(list, &podList)
	fmt.Printf("%v", podList)
}
