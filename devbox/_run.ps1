# 1. Ask running mode
#   a. running with remote server: -> 2.a
#   b. running with local rest server: -> 2.b
# 2.a. Select remote subcluster to connect. Default: CH1
# 2.b.
#   1) Check JAVA_HOME
#   2) Select subcluster to use in local rest server. Default: CH1
#   3) Download and extract Zookeeper if haven't downloaded yet
#   4) Run Zookeeper and Nginx as background job
#   5) Start rest server
# 3. Start local webportal and open brownser
$ErrorActionPreference = "Stop"

$ConfDir = "$PSScriptRoot\conf"
$WebportalDir = "$PSScriptRoot\..\src\webportal"
$RestServerDir = "$PSScriptRoot\..\src\rest-server"
$NginxDir = "$PSScriptRoot\..\mtExternalService\Nginx"
$ToolsDir = "$PSScriptRoot\tools"
$ZookeeperVersion = "3.4.5"
$ZookeeperDir = "$ToolsDir\zookeeper-$ZookeeperVersion"

Write-Host '-- Script Start --'

function Check-Environment {
    # Check command tools
    $commandsToCheck = @("yarn", "npm")
    if (!(Check-Command $commandsToCheck)) {
        Write-Host "Command tool dependency check failed. Shutting down"
        Exit 1
    }
    Write-Host "Environment check passed"
}

function Check-Command {
    param ([String[]] $commandsToCheck)
    foreach ($command in $commandsToCheck) {
        try {
            Get-Command $command | Out-Null
        } catch {
            Write-Host "Missing dependency command tool: $command"
            Return $false
        }
    }
    Return $true
}

function Check-EnvironmentVariable {
    param ([String[]] $envVarsToCheck)
    foreach ($envVar in $envVarsToCheck) {
        if (![Environment]::GetEnvironmentVariable($envVar)) {
            Write-Host "Environment variable $envVar is not set"
            Return $false
        }
    }
    Return $true
}

function Download-Zookeeper {
    if (!(Test-Path $ToolsDir)) {
        New-Item -Path $ToolsDir -ItemType Directory | Out-Null
    }
    Push-Location -Path $ToolsDir 

    $tarball = "zookeeper-$ZookeeperVersion.tar.gz"
    Write-Host "Start downloading Zookeeper-$ZookeeperVersion"
    Invoke-WebRequest -Uri "https://archive.apache.org/dist/zookeeper/zookeeper-$ZookeeperVersion/zookeeper-$ZookeeperVersion.tar.gz" -OutFile $tarball
    Invoke-WebRequest -Uri "https://archive.apache.org/dist/zookeeper/zookeeper-$ZookeeperVersion/zookeeper-$ZookeeperVersion.tar.gz.sha1" -OutFile "$tarball.sha1"

    $fileHash = (Get-FileHash -Path $tarball -Algorithm SHA1).Hash
    $expectedHash = (-split (Get-Content -Path "$tarball.sha1"))[0]
    if ($fileHash -ne $expectedHash) {
        Write-Error "Unexpected sha1 value. $tarball may be corrupted."
        Exit 1
    }

    tar -xzf $tarball # Will extract files to "$ZookeeperDir"
    Copy-Item -Path "$ZookeeperDir\conf\zoo_sample.cfg" -Destination "$ZookeeperDir\conf\zoo.cfg"
    
    Pop-Location
}

function Start-Standalone-Webportal {
    # TODO: Compare conf and backup
    Copy-Item -Path "$ConfDir\webportal.env.remote.ini" -Destination "$WebportalDir\.env"

    Write-Host "Start Nginx"
    # In powershell 5.1, Start-Job doesn't suppoert -WorkingDirectory parameter. Use -InputObject instead
    Start-Job -Name Nginx -InputObject $NginxDir -ScriptBlock {
        Set-Location -Path $input
        cmd /c "start.bat"
    }

    Set-Location -Path $WebportalDir
    yarn
    # Maybe start job in background?
    npm run dev
}

function Start-Local-Webportal {
    # Java is mandatory for zookeeper. Check first
    if (!(Check-EnvironmentVariable @("JAVA_HOME"))) {
        Write-Error "Please install java and set JAVA_HOME in your PATH"
        Exit 1
    }

    Copy-Item -Path "$ConfDir\webportal.env.local.ini" -Destination "$WebportalDir\.env"
    Copy-Item -Path "$ConfDir\rest-server.env.ini" -Destination "$RestServerDir\.env"

    Write-Host "Start Nginx"
    # In powershell 5.1, Start-Job doesn't suppoert -WorkingDirectory parameter. Use -InputObject instead
    Start-Job -Name Nginx -InputObject $NginxDir -ScriptBlock {
        Set-Location -Path $input
        cmd /c "start.bat"
    }

    if (!(Test-Path "$ToolsDir\zookeeper-$ZookeeperVersion")) {
        # Zookeeper not found. Download it.
        Download-Zookeeper
    }
    Write-Host "Start Zookeeper"
    Start-Job -Name Zookeeper -InputObject $ZookeeperDir -ScriptBlock {
        Set-Location -Path $input
        & bin\zkServer.cmd
    }

    Write-Host "Start Rest Server"
    Start-Job -Name RestServer -InputObject $RestServerDir -ScriptBlock {
        Set-Location -Path $input
        npm install
        npm start
    }
    # TODO: Call Receive-Job to fetch Logs or open a new window

    Set-Location -Path $WebportalDir
    yarn
    npm run dev
}

function Teardown {
    # TODO: Catch ctrl-c (or other machanism) to gracefully stop
}

Check-Environment
# TODO: Make nicer-look options menu
$options = [System.Management.Automation.Host.ChoiceDescription[]] @("&1. Start standalone Webportal with remote rest server", "&2. Start webportal with local rest server")
$opt = $host.UI.PromptForChoice("Mode selection", $null, $Options, -1)
switch($opt)
{
    0 { Start-Standalone-Webportal }
    1 { Start-Local-Webportal }
}
