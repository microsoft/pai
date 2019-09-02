package main

import (
	"os"
	"strconv"

	"github.com/microsoft/runtime/pkg/aggregator"
	"github.com/microsoft/runtime/pkg/logger"
)

var log *logger.Logger

const defaultExitCode = 255

func init() {
	log = logger.NewLogger()
}

func main() {
	argsWithoutProg := os.Args[1:]

	if len(argsWithoutProg) < 4 {
		log.Error("args is not valid")
		os.Exit(255)
	}

	userLog := argsWithoutProg[0]
	runtimeErrorLog := argsWithoutProg[1]
	aggFilePath := argsWithoutProg[2]
	userExitCode, err := strconv.Atoi(argsWithoutProg[3])
	if err != nil {
		log.Error("user exit code is not an int value", err)
		os.Exit(defaultExitCode)
	}

	logFiles := aggregator.LogFiles{}
	logFiles.UserLog = userLog
	logFiles.RuntimeErrorLog = runtimeErrorLog

	exitInfo := &aggregator.RuntimeExitInfo{
		Exitcode:           255,
		OriginUserExitCode: userExitCode,
	}

	log.Info("start to generate the exit summary")
	a, err := aggregator.NewErrorAggregator(&logFiles, log)
	if err != nil {
		log.Error("failed to create log aggregator", err)
		goto DUMP_RESULT
	}

	err = a.LoadRuntimeErrorSpecs("failurePatterns.yml")
	if err != nil {
		log.Error("load runtime error spec failed")
		goto DUMP_RESULT
	}
	exitInfo, err = a.GenerateExitInfo(int(userExitCode))
	if err != nil {
		log.Error("failed to generate the exitInfo", err)
	}

DUMP_RESULT:
	aggFile, err := os.Create(aggFilePath)
	if err != nil {
		log.Error("open aggregate file failed", err)
		os.Exit(defaultExitCode)
	}
	defer aggFile.Close()

	err = a.DumpExitSummary(exitInfo, aggFile)
	if err != nil {
		log.Error("dump exit info failed", err)
		os.Exit(defaultExitCode)
	}
	log.Info("finish generating the exit summary")
	os.Exit(exitInfo.Exitcode)
}
