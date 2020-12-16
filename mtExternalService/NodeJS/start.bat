if not "%1" == "" goto :execute

@echo off

set targetdir=%DATADIR%\nodejs.latest

IF EXIST "%targetdir%" (
    rem First try to remove installed.flag as fast as possible to minimize chance that spawn.cmd for dependee serviec will detect old installed.flag
    rem Folder itself will be deleted below
    del "%targetdir%"\installed.flag
)

rem
rem Create symlink targettempdir to current folder
rem
set targettempdir=%targetdir%.temp
set waitInterval=10
:makelink
IF EXIST "%targettempdir%" (
    rd /s /q "%targettempdir%"
)

rem %cd% points to current folder
mklink /d "%targettempdir%" "%cd%"

if errorlevel 1 (
  echo [%date% %time%] Failed to create symbolic link at %targettempdir%, retrying after %waitInterval% seconds
  sleep %waitInterval%
  goto :makelink
)

echo [%date% %time%] Succeeded creating symbolic link at %targettempdir%

rem
rem Copy symlink targettempdir to overwrite symlink targetdir atomically
rem
xcopy /b /i "%targettempdir%" "%targetdir%"
if errorlevel 1 (
  echo [%date% %time%] Failed to copy symbolic link from %targettempdir% to %targetdir%
  exit /b 1
)

echo [%date% %time%] Succeeded copying symbolic link from %targettempdir% to %targetdir%
rem besteffort to remove
rd /s /q "%targettempdir%"

echo [%date% %time%] Succeeded setting up nodejs
sleep 86400
exit /b 0

:execute

PATH %~dp0;%PATH%

cd %1
%1\start.bat
