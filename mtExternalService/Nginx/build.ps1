# This script is used to build product version which integrate webportal static page
# When run in local debug you should not run build script, you just need run start.bat
# Before run this build script you should run webportal build first like bellow
# 1) cd webportal
# 2) yarn install
# 3) yarn build

$dist_dir = ".\dist"
$webportal_dir = "..\..\src\webportal"

$ErrorActionPreference = 'Stop'

Write-Host "start build"

Write-Host "cd $PSScriptRoot"
Set-Location $PSScriptRoot

If(!(Test-Path -Path "$webportal_dir\dist"))
{
    Write-Host "$webportal_dir\dist not exist, try to build"
    Set-Location $webportal_dir
    yarn install
    yarn build
    Set-Location $PSScriptRoot
}

If($args.Count -gt 0)
{
    Write-Host "set dist directory as: " $args[0]
    $dist_dir = $args[0]
}
else
{
    Write-Host "use default dist directory as: " $dist_dir
}

If(Test-Path -Path $dist_dir)
{
    Remove-Item -Path $dist_dir -Recurse -Force
}
New-Item -Path $dist_dir -type directory

Write-Host "copy nginx to ${dist_dir}"
Copy-Item -Path ".\*" -Destination "${dist_dir}\" -Exclude ("dist", "build.ps1", ".gitignore", "temp", "logs")  -Recurse -Force

Write-Host "copy webportal dist to ${dist_dir}"
Copy-Item -Path "$webportal_dir\env.ini" -Destination $dist_dir -Force
Copy-Item -Path "$webportal_dir\dist" -Destination "$dist_dir\webportal" -Force -Recurse
Copy-Item -Path "$webportal_dir\src\app\env.js.template" -Destination "$dist_dir\webportal" -Force

Get-ChildItem -Path $dist_dir

Write-Host "Congratulations! build finished, release version at directory ${dist_dir}"
