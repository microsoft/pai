package logger

import (
	"log"
	"os"
)

// Logger used to log message
type Logger struct {
	errorLogger *log.Logger
	infoLogger  *log.Logger
}

// Log info message
func (l *Logger) Info(v ...interface{}) {
	l.infoLogger.Println(v...)
}

// Log error message
func (l *Logger) Error(v ...interface{}) {
	l.errorLogger.Println(v...)
}

// NewLogger create and init logger
func NewLogger() *Logger {
	logger := Logger{
		log.New(os.Stderr, "Error:", log.Ldate|log.Ltime|log.Lshortfile),
		log.New(os.Stderr, "Info:", log.Ldate|log.Ltime|log.Lshortfile),
	}
	return &logger
}
