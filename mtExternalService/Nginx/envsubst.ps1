param($Template, $EnvFile, $OutFile)

# replace environment variable in Template from EnvFile
# variable format is : ${VARIABLE_NAME}
#
# format of Template content:
# serviceName: '${SERVICE_NAME}'
# debugProxyUri: '${DEBUG_PROXY_URI}'
#
# format of EnvFile content:
# DEBUG_PROXY_URI=/cache
# SERVICE_NAME=MT
#
# result of replaced Template will write to OutFile
# serviceName: 'MT'
# debugProxyUri: '/cache'

Write-Host Template: $Template
Write-Host EnvFile: $EnvFile
Write-Host OutFile: $OutFile

If((-not $Template) -or (-not $EnvFile) -or (-not $OutFile))
{
    Write-Error "bad parameter"
    Write-Error Usage: setenvjs.ps1 Template EnvFile OutFile
    Exit 1
}
If ((!(Test-Path $Template)) -or (!(Test-Path $EnvFile)))
{
    Write-Error "$Template or $EnvFile not exist"
    Exit 1
}

$Template_Content = (Get-Content -Path $Template  -Raw)
If(!$Template_Content)
{
    Write-Error "$Template is empty"
    Exit 1
}

foreach($line in Get-Content $EnvFile)
{
    if($line -match "^#")
    {
        Write-Host "Skip line: $line"
    }
    elseif($line -match "(.*)=(.*)")
    {
        $key = '${' + $matches[1].ToString() + '}'
        $value = $matches[2].ToString()
        $Template_Content = $Template_Content.Replace($key, $value)
    }
}

$Template_Content | Set-Content -NoNewline -Path $OutFile -Force
