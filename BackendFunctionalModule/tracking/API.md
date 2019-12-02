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
