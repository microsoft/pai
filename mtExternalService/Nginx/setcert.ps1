param($Flag)

$cert_name_enc = ""
$cert_name_dec = ""
$key_name_enc = ""
$key_name_dec = ""
$ports = @()

function load_config($file_name)
{
    $config = (Get-Content -Path $file_name  -Raw) | ConvertFrom-Json
    
    $global:cert_name_enc = $config.cert_name_enc
    $global:cert_name_dec = $config.cert_name_dec
    $global:key_name_enc = $config.key_name_enc
    $global:key_name_dec = $config.key_name_dec
    $global:ports = $config.ports
    
    Write-Host cert_name_enc: $global:cert_name_enc
    Write-Host cert_name_dec: $global:cert_name_dec
    Write-Host key_name_enc: $global:key_name_enc
    Write-Host key_name_dec: $global:key_name_dec
    Write-Host ports: $global:ports
}

$Env:HADOOP_HOME = "D:\data\hadoop.latest"
& (Join-Path $Env:HADOOP_HOME "CommonHadoop.ps1")

Function set_cert()
{
    $cert_content = APSsToolDecrypt -EncrFilePath $cert_name_enc
    $cert_content | Out-File  -NoNewline -Encoding ascii -FilePath $cert_name_dec  -Force

    $key_content = APSsToolDecrypt -EncrFilePath $key_name_enc
    $key_content | Out-File  -NoNewline -Encoding ascii -FilePath $key_name_dec  -Force
}

add-type @"
    using System.Net;
    using System.Security.Cryptography.X509Certificates;
    public class TrustAllCertsPolicy : ICertificatePolicy {
        public bool CheckValidationResult(
            ServicePoint srvPoint, X509Certificate certificate,
            WebRequest request, int certificateProblem) {
            return true;
        }
    }
"@
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

Function empty_file($file_name)
{
    If((Test-Path -Path $file_name))
    {
        $f = Get-Item $file_name
        If($f)
        {
            If($f.Length -gt 0)
            {
                return $False
            }
        }
    }
    return $True
}

Function delete_cert()
{
    For($i=1;$i -le 10;$i++)
    {
        # may deleted by other process
        If((empty_file($cert_name_dec)) -and (empty_file($key_name_dec)))
        {
            return
        }
        $status = $True
        Foreach($port in $ports)
        {
            $url = "https://localhost:$port/"
            $res = Invoke-WebRequest -UseBasicParsing -Uri $url -Method GET
            If($res -and ($res.StatusCode -eq 200))
            {
                Write-host "req:" $url "res:" $res.StatusCode $res
            }
            else
            {
                $status = $False
                Start-Sleep -s 5
            }
        }
        If($status)
        {
            break
        }
    }
    Remove-Item -Path $cert_name_dec -Force
    Remove-Item -Path $key_name_dec -Force
}

load_config ".\conf\ssl\cert-check.json"
If($Flag -eq "delete")
{
    delete_cert
}
Else
{
    set_cert
    Write-Host "set cert, then delete it after nginx loaded cert"
    Start-Process -NoNewWindow -FilePath PowerShell.exe -ArgumentList "-NoProfile -ExecutionPolicy RemoteSigned -File $PSScriptRoot\setcert.ps1 delete"
}
