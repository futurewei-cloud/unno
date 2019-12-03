FROM nvidia/cuda:10.0-cudnn7-devel-ubuntu16.04

## get python 3.7
RUN apt-get update && apt-get install -y software-properties-common sudo
RUN sudo add-apt-repository ppa:deadsnakes/ppa
RUN sudo apt-get update && apt-get install -y python3.7-dev
RUN sudo update-alternatives --install /usr/bin/python python /usr/bin/python3.5 1 && sudo update-alternatives --install /usr/bin/python python /usr/bin/python3.7 2

RUN sudo apt-get install -y curl git libsm6 libxext6 libxrender-dev
RUN curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py && python get-pip.py
#RUN pip install https://download.pytorch.org/whl/cu90/torch-0.4.1-cp37-cp37m-linux_x86_64.whl
RUN pip install torch==0.4.1.post2
RUN pip install torchvision==0.2.2.post3
RUN pip install numpy pyyaml yacs tqdm colorama matplotlib cython
RUN pip install opencv-python tensorboardX

## get pysot
WORKDIR /app
RUN git clone https://github.com/STVIR/pysot.git
WORKDIR /app/pysot
RUN python setup.py build_ext --inplace
COPY ./model/ /app/pysot/experiments/

## set flask service
RUN pip install flask requests
WORKDIR /app/tracking
COPY tracker.py /app/tracking/
COPY app.py /app/tracking/
RUN chmod a+x app.py

ENV PYTHONPATH "/app/pysot:${PYTHONPATH}"

ENTRYPOINT ["/app/tracking/app.py"]
EXPOSE 30164
