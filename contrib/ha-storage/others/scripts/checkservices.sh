#!/bin/bash

logpath="/var/log/drbdha"

genePath(){
    if [ ! -d "$logpath" ];then
        mkdir -p $logpath
    fi
}

restartService(){
    local curtime=$(date "+%F-%H:%M:%S")
    echo "${curtime} [restart ${1}]" &>> $logpath/$1.log
    /etc/init.d/$1 restart &>> $logpath/$1.log
}

checkService(){
    local curtime=$(date "+%F-%H:%M:%S")
    echo "${curtime} [status ${1}]" &>> $logpath/$1.log
    /etc/init.d/$1 status &>> $logpath/$1.log
}

checkStatus(){
    genePath
    services=("nfs-kernel-server" "drbd" "keepalived")
    flag=0
    for service in "${services[@]}"
    do
        checkService $service
        if [ $? -ne 0 ];then
            restartService $service
            if [ $? -ne 0 ];then
                flag=1
                local curtime=$(date "+%F-%H:%M:%S")
                echo "${curtime} [failed ${service}]" &>> $logpath/$service.log
            else
                #local curtime=$(date "+%F-%H:%M:%S")
                #echo "${curtime} [succeeded ${service}]" &>> $logpath/$service.log
            fi
        else
            local curtime=$(date "+%F-%H:%M:%S")
            echo "${curtime} [succeeded ${service}]" &>> $logpath/$service.log
        fi
    done
    exit $flag
}

checkStatus