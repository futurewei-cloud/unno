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

## Run with bash script
```
$ bash run.sh
```

## Run with Docker compose
```bash
$ docker-compose up
```

## Run with Kubernetes (TODO)
```bash
$ kubectl apply -f unno_tracking.yaml
```

## API Documentation
Check [here](API.md) for details.

## Model
Tracking model is commonly supported with necessary changes.  Currently, we are
using [PySOT](https://github.com/STVIR/pysot) as the backend model.
