mkdir temp
mkdir logs

if exist D:\data\AutopilotData (
echo "Run in normal mode"
rem D:\data\aptools.latest\sstool -d -i .\conf\ssl\magnetar-publiccert.pem.encr -o .\conf\ssl\magnetar-publiccert.pem
rem D:\data\aptools.latest\sstool -d -i .\conf\ssl\magnetar-privatekey.pem.encr -o .\conf\ssl\magnetar-privatekey.pem
PowerShell.exe -NoProfile -ExecutionPolicy RemoteSigned -File %~dp0\setcert.ps1
PowerShell.exe -NoProfile -ExecutionPolicy RemoteSigned -File %~dp0\setdns.ps1 .\conf\dns.conf
IF ERRORLEVEL 1 (
ECHO Setdns failed, so faild start service
EXIT /B 1
)
PowerShell.exe -Command "(gc env.ini.flattened.ini) -replace '{CLUSTER}', '%CLUSTER%'.ToUpper() | Out-File -encoding ASCII .env"
PowerShell.exe -NoProfile -ExecutionPolicy RemoteSigned -File %~dp0\envsubst.ps1 .\webportal\env.js.template .env .\webportal\env.js
IF ERRORLEVEL 1 (
ECHO set env.js failed, so faild start service
EXIT /B 1
)
) else (
echo "Run in local test mode"
if not exist d: subst D: temp
echo manually remove D: by cmd subst D: /D
copy .\conf\ssl\shidian.crt  .\conf\ssl\magnetar-publiccert.pem
copy .\conf\ssl\shidian.key  .\conf\ssl\magnetar-privatekey.pem
)
mkdir D:\data\MTNginx.data\logs
mkdir D:\data\MTNginx.data\cache
type .\conf\dns.conf
nginx.exe
