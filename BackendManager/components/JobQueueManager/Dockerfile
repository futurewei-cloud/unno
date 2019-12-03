FROM ubuntu:latest
#FROM continuumio/anaconda

RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get install -y --fix-missing python2.7-dev \
    python-pip \
    && apt-get clean && rm -rf /tmp/* /var/tmp/*
RUN apt-get install -y libsm6 libxext6 libxrender-dev


COPY . /root/src
WORKDIR /root/src 
RUN pip install -r requirements.txt
CMD python -u app.py
