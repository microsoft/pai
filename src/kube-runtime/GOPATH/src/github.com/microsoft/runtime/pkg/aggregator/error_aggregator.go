package aggregator

import (
	"errors"
	"io"
	"io/ioutil"
	"os"
	"regexp"
	"strings"

	"github.com/microsoft/runtime/pkg/logger"
	"gopkg.in/yaml.v2"
)

// User zero to present undefined exitCode
const undefinedExitCode = 0

type runtimeErrorSpec struct {
	ErrorType         *string   `yaml:"errorType"`
	ContainerExitCode int       `yaml:"containerExitCode"`
	Patterns          []pattern `yaml:"patterns"`
	Reason            *string   `yaml:"reason"`
	Solution          *string   `yaml:"solution"`
}

type pattern struct {
	ExitCode         int     `yaml:"exitCode"`
	UserLogRegex     *string `yaml:"userLogRegex"`
	PlatformLogRegex *string `yaml:"platformLogRegex"`
	// Can add more patterns here
}

// ErrorLogs contain the platform and user error logs
type ErrorLogs struct {
	User     *string `yaml:"user,omitempty"`
	Platform *string `yaml:"platform,omitempty"`
}

// RuntimeExitInfo the aggregated exit info
type RuntimeExitInfo struct {
	Exitcode                 int        `yaml:"exitCode"`
	Reason                   *string    `yaml:"reason,omitempty"`
	Solution                 *string    `yaml:"solution,omitempty"`
	Trigger                  *string    `yaml:"trigger,omitempty"`
	OriginUserExitCode       int        `yaml:"originUserExitCode"`
	MatchedUserLogString     *string    `yaml:"matchedUserLogString,omitempty"`
	MatchedPlatformLogString *string    `yaml:"matchedPlatformLogString,omitempty"`
	CaughtException          *string    `yaml:"caughtException,omitempty"`
	ErrorLogs                *ErrorLogs `yaml:"errorLogs,omitempty"`
}

// LogFiles point the path for userLog and platLog
type LogFiles struct {
	UserLog         string
	RuntimeErrorLog string
}

type matchResult struct {
	matchedUserLog     *string
	matchedPlatformLog *string
	platLog            []string
	userLog            []string
}

// ErrorAggregator is used to generate the aggreagetor error message
type ErrorAggregator struct {
	errorSpecs          []*runtimeErrorSpec
	logFiles            *LogFiles
	logger              *logger.Logger
	maxAggregateLogSize int
	maxMatchLogLen      int
	maxUserLogLines     int
	maxRuntimeLogLines  int
	defaulExitCode      int
	maxSearchLogSize    int64
	aggExitInfoBegin    string
	aggExitInfoEnd      string
}

func ptrString(o string) *string {
	return &o
}

// LoadRuntimeErrorSpecs is used to load error spec from configured yaml file
func (a *ErrorAggregator) LoadRuntimeErrorSpecs(fileName string) error {
	failurePatterns, err := ioutil.ReadFile(fileName)
	if err != nil {
		a.logger.Error("failed to load runtime spec:", err)
		return err
	}

	err = yaml.Unmarshal(failurePatterns, &a.errorSpecs)
	if err != nil {
		a.logger.Error("failed to unmarshal:", err)
		return err
	}
	return nil
}

// GenerateExitInfo is used to generate the exit info
func (a *ErrorAggregator) GenerateExitInfo(userExitCode int) (*RuntimeExitInfo, error) {
	var exitInfo RuntimeExitInfo
	var result *matchResult
	var isMatch bool

	// no error occur
	if userExitCode == 0 {
		return nil, nil
	}

	userFile, err := os.Open(a.logFiles.UserLog)
	if err != nil {
		return nil, err
	}
	defer userFile.Close()

	runtimeFile, err := os.Open(a.logFiles.RuntimeErrorLog)
	if err != nil {
		return nil, err
	}
	defer runtimeFile.Close()

	userLog, err := a.getTailContentFromFile(userFile, a.maxSearchLogSize)
	if err != nil {
		a.logger.Error("some error occur when getting user log conent, may cause inaccurate result", err)
	}

	platformLog, err := a.getTailContentFromFile(runtimeFile, a.maxSearchLogSize)
	if err != nil {
		a.logger.Error("some error occur when getting runtime user log conent, may cause inaccurate result", err)
	}

	for _, spec := range a.errorSpecs {
		isMatch, result = a.matchSpecPatten(spec, userExitCode, userLog, platformLog)
		if isMatch {
			exitInfo.Exitcode = spec.ContainerExitCode
			exitInfo.OriginUserExitCode = userExitCode
			exitInfo.Reason = spec.Reason
			exitInfo.Solution = spec.Solution
			exitInfo.MatchedUserLogString = result.matchedUserLog
			exitInfo.MatchedPlatformLogString = result.matchedPlatformLog
			exitInfo.CaughtException = nil
			if result.platLog != nil || result.userLog != nil {
				exitInfo.ErrorLogs = new(ErrorLogs)
				exitInfo.ErrorLogs.Platform = ptrString(strings.Join(result.platLog, "\n"))
				exitInfo.ErrorLogs.User = ptrString(strings.Join(result.userLog, "\n"))
			}
			break
		}
	}

	if !isMatch {
		exitInfo.Exitcode = a.defaulExitCode
		exitInfo.OriginUserExitCode = userExitCode
		exitInfo.ErrorLogs = new(ErrorLogs)
		exitInfo.ErrorLogs.Platform = ptrString(strings.Join(a.extractNlineTailLog(platformLog, a.maxRuntimeLogLines), "\n"))
		exitInfo.ErrorLogs.User = ptrString(strings.Join(a.extractNlineTailLog(userLog, a.maxUserLogLines), "\n"))
	}

	return &exitInfo, nil
}

// DumpExitSummary dump the summarized exit info into file
func (a *ErrorAggregator) DumpExitSummary(exitInfo *RuntimeExitInfo, dumpFile io.Writer) error {
	var aggregateLog []string
	truncatedData, err := a.truncateExitSummary(exitInfo)
	if err != nil {
		a.logger.Error("failed to get truncate exit info, err:", err)
		return err
	}

	aggregateLog = append(aggregateLog, a.aggExitInfoBegin, string(truncatedData), a.aggExitInfoEnd)
	_, err = dumpFile.Write([]byte(strings.Join(aggregateLog, "\n")))
	if err != nil {
		a.logger.Error("failed to write runtime exit info into file:", err)
		return err
	}
	return nil
}

func (a *ErrorAggregator) getPatternLoc(regex string, content []byte) ([]int, error) {
	r, err := regexp.Compile(regex)
	if err != nil {
		return nil, err
	}
	loc := r.FindIndex(content)
	return loc, nil
}

func (a *ErrorAggregator) mergeLogs(lhs []string, rhs []string, matchString string, content string, index int) []string {
	var res []string
	res = append(res, lhs...)
	if lhs != nil && index > 0 && content[index-1] != '\n' {
		res[len(res)-1] = lhs[len(lhs)-1] + matchString
	} else {
		res = append(res, matchString)
	}

	if e := index + len(matchString); rhs != nil && e < len(content) && content[e] != '\n' {
		res[len(res)-1] = res[len(res)-1] + rhs[0]
		res = append(res, rhs[1:]...)
	} else {
		res = append(res, rhs...)
	}
	return res
}

func (a *ErrorAggregator) extractNlineTailLog(conent []byte, maxLogLines int) []string {
	var start int
	if logLen := len(conent); logLen > a.maxAggregateLogSize {
		start = logLen - a.maxAggregateLogSize
	}
	truncatedLog := string(conent[start:])
	truncatedLogLines := strings.Split(strings.ReplaceAll(truncatedLog, "\r\n", "\n"), "\n")
	lenth := len(truncatedLogLines)
	if lenth < maxLogLines {
		return truncatedLogLines
	}
	return truncatedLogLines[lenth-maxLogLines:]
}

func (a *ErrorAggregator) extractMatchLog(loc []int, content []byte, maxLogLines int) ([]string, error) {
	// use simple rules. will extract 2 lines above the match pattern and other lines below the match pattern
	if loc == nil {
		// fallback to extract tail logs
		return a.extractNlineTailLog(content, maxLogLines), nil
	}

	if len(loc) < 2 {
		return nil, errors.New("loc is invalid")
	}

	startPos := loc[0] - a.maxAggregateLogSize
	endPos := loc[1] + a.maxAggregateLogSize

	if startPos < 0 {
		startPos = 0
	}

	if endPos >= len(content) {
		endPos = len(content)
	}

	matchString := string(content[loc[0]:loc[1]])
	curContent := string(content[startPos:endPos])
	curContent = strings.ReplaceAll(curContent, "\r\n", "\n")

	i := strings.Index(curContent, matchString)
	lhsLines := strings.Split(curContent[:i], "\n")
	rhsLines := strings.Split(curContent[i+len(matchString):], "\n")

	// if the logs behind match string only contains few lines, try to etract more logs before the match string
	lhsLineOffset := 3
	if lines := maxLogLines - lhsLineOffset - 1; len(rhsLines) < lines {
		lhsLineOffset = maxLogLines - len(rhsLines) - 1
	}

	var lhsStart, rhsEnd int
	if lhsStart = len(lhsLines) - lhsLineOffset; lhsStart < 0 {
		lhsStart = 0
	}

	if rhsEnd = len(rhsLines) + maxLogLines; rhsEnd > len(rhsLines) {
		rhsEnd = len(rhsLines)
	}
	logLines := a.mergeLogs(lhsLines[lhsStart:], rhsLines[:rhsEnd], matchString, curContent, i)
	return logLines, nil
}

func (a *ErrorAggregator) getMatchedLogString(loc []int, log []byte) *string {
	if loc != nil && len(loc) == 2 {
		match := log[loc[0]:loc[1]]
		if len(match) > a.maxMatchLogLen {
			match = match[:a.maxMatchLogLen]
		}
		return ptrString(string(match))
	}
	return nil
}

func (a *ErrorAggregator) matchSpecPatten(spec *runtimeErrorSpec, userExitCode int, userLog []byte, platformLog []byte) (bool, *matchResult) {
	var result = new(matchResult)
	var platPatternLoc, userPatternLoc []int
	var err error

	for _, p := range spec.Patterns {
		if p.ExitCode != undefinedExitCode && p.ExitCode != userExitCode {
			continue
		}

		if p.PlatformLogRegex != nil {
			platPatternLoc, err = a.getPatternLoc(*p.PlatformLogRegex, platformLog)
			if err != nil {
				a.logger.Error("Regex pattern is invalid", err)
				continue
			}
			if platPatternLoc == nil {
				continue
			}
		}
		if p.UserLogRegex != nil {
			userPatternLoc, err = a.getPatternLoc(*p.UserLogRegex, userLog)
			if err != nil {
				a.logger.Error("regex pattern is invalid", err)
				continue
			}
			if userPatternLoc == nil {
				continue
			}
		}

		// we can get matched pattern here
		var paltLogLines, userLogLines []string
		paltLogLines, err = a.extractMatchLog(platPatternLoc, platformLog, a.maxRuntimeLogLines)
		if err != nil {
			a.logger.Error("extract platLog error", err)
		}

		userLogLines, err = a.extractMatchLog(userPatternLoc, userLog, a.maxUserLogLines)
		if err != nil {
			a.logger.Error("extract userLog error", err)
		}

		result.matchedUserLog = a.getMatchedLogString(userPatternLoc, userLog)
		result.matchedPlatformLog = a.getMatchedLogString(platPatternLoc, platformLog)
		result.platLog = paltLogLines
		result.userLog = userLogLines
		return true, result
	}
	return false, nil
}

func (a *ErrorAggregator) getTailContentFromFile(f *os.File, maxTailSize int64) ([]byte, error) {
	stat, err := f.Stat()
	if err != nil {
		return nil, err
	}

	off := int64(0)
	fileSize := stat.Size()
	readSize := fileSize

	if fileSize == 0 {
		return nil, nil
	}

	if fileSize > maxTailSize {
		off = fileSize - maxTailSize
		readSize = maxTailSize
	}

	content := make([]byte, readSize)
	_, err = f.ReadAt(content, off)
	return content, err
}

func (a *ErrorAggregator) truncateLog(logConent *string, truncateSize int) (*string, int) {
	logSize := len(*logConent)
	if logSize > truncateSize {
		truncatedLog := (*logConent)[truncateSize:]
		return &truncatedLog, logSize - len(truncatedLog)
	}
	return nil, logSize
}

func (a *ErrorAggregator) truncateExitSummary(runtimeExitInfo *RuntimeExitInfo) ([]byte, error) {
	data, err := yaml.Marshal(runtimeExitInfo)
	if err != nil {
		return nil, err
	}

	exitInfoSize := len(data)
	leftSize := a.maxAggregateLogSize
	if exitInfoSize <= leftSize {
		return data, nil
	}
	remainTruncateSize := exitInfoSize - leftSize

	if runtimeExitInfo.ErrorLogs != nil {
		// truncate runtime log first
		truncatedRuntimeLog, trucatedSize := a.truncateLog(runtimeExitInfo.ErrorLogs.Platform, remainTruncateSize)
		runtimeExitInfo.ErrorLogs.Platform = truncatedRuntimeLog
		remainTruncateSize = remainTruncateSize - trucatedSize
		if remainTruncateSize <= 0 {
			data, err := yaml.Marshal(runtimeExitInfo)
			return data, err
		}

		// truncate the user log
		truncatedUserLog, trucatedSize := a.truncateLog(runtimeExitInfo.ErrorLogs.User, remainTruncateSize)
		runtimeExitInfo.ErrorLogs.User = truncatedUserLog
		remainTruncateSize = remainTruncateSize - trucatedSize

		if remainTruncateSize <= 0 {
			data, err := yaml.Marshal(runtimeExitInfo)
			return data, err
		}
	}

	if runtimeExitInfo.MatchedPlatformLogString != nil {
		// truncate the match log
		l := len(*runtimeExitInfo.MatchedPlatformLogString) - remainTruncateSize
		if l >= 0 {
			runtimeExitInfo.MatchedPlatformLogString = ptrString((*runtimeExitInfo.MatchedPlatformLogString)[:l])
			data, err := yaml.Marshal(runtimeExitInfo)
			return data, err
		}
		remainTruncateSize = remainTruncateSize - len(*runtimeExitInfo.MatchedPlatformLogString)
		runtimeExitInfo.MatchedPlatformLogString = nil
	}

	if runtimeExitInfo.MatchedUserLogString != nil {
		l := len(*runtimeExitInfo.MatchedUserLogString) - remainTruncateSize
		if l >= 0 {
			runtimeExitInfo.MatchedUserLogString = ptrString((*runtimeExitInfo.MatchedUserLogString)[:l])
			data, err := yaml.Marshal(runtimeExitInfo)
			return data, err
		}
	}

	return nil, errors.New("Failde to truncate the exit info")
}

// SetMaxAggregateLogSize to set maxAggregateLogSize and used for test
func (a *ErrorAggregator) SetMaxAggregateLogSize(size int) {
	a.maxAggregateLogSize = size
}

// ExitInfoPrefix get aggregate log prefix
func (a *ErrorAggregator) ExitInfoPrefix() string {
	return a.aggExitInfoBegin
}

// ExitInfoSuffix get aggregate log suffix
func (a *ErrorAggregator) ExitInfoSuffix() string {
	return a.aggExitInfoEnd
}

// NewErrorAggregator create an error aggregator
func NewErrorAggregator(l *LogFiles, logger *logger.Logger) (*ErrorAggregator, error) {
	if len(l.UserLog) == 0 || len(l.RuntimeErrorLog) == 0 {
		return nil, errors.New("invalide log file")
	}

	if logger == nil {
		return nil, errors.New("logger not provide")
	}

	a := ErrorAggregator{
		logFiles:            l,
		logger:              logger,
		maxAggregateLogSize: 4096,
		maxMatchLogLen:      2048,
		maxUserLogLines:     20,
		maxRuntimeLogLines:  10,
		defaulExitCode:      255,
		maxSearchLogSize:    100 * 1024 * 1024, // 100MB
		aggExitInfoBegin:    "[PAI_RUNTIME_ERROR_START]",
		aggExitInfoEnd:      "[PAI_RUNTIME_ERROR_END]",
	}
	return &a, nil
}
