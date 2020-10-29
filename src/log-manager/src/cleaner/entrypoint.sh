#!/bin/bash

# Copyright (c) Microsoft Corporation
# All rights reserved.
#
# MIT License
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
# documentation files (the "Software"), to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
# to permit persons to whom the Software is furnished to do so, subject to the following conditions:
# The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
# BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

set -o errexit
set -o pipefail

log_exist_time=30 # 30 day
if [ -n "${LOG_EXIST_TIME}" ]; then
  log_exist_time=${LOG_EXIST_TIME}
fi

cat > /etc/periodic/daily/remove_logs << EOF
#!/bin/bash
/usr/bin/pgrep -f ^find 2>&1 > /dev/null || find /usr/local/pai/logs/* -mtime +${log_exist_time} -type f -exec rm -fv {} \;
EOF

cat > /etc/periodic/weekly/remove_log_dir << EOF
#!/bin/bash
"/usr/bin/pgrep -f ^find 2>&1 > /dev/null || find /usr/local/pai/logs/* -mtime +${log_exist_time} -type d -empty -exec rmdir -v {} \;"
EOF

chmod a+x /etc/periodic/daily/remove_logs /etc/periodic/weekly/remove_log_dir

echo "cron job added"

crond -f -l 0

