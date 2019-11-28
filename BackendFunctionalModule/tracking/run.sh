#!/bin/bash
set -e -x

PORT=5012

sudo docker build -t unno_tracking .

docker_major_version=`docker -v |grep -Po '(?<=Docker version )\d+'`

# for docker version > 19
if [ $docker_major_version -gt "19" ]; then
    sudo docker run --gpus '"device=GPU_ID"' --ipc="host" -d -p ${PORT}:8899 -v data:/data/ unno_tracking
else
    # for older docker
    sudo docker run --runtime=nvidia -e NVIDIA_VISIBLE_DEVICES=0 --ipc="host" -d -p ${PORT}:8899 -v data:/data/ unno_tracking
fi

curl localhost:${PORT}
