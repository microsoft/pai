@echo off

SET ENVINIFILENAME=env.ini.flattened.ini
SET ENVINIFILETEMP=.envTmp
SET ENVFILENAME=.env
SET ZKDETECTSERVICECONFIG=MTZK_DETECTSERVICE_URI

SET NODEPATH=D:\data\nodejs.latest\
SET "PATH=%NODEPATH%;%PATH%"

REM generate .env file
more +1 %ENVINIFILENAME% > %ENVINIFILETEMP%

REM replace {CLUSTER} to upper case %CLUSTER%
powershell -Command "(gc %ENVINIFILETEMP%) -replace '{CLUSTER}', '%CLUSTER%'.ToUpper() | Out-File -encoding ASCII %ENVFILENAME%"

REM fetch zookeeper connection string
node -e "require('axios')({url: `${require('ini').parse(fs.readFileSync('%ENVINIFILENAME%', 'utf8')).Configuration.%ZKDETECTSERVICECONFIG%}`}).then((res) => {require('fs').appendFileSync('.env', 'ZOOKEEPER_CONNECTION_STR='+res.data+'\n')})"

REM set admin MT_TOKEN if not provided
@if "%MT_TOKEN%"=="" call SetMTToken.bat

echo %PATH%
npm start