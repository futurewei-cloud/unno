docker build -t runner:latest .
docker run -t -d runner:latest
docker logs container_name

python -m src.app