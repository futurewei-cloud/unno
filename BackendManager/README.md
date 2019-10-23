Install docker on bare machine, https://docs.docker.com/install/linux/docker-ce/ubuntu/

Set up MetadataDB (Mysql-docker):

    docker pull lxitgto/mysql-phpmyadmin:v1
    docker run -d -p 49160:22 -p 49161:80 -p 49162:3306 lxitgto/mysql-phpmyadmin:v1
    docker cp unno.sql container-name:/unno.sql
    docker exec -it container-name /bin/bash
    mysql -uroot -plxit -hlocalhost < unno.sql

    Open http://localhost:49161/phpmyadmin in your browser with following credential:
    username: root
    password: lxit

    Login by SSH
    ssh root@localhost -p 49160
    password: admin


Set up RawdataDB (Minio):

    docker pull minio/minio
    docker run -d -p 9000:9000 --name minio_unno -e "MINIO_ACCESS_KEY=unno" -e "MINIO_SECRET_KEY=abcd1234" -v /tmp/unno_database:/data minio/minio server /data

