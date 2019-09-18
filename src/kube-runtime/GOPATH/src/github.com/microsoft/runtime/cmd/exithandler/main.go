package main

import (
	"os"
	"strconv"
	"time"

	"github.com/microsoft/runtime/pkg/aggregator"
	"github.com/microsoft/runtime/pkg/logger"
)

var log *logger.Logger

const abnormalExitCode = 1

func init() {
	log = logger.NewLogger()
}

// This function will extract error summary to the specific file and print the exit code
func main() {
	defer func() {
		if r := recover(); r != nil {
			log.Error("runtime failed to handle exit info", r)
			os.Exit(abnormalExitCode)
		}
	}()

	argsWithoutProg := os.Args[1:]
	if len(argsWithoutProg) < 5 {
		panic("args is not valid")
	}

	userExitCode, err := strconv.Atoi(argsWithoutProg[0])
	if err != nil {
		panic("user exit code is not an int value: " + err.Error())
	}

	userLog := argsWithoutProg[1]
	runtimeErrorLog := argsWithoutProg[2]
	aggFilePath := argsWithoutProg[3]
	patternPath := argsWithoutProg[4]

	logFiles := aggregator.LogFiles{}
	logFiles.UserLog = userLog
	logFiles.RuntimeErrorLog = runtimeErrorLog

	exitInfo := &aggregator.RuntimeExitInfo{
		Exitcode:           abnormalExitCode,
		OriginUserExitCode: userExitCode,
	}

	log.Info("start to generate the exit summary")
	start := time.Now()
	a, err := aggregator.NewErrorAggregator(&logFiles, log)
	if err != nil {
		panic("fatal: create log aggregator: " + err.Error())
	}

	err = a.LoadRuntimeErrorSpecs(patternPath)
	if err != nil {
		panic("fatal: loading runtime error spec: " + err.Error())
	}
	exitInfo, err = a.GenerateExitInfo(int(userExitCode))
	if err != nil {
		panic("fatal: failed to generate the exitInfo" + err.Error())
	}

	aggFile, err := os.Create(aggFilePath)
	if err != nil {
		panic("fatal: create aggregate file: " + err.Error())
	}
	defer aggFile.Close()

	err = a.DumpExitSummary(exitInfo, aggFile)
	if err != nil {
		panic("fatal: dumping summary info: " + err.Error())
	}
	elapsed := time.Since(start)
	log.Info("finish generating the exit summary, time consumed:", elapsed)

	os.Exit(exitInfo.Exitcode)
}
