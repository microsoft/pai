param($file_name)

$NetConfs = Get-NetIPConfiguration | Where-Object {$_.NetProfile.Name -eq 'phx.gbl'}
If($NetConfs -and ($NetConfs.Length -gt 0))
{
    $NetConf = $NetConfs[0]
    # IPv4 AddressFamily = 2
    $DNSServer = $NetConf.DNSServer | Where-Object {$_.AddressFamily -eq 2 -and $_.ServerAddresses.Length -gt 0}
    If($DNSServer)
    {
        $Content='resolver '
        foreach($a in $DNSServer.ServerAddresses){$Content += "$a "}
        $Content += 'valid=300s ipv6=off;'
        Write-Host  $Content
        If($file_name)
        {
            $Content | Out-File  -NoNewline -Encoding ascii -FilePath $file_name  -Force
        }
        Exit 0
    }
}

Exit 1
