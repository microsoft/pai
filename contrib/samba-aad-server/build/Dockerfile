FROM ubuntu:16.04

COPY krb5.conf /etc/krb5.conf
COPY nsswitch.conf /etc/nsswitch.conf

RUN apt-get update && \
    apt-get install -y \
        samba \
        attr \
        winbind \
        libpam-winbind \
        libnss-winbind \
        libpam-krb5 \
        krb5-config \
        krb5-user \
        cifs-utils \
        nginx \
        python-dev \
        python-pip

RUN pip install flask \
        flask_restful \
        uwsgi

COPY smb.conf /etc/samba/smb.conf
COPY default /etc/nginx/sites-available/default

ENV SHARE_ROOT=/share/pai

ADD infosrv /infosrv
RUN mkdir -p /infosrv/uwsgi
COPY run.sh /run.sh
RUN chmod +x /run.sh
COPY sambauserhomecreate /usr/bin/
RUN chmod +x /usr/bin/sambauserhomecreate
COPY sambadatacreate /usr/bin/
RUN chmod +x /usr/bin/sambadatacreate

CMD /run.sh
