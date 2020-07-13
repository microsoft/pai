#!/bin/bash

OPENPAIDOMAIN={{k8s["master_ip"]}}
ssl_phrase={{k8s["ssl_phrase"]}}

{% if cfg["ssl_phrase"] is not defined %}
openssl genrsa -des3 -out ${OPENPAIDOMAIN}.key 1024
{% else %}
openssl genrsa -des3 -passout pass:${ssl_phrase} -out ${OPENPAIDOMAIN}.key 1024
{% endif %}

SUBJECT="/C=US/ST=Mars/L=iTranswarp/O=iTranswarp/OU=iTranswarp/CN=${OPENPAIDOMAIN}"
{% if cfg["ssl_phrase"] is not defined %}
openssl req -new -subj ${SUBJECT} -key ${OPENPAIDOMAIN}.key -out ${OPENPAIDOMAIN}.csr
{% else %}
openssl req -passin pass:${ssl_phrase} -new -subj ${SUBJECT} -key ${OPENPAIDOMAIN}.key -out ${OPENPAIDOMAIN}.csr
{% endif %}

mv ${OPENPAIDOMAIN}.key ${OPENPAIDOMAIN}.origin.key

{% if cfg["ssl_phrase"] is not defined %}
openssl rsa -in ${OPENPAIDOMAIN}.origin.key -out ${OPENPAIDOMAIN}.key
{% else %}
openssl rsa -passin pass:${ssl_phrase} -in ${OPENPAIDOMAIN}.origin.key -out ${OPENPAIDOMAIN}.key
{% endif %}

openssl x509 -req -days 3650 -in ${OPENPAIDOMAIN}.csr -signkey ${OPENPAIDOMAIN}.key -out ${OPENPAIDOMAIN}.crt
