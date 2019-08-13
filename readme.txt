Mysql-docker:
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


Minio:
	docker pull minio/minio
	docker run -p 9000:9000 --name minio1 -e "MINIO_ACCESS_KEY=wenjiangfan" -e "MINIO_SECRET_KEY=wenjiangfan" -v /mnt/data:/data -v /mnt/config:/root/.minio minio/minio server /data

