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

# API Documentation

Note that you can get the host IP by `curl ifconfig.me`

* http://HOSTNAME/tracking/api/sot ['POST']

  NOTE:  
  - Query: do POST with json blob in the format of 
  ```
  {
      "username":string,
      "job_id":int,  
      "video_id":int,
      "entity_id":int,
      "bbox":"X,Y,W,H",  # normalized value in [0,1]
      "start_frame":int, # initialization frame with given bbox
      "end_frame":int,   # last frame to track, exclusive
      "result_api":END_POINT
  }
  ```
  
  ```
  # API call example:
  curl -i -H "Content-Type: application/json" -X POST /
  -d '{"username":"NAME", "job_id":0,"video_id":0, "entity_id":0, "bbox":"0.64,0.39,0.25,0.33","start_frame":1,"end_frame":10, "result_api":"http://10.145.83.34:8899/mirror"}' /
  http://HOSTNAME/tracking/api/sot
  ```
  
  - Response: json blob of tracking results in the format of
  ```
  {
      "tracking_results":
      {
          "FRAME_ID":"X,Y,W,H",  # bbox normalized value in [0,1]
          ...
      },
       ...
       PASS THROUGH INFO IN QUERY
       ...
  }
  ```
 
 # Model
 Tracking model is commonly supported with necessary changes. 
 Currently, we are using [PySOT](https://github.com/STVIR/pysot) as the backend model.
