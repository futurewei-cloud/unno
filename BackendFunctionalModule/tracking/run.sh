#!/bin/bash
set -e -x

PORT=8899

sudo docker build -t skyuuka/unno-tracking .

docker_major_version=`docker -v |grep -Po '(?<=Docker version )\d+'`

# for docker version > 19
if [ $docker_major_version -gt "19" ]; then
    sudo docker run --gpus '"device=GPU_ID"' --ipc="host" -d -p ${PORT}:30164 -v data:/data/ skyuuka/unno-tracking
else
    # for older docker
    sudo docker run --runtime=nvidia -e NVIDIA_VISIBLE_DEVICES=0 --ipc="host" -d -p ${PORT}:30164 -v data:/data/ skyuuka/unno-tracking
fi
