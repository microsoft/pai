package main

import (
	"log"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v2"
)

func TestGenerateExitInfo(t *testing.T) {
	Error = log.New(os.Stdout, "Error:", log.Ldate|log.Ltime|log.Lshortfile)

	errorSpec := `
  - errorType: user
    patterns:
      pattenExitCode:
        exitCode: 130
    matches: ${pattens.pattenExitCode}
    reason: 'User program terminated by SIGINT'
    solution: 'Please check the log and retry again'
    containerExitCode: 130
    `
	var runtimeSpecList []RuntimeErrorSpec
	yaml.Unmarshal([]byte(errorSpec), &runtimeSpecList)

	logs := logFiles{}
	exitInfo := generateExitInfo(runtimeSpecList, &logs, 130)

	assert.Equal(t, exitInfo.Exitcode, 130)
	assert.Equal(t, exitInfo.OriginUserExitCode, 130)
	assert.Equal(t, exitInfo.Reason, "User program terminated by SIGINT")
	assert.Equal(t, exitInfo.Solution, "Please check the log and retry again")
}
