@echo off

SET ENVINIFILENAME=env.ini.flattened.ini
SET ENVFILENAME=.env
SET ENVINIFILETEMP=.envTmp

REM generate .env file
more +1 %ENVINIFILENAME% > %ENVINIFILETEMP%

REM replace {CLUSTER} to upper case %CLUSTER%
powershell -Command "(gc %ENVINIFILETEMP%) -replace '{CLUSTER}', '%CLUSTER%'.ToUpper() | Out-File -encoding ASCII %ENVFILENAME%"

SET NODEPATH=D:\data\nodejs.latest\
SET "PATH=%NODEPATH%;%PATH%"

SET YARNPATH=D:\data\nodeYarnpkg.latest\bin
SET "PATH=%YARNPATH%;%PATH%"

echo %PATH%
call yarn build
call yarn start

echo [MTWebportal]errorlevel=%errorlevel%
if %errorlevel% NEQ 0 (
    echo [%date% %time%] Failed to start web portal
    exit /b 1
)