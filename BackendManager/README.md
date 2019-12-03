# Prerequisite
You need to install docker following [link](https://docs.docker.com/install/linux/docker-ce/ubuntu/).

# Set up MetadataDB (Mysql-docker)
[phpMyAdmin](https://www.phpmyadmin.net/) is a free software tool written in
PHP, intended to handle the ***administration of MySQL over the Web***. phpMyAdmin
supports a wide range of operations on MySQL and MariaDB. Frequently used
operations (managing databases, tables, columns, relations, indexes, users,
permissions, etc) can be performed via the user interface, while you still have
the ability to directly execute any SQL statement.  

We follow [dockhub](https://hub.docker.com/r/lxitgto/mysql-phpmyadmin/) to set it up.
```bash
docker pull lxitgto/mysql-phpmyadmin:v1
docker run -d -p 49160:22 -p 49161:80 -p 49162:3306 lxitgto/mysql-phpmyadmin:v1
# get the container id
CONTAINER_ID=`docker container ps | grep lxitgto/mysql-phpmyadmin:v1 | awk -F" " '{print $1}'`
echo $CONTAINER_ID
docker cp unno.sql ${CONTAINER_ID}:/unno.sql
docker exec -it ${CONTAINER_ID} /bin/bash
mysql -uroot -plxit -hlocalhost < unno.sql
```
To test, you can open http://localhost:49161/phpmyadmin in your browser with following credential:
username: root
password: lxit

You can also login by SSH
```bash
ssh root@localhost -p 49160
password: admin
```
# Set up RawdataDB (Minio)
[MinIO](https://min.io/) is High Performance Object Storage similar to AWS S3.
We use the pre-built docker image at
[dockerhub](https://hub.docker.com/r/minio/minio).

```bash
docker pull minio/minio
docker run -d -p 9000:9000 --name unno_minio -e "MINIO_ACCESS_KEY=unno" -e "MINIO_SECRET_KEY=abcd1234" -v /tmp/unno_database:/data minio/minio server /data
```

***Important***: please ensure to map `/tmp/unno_database` in host to `/data`, as `/tmp/unno_database` is shared by other applications as well.
