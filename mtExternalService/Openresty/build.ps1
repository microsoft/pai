

#https://openresty.org/download/openresty-1.15.8.2-win64.zip

#https://github.com/SkyLothar/lua-resty-jwt   v0.1.11
#https://github.com/SkyLothar/lua-resty-jwt/archive/v0.1.11.zip
#https://github.com/cdbattags/lua-resty-jwt/archive/v0.2.2.zip   updatea @20200331 for RS256 jwt

#https://github.com/jkeys089/lua-resty-hmac   v0.3
#https://github.com/jkeys089/lua-resty-hmac/archive/493942b4b82e597bfbd7943e9367e480138e865a.zip

$dist_dir = ".\dist"
$dep_dir = ".\dep"
$temp_dir = ".\temp"

Write-Host "start build"

write-host "cd $PSScriptRoot"
Set-Location $PSScriptRoot


If($args.Count -gt 0)
{
    Write-Host "set dist directory as: " $args[0]
    $dist_dir = $args[0]
}
else
{
    Write-Host "use default dist directory as: " $dist_dir
}

function UnzipFile([string]$zipFile, [string]$target)
{
    $zipFile = Resolve-Path $zipFile
    $target = Resolve-Path $target

    Write-host "src:" $zipFile "dest:" $target

    $shellApp = New-Object -ComObject Shell.Application

    $zipFileFolder = $shellApp.NameSpace($zipFile)
    $targetFolder = $shellApp.NameSpace($target)
    $files = $zipFileFolder.Items()

    $targetFolder.CopyHere($files)
}


Function TryDownloadDependent
{
    $files = @(
        @{"file" = "openresty-1.15.8.2-win64.zip"; "url" = "https://openresty.org/download/openresty-1.15.8.2-win64.zip"},
        @{"file" = "lua-resty-jwt-0.2.2.zip"; "url" = "https://github.com/cdbattags/lua-resty-jwt/archive/v0.2.2.zip"},
        @{"file" = "lua-resty-hmac-0.3.zip"; "url" = "https://github.com/jkeys089/lua-resty-hmac/archive/493942b4b82e597bfbd7943e9367e480138e865a.zip"}
    )
    If(-not (Test-Path -Path $dep_dir)) 
    {
        New-Item -Path $dep_dir -type directory
    }
    foreach($file in $files)
    {
        $full_name = "${dep_dir}\" + $file.file
        If(Test-Path -Path $full_name) 
        {
            Write-Host "file ${full_name} exist, skip download"
        }
        else
        {
            Write-Host "download file" $full_name "from" $file.url
            Invoke-WebRequest -Uri $file.url -OutFile $full_name
            If(-not (Test-Path -Path $full_name)) 
            {
                Write-Host "download ${full_name} failed"
                return $False
            }
        }
        Write-Host "extract ${full_name} to $temp_dir"
        #Expand-Archive -Path $full_name -DestinationPath $temp_dir
        #msasg build server ps version is 4.0, cant use Expand-Archive, so use unzip in git's bin path, do extract
        #unzip $full_name -d $temp_dir
        UnzipFile $full_name $temp_dir
    }
    return $True
}


If(Test-Path -Path $dist_dir) 
{
    Remove-Item -Path $dist_dir -Recurse -Force
}
If(Test-Path -Path $temp_dir)
{
    Remove-Item -Path $temp_dir -Recurse -Force
}
New-Item -Path $dist_dir -type directory
New-Item -Path $temp_dir -type directory

If(-not (TryDownloadDependent))
{
    Write-Host "depend failed"
    Write-Host  "##vso[task.LogIssue type=error;]depend check error"
    Get-ChildItem -Path $dep_dir
    exit 1
}

Get-ChildItem -Path $dep_dir
Get-ChildItem -Path $temp_dir

Write-Host "copy openresty to ${dist_dir}"
Move-Item -Path "${temp_dir}\openresty-*\*" -Destination $dist_dir

Write-Host "copy project to ${dist_dir}"
#Copy-Item -Path ".\api-lua" -Destination $dist_dir -Recurse
#Copy-Item -Path ".\conf\*" -Destination "${dist_dir}\conf" -Recurse -Force
#Copy-Item -Path ".\setdns.cmd" -Destination $dist_dir
#Copy-Item -Path ".\start.bat" -Destination $dist_dir
#Copy-Item -Path ".\ServiceConfig.ini" -Destination $dist_dir
#Copy-Item -Path ".\setcert.ps1" -Destination $dist_dir
Copy-Item -Path ".\*" -Destination "${dist_dir}\" -Exclude ("dep", "dist", "temp", "build.ps1", ".gitignore")  -Recurse -Force
# copy common shared file with Nginx
Copy-Item -Path "..\Nginx\setcert.ps1" -Destination $dist_dir -Force
Copy-Item -Path "..\Nginx\setdns.ps1" -Destination $dist_dir -Force

Write-Host "copy lua jwt dep to ${dist_dir}"
Move-Item -Path "$temp_dir\lua-resty-jwt-*\lib\*" -Destination "${dist_dir}\api-lua"
Move-Item -Path "$temp_dir\lua-resty-hmac-*\lib\resty\*" -Destination "${dist_dir}\api-lua\resty"

Write-Host "remove temp dir ${temp_dir}"
Remove-Item -Path $temp_dir -Recurse -Force

$log_dir = "$dist_dir\logs"
If(Test-Path -Path $log_dir) 
{
    Remove-Item -Path $log_dir -Recurse -Force
}
Get-ChildItem -Path $dist_dir

Write-Host "Congratulations! build finished, release version at directory ${dist_dir}"
