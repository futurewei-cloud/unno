docker build -t analyzer:latest .
docker run -t -d analyzer:latest
docker logs container_name