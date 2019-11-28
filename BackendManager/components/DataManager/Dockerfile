FROM ubuntu:latest

RUN apt-get -y update && apt-get -y upgrade
RUN apt-get install -y --fix-missing python2.7-dev \
    python-pip \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && apt-get clean && rm -rf /tmp/* /var/tmp/*

COPY . /root/src

WORKDIR /root/src
RUN pip install -r requirements.txt
CMD python -u app.py
