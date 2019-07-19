#!/bin/bash

# Original work Copyright (c) 2015 Steffen Bleul
# Modified work Copyright (c) Microsoft Corporation
# All rights reserved.
#
# MIT License


# A helper script for ENTRYPOINT.

set -e

[[ ${DEBUG} == true ]] && set -x

if [ -n "${DELAYED_START}" ]; then
  sleep ${DELAYED_START}
fi

# Logrotate status file handling
readonly logrotate_logstatus=${LOGROTATE_STATUSFILE:-"/logrotate-status/logrotate.status"}

# ----- Crontab Generation ------

logrotate_parameters=""

if [ -n "${LOGROTATE_PARAMETERS}" ]; then
  logrotate_parameters="-"${LOGROTATE_PARAMETERS}
fi

syslogger_tag=""

if [ -n "${SYSLOGGER_TAG}" ]; then
syslogger_tag=" -t "${SYSLOGGER_TAG}
fi

syslogger_command=""

if [ -n "${SYSLOGGER}" ]; then
  syslogger_command="logger "${syslogger_tag}
fi

logrotate_cronlog=""

if [ -n "${LOGROTATE_LOGFILE}" ] && [ -z "${SYSLOGGER}"]; then
  logrotate_cronlog=" 2>&1 | tee -a "${LOGROTATE_LOGFILE}
else
  if [ -n "${SYSLOGGER}" ]; then
    logrotate_cronlog=" 2>&1 | "${syslogger_command}
  fi
fi

logrotate_croninterval="1 0 0 * * *"

if [ -n "${LOGROTATE_INTERVAL}" ]; then
  case "$LOGROTATE_INTERVAL" in
    hourly)
      logrotate_croninterval='@hourly'
    ;;
    daily)
      logrotate_croninterval='@daily'
    ;;
    weekly)
      logrotate_croninterval='@weekly'
    ;;
    monthly)
      logrotate_croninterval='@monthly'
    ;;
    yearly)
      logrotate_croninterval='@yearly'
    ;;
    *)
      logrotate_croninterval="1 0 0 * * *"
    ;;
  esac
fi

if [ -n "${LOGROTATE_CRONSCHEDULE}" ]; then
  logrotate_croninterval=${LOGROTATE_CRONSCHEDULE}
fi

logrotate_cron_timetable="/usr/sbin/logrotate ${logrotate_parameters} --state=${logrotate_logstatus} /usr/bin/logrotate.d/logrotate.conf ${logrotate_cronlog}"

# ----- Cron Start ------

if [ "$1" = 'cron' ]; then
  exec /usr/bin/go-cron "${logrotate_croninterval}" /bin/bash -c "${logrotate_cron_timetable}"
fi

#-----------------------

exec "$@"
