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
	"io/ioutil"
	"log"
	"os"
	"strings"

	"gopkg.in/yaml.v2"
)

// Error loggger
var Error *log.Logger

// DefaulExitCode used when no error patten maches
const DefaulExitCode = 255

// MaxAggregateLogSize the max log size runtime will return to controller
const MaxAggregateLogSize = 4096

// MaxRuntimeLogLines max runtime log lines will return to controller
const MaxRuntimeLogLines = 10

// MaxUserLogLines max user log lines will return to controller
const MaxUserLogLines = 20

// AggExitInfoBegin begin tag for aggregate exit info
const AggExitInfoBegin = "[PAI_RUNTIME_ERROR_START]"

// AggExitInfoEnd begin tag for aggregate exit info
const AggExitInfoEnd = "[PAI_RUNTIME_ERROR_END]"

// RuntimeErrorSpec used for detecting the job failure error
type RuntimeErrorSpec struct {
	ErrorType         string             `yaml:"errorType"`
	ContainerExitCode int                `yaml:"containerExitCode"`
	Patterns          map[string]Pattern `yaml:"patterns"`
	Matches           string             `yaml:"matches"`
	Reason            string             `yaml:"reason"`
	Solution          string             `yaml:"solution"`
}

// Pattern describe the
type Pattern struct {
	ExitCode   int    `yaml:"exitCode"`
	UserLog    string `yaml:"userLog"`
	RuntimeLog string `yaml:"runtimeLog"`
	// Can add more patterns here
}

// ErrorLogs contains the logs which illustrates the failed reason
type ErrorLogs struct {
	User    string `yaml:"user"`
	Runtime string `yaml:"runtime"`
}

// RuntimeExitInfo this is used to store summary exit info
type RuntimeExitInfo struct {
	Exitcode             int       `yaml:"exitCode"`
	Reason               string    `yaml:"reason,omitempty"`
	Solution             string    `yaml:"solution,omitempty"`
	Trigger              string    `yaml:"trigger,omitempty"`
	OriginUserExitCode   int       `yaml:"originUserExitCode"`
	MatchedUserLogString string    `yaml:"MatchedUserLogString,omitempty"`
	CaughtException      string    `yaml:"CaughtException,omitempty"`
	ErrorLogs            ErrorLogs `yaml:"errorLogs,omitempty"`
}

type logFiles struct {
	userLog         string
	userErrorLog    string
	runtimeLog      string
	runtimeErrorLog string
}

type matchResult struct {
	matchException string
	matchLog       string
}

func loadRuntimeErrorSpecs(fileName string) ([]RuntimeErrorSpec, error) {
	failurePatterns, err := ioutil.ReadFile(fileName)
	if err != nil {
		Error.Println("Failed to load runtime spec:", err)
		return nil, err
	}

	var runtimeSpecList []RuntimeErrorSpec
	yaml.Unmarshal(failurePatterns, &runtimeSpecList)
	return runtimeSpecList, nil
}

func truncateLog(logConent string, truncateSize int) (string, int) {
	logSize := len(logConent)
	if logSize < truncateSize {
		truncatedLog := logConent[truncateSize:]
		trucatedLogLines := strings.Split(truncatedLog, "\n")
		if len(trucatedLogLines) > 0 && logConent[truncateSize] != '\n' {
			trucatedLogLines = trucatedLogLines[1:]
		}
		truncatedLog = strings.Join(trucatedLogLines, "\n")
		return truncatedLog, logSize - len(truncatedLog)
	}
	return "", logSize
}

func truncateExitSummary(runtimeExitInfo *RuntimeExitInfo) ([]byte, error) {
	data, err := yaml.Marshal(runtimeExitInfo)
	if err != nil {
		return []byte{}, err
	}

	exitInfoSize := len(data)
	leftSize := MaxAggregateLogSize - len(AggExitInfoBegin) - len(AggExitInfoEnd)
	if exitInfoSize <= leftSize {
		return data, nil
	}
	remainTruncateSize := exitInfoSize - leftSize

	// truncate runtime log first
	truncatedRuntimeLog, trucatedSize := truncateLog(runtimeExitInfo.ErrorLogs.Runtime, remainTruncateSize)
	runtimeExitInfo.ErrorLogs.Runtime = truncatedRuntimeLog
	remainTruncateSize = remainTruncateSize - trucatedSize
	if remainTruncateSize <= 0 {
		data, err := yaml.Marshal(runtimeExitInfo)
		return data, err
	}

	// truncate the user log
	truncatedUserLog, trucatedSize := truncateLog(runtimeExitInfo.ErrorLogs.User, remainTruncateSize)
	runtimeExitInfo.ErrorLogs.User = truncatedUserLog
	remainTruncateSize = remainTruncateSize - trucatedSize

	if remainTruncateSize <= 0 {
		data, err := yaml.Marshal(runtimeExitInfo)
		return data, err
	}

	// should not run at this piece of code
	return []byte{}, nil
}

func writeExitSummary(fileName string, runtimeExitInfo *RuntimeExitInfo) error {
	var aggregateLog []string
	truncatedData, err := truncateExitSummary(runtimeExitInfo)
	if err != nil {
		Error.Println("Failed to get truncate exit info, err:", err)
		return err
	}

	aggregateLog = append(aggregateLog, AggExitInfoBegin, string(truncatedData), AggExitInfoEnd)
	err = ioutil.WriteFile(fileName, []byte(strings.Join(aggregateLog, "\n")), 0664)
	if err != nil {
		Error.Println("Failed to write runtime exit info into file:", err)
		return err
	}
	return nil
}

func matchSpecPatten(spec RuntimeErrorSpec, userExitCode int) (bool, matchResult) {
	// we only consider the exit code here
	result := matchResult{}
	matches := spec.Matches
	pattens := spec.Patterns
	for k, v := range pattens {
		if strings.Contains(matches, "pattens."+k) && v.ExitCode == userExitCode {
			return true, result
		}
	}
	return false, result
}

func collectLogFiles(fileName string, maxLines int) (string, error) {
	logFile, err := os.Open(fileName)
	if err != nil {
		Error.Println("Failed to open user log file", fileName, "error:", err)
		return "", err
	}
	defer logFile.Close()

	fileInfo, err := logFile.Stat()
	if err != nil {
		Error.Println("Failed to get file stat, file", fileName, "error:", err)
		return "", err
	}

	userLogLen := fileInfo.Size()
	logOffset := userLogLen - MaxAggregateLogSize
	if logOffset < 0 {
		logOffset = 0
	}

	buffer := make([]byte, userLogLen-logOffset)
	logFile.ReadAt(buffer, logOffset)
	logContent := string(buffer)

	lines := strings.Split(strings.Replace(logContent, "\r\n", "\n", -1), "\n")
	if logOffset != 0 {
		lines = lines[1:]
	}
	if len(lines) > maxLines {
		lines = lines[len(lines)-maxLines:]
	}
	return strings.Join(lines, "\n"), nil
}

func generateExitInfo(errorSpecs []RuntimeErrorSpec, logFiles *logFiles, userExitCode int) RuntimeExitInfo {
	var exitInfo RuntimeExitInfo
	var result matchResult
	var isMatch bool

	// no error occur
	if userExitCode == 0 {
		return exitInfo
	}

	for _, spec := range errorSpecs {
		isMatch, result = matchSpecPatten(spec, userExitCode)
		if isMatch {
			exitInfo.Exitcode = spec.ContainerExitCode
			exitInfo.OriginUserExitCode = userExitCode
			exitInfo.Reason = spec.Reason
			exitInfo.Solution = spec.Solution
			exitInfo.MatchedUserLogString = result.matchLog
			exitInfo.CaughtException = result.matchException
		}
	}

	if !isMatch {
		exitInfo.Exitcode = DefaulExitCode
		exitInfo.OriginUserExitCode = userExitCode
	}

	// The logic should be different for the exutInfos which match errorSpec log patten.
	// Since we do not has such patten yet, just deal with this issue in a uniform behaviors

	// Here we just collect user error log, need to collect othter log as well?
	exitInfo.ErrorLogs.User, _ = collectLogFiles(logFiles.userErrorLog, MaxUserLogLines)
	exitInfo.ErrorLogs.Runtime, _ = collectLogFiles(logFiles.runtimeErrorLog, MaxRuntimeLogLines)
	return exitInfo
}

func main() {
	const runtimeErrorLog = "runtime.pai.error"
	errFile, err := os.OpenFile(runtimeErrorLog, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0664)
	if err != nil {
		log.Fatalln("Failed to open runtime log:", err)
	}
	Error = log.New(errFile, "Error:", log.Ldate|log.Ltime|log.Lshortfile)
	defer errFile.Close()

	runtimeErrorSpecs, err := loadRuntimeErrorSpecs("failurePatterns.yml")
	if err != nil {
		Error.Fatalln("Load runtime error spec failed")
	}

	logs := logFiles{}
	logs.userErrorLog = "user.pai.stderr"
	logs.runtimeErrorLog = runtimeErrorLog

	exitInfo := generateExitInfo(runtimeErrorSpecs, &logs, 137)
	if writeExitSummary("runtime.pai.agg.error", &exitInfo) != nil {
		Error.Fatalln("Write exitInfo Failed:", err)
	}
}
