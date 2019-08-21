FROM ubuntu:latest

RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get install -y --fix-missing python2.7-dev \
    python-pip \
    && apt-get clean && rm -rf /tmp/* /var/tmp/*

COPY . /root/src

RUN cd /root/src && \
    pip install -r requirements.txt

CMD cd /root/src && \
    python -u app.py
