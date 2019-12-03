# Introduction

This module is used to mange Tracking jobs, it keeps checking the database to
find available job and then send them to tracking service to get tracking
results.


# Getting Started

Adjust [configuration](configuration/config.py) before running the service. 

## start job manager service with commandline
```bash
pip install -r requirements.txt
python app.py
```
### Use Dockerfile
```
sudo docker build . -t skyuuka/unno-job-manager
sudo docker run -it skyuuka/unno-job-manager
```
