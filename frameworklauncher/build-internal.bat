@echo off

@rem Copyright (c) Microsoft Corporation
@rem All rights reserved.
@rem
@rem MIT License
@rem
@rem Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
@rem documentation files (the "Software"), to deal in the Software without restriction, including without limitation
@rem the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
@rem to permit persons to whom the Software is furnished to do so, subject to the following conditions:
@rem The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
@rem
@rem THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
@rem BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
@rem NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
@rem DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
@rem OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

setlocal enableextensions enabledelayedexpansion
pushd %~dp0

echo Start to make Binary Distributions into directory: dist

if exist dist (
  call :run rmdir /s /q dist
)
call :run mkdir dist
call :run mvn clean install
call :run copy /b /y target\*-with-dependencies.jar dist\
call :run copy /b /y bin\* dist\
call :run copy /b /y conf\* dist\
goto :stop

:run
echo cmd /c %*
cmd /c %*
set exitcode=%errorlevel%
if %exitcode% neq 0 (
  goto :stop
) else (
  exit /b %exitcode%
)

:stop
if %exitcode% neq 0 (
  echo Failed to make Binary Distributions with exitcode %exitcode%
) else (
  echo Succeed to make Binary Distributions with exitcode %exitcode%
)
popd
exit %exitcode%

endlocal
