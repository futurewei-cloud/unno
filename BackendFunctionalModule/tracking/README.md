# Tracking service for automatic annotation generation

This is a simple service providing RESTful APIs of tracking functionality.
With given image and corresponding target location, tracking results upon an
image set will be generated automatically and passed to a specified storage
endpoint for data persistence.

# Getting Started
All dependencies are built into a Docker environment.  Build and run the docker
image to start the service.  NOTE: model files should be downloaded and saved
to `model` folder, models currently used are
[here](https://github.com/STVIR/pysot/blob/master/MODEL_ZOO.md)

## How to run?
### Run with bash script (Easiest)
```
$ bash run.sh
```
Notes: ensure the port `8899` is available, as the service end point will 
be <host-ip-addres>:8899


### Run with Docker compose
```bash
$ docker-compose up
```
Notes: ensure the port `8899` is available, as the service end point will 
be <host-ip-addres>:8899

### Run with Kubernetes (TODO)
```bash
$ kubectl apply -f kube-unno-tracking.yaml
```
Caveat: `kubeadm` does not support LoadBalancer natively, so we are using 
NodePort in this case. The outcome is  you need to know of the IP address
of the worker machine in order to access it in order to access to service, 
something like <worker-ip-address>:30164

## Add endpoint to function pool
Check the database information in the [base database setup](../../BackendManager/components/BaseDatabase/),
and properly use the following commands to update the function table in unno database
```bash
# login to the database
ssh root@localhost -p 49160
mysql -uroot -plxit -hlocalhost
# SQL statements
SHOW databases;
USE unno;
SELECT * FROM function;
INSERT INTO function (endpoint, status) VALUES (host-ip-address:8899, 0)
```
TODO: use load balancer to handle mulitple tracking points.

## API Documentation
Check [here](API.md) for details.

## Model
Tracking model is commonly supported with necessary changes.  Currently, we are
using [PySOT](https://github.com/STVIR/pysot) as the backend model.
