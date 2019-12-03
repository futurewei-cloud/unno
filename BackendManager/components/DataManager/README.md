# Introduction
Data manager is built on top to MySQL and MinIO. So, you need to setup these
services ahead following instruction [here](../..). The application dependent
API's are provided in this module

# Getting Started

Adjust [configuration](configuration/config.py) before running the service, you
can use the default value as well, as it has already been configurated to be
compatible with MySQL and MinIO following [here](../..).

### Start with command line
```
pip install -r requirements.txt
python app.py
```

### Use Dockerfile
```
sudo docker build . -t skyuuka/unno-data-manager
sudo docker run -it -p 5011:5011 skyuuka/unno-data-manager
```

### Using docker-compose
```bash
$  docker-compose up
```

