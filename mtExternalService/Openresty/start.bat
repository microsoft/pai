mkdir temp
mkdir logs

if exist D:\data\AutopilotData (
echo "Run in normal mode"
IF NOT EXIST D:\data\ASG_MTP\MTToken.ini (
ECHO Data folder D:\data\ASG_MTP\MTToken not available. Terminating service!
EXIT /B 1
)
IF NOT EXIST D:\data\ASG_MTP\MTToken\public-key.mttoken.pem (
ECHO File D:\data\ASG_MTP\MTToken\public-key.mttoken.pem not available. Terminating service!
EXIT /B 1
)
set MTAPIGW_DATA=D:\data\MTApiGW.data
rem D:\data\aptools.latest\sstool -d -i .\conf\ssl\apigw-publiccert.pem.encr -o .\conf\ssl\apigw-publiccert.pem
rem D:\data\aptools.latest\sstool -d -i .\conf\ssl\apigw-privatekey.pem.encr -o .\conf\ssl\apigw-privatekey.pem
PowerShell.exe -NoProfile -ExecutionPolicy RemoteSigned -File %~dp0\setcert.ps1
copy D:\data\ASG_MTP\MTToken\public-key.mttoken.pem .\conf\ssl\public-key.mttoken.pem
PowerShell.exe -NoProfile -ExecutionPolicy RemoteSigned -File %~dp0\setdns.ps1 .\conf\dns.conf
IF ERRORLEVEL 1 (
ECHO Setdns failed, so faild start service
EXIT /B 1
)
) else (
echo "Run in local test mode"
set MTAPIGW_DATA=C:\data\MTApiGW.data
copy .\conf\ssl\shidian.crt  .\conf\ssl\apigw-publiccert.pem
copy .\conf\ssl\shidian.key  .\conf\ssl\apigw-privatekey.pem
copy .\conf\ssl\test_public-key.mttoken.pem .\conf\ssl\public-key.mttoken.pem
rem call .\setdns.cmd
)
mkdir %MTAPIGW_DATA%\logs
@rem set JWT_SECRET=nihao
type .\conf\dns.conf
nginx.exe -p ""