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

@rem Start a new cmd.exe to avoid exit the caller cmd.exe.
cmd /c "%~dp0build-internal.bat" %*