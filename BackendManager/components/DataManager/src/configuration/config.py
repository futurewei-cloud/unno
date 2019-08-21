class SQLConfig:
    host = '10.145.83.34'
    port = 49162
    db = 'unno'
    username = 'root'
    pw = 'lxit'


class MinioConfig:
    host = '10.145.83.34:9000'
    username = 'bigdata'
    pw = 'abcd1234'


class Neo4jConfig:
    host = '10.145.65.20:7474'
    username = 'neo4j'
    pw = 'abcd1234'


class LocalConfig:
    dataset_dir = '/home/bigdata/Dev/image/'
    upload_dir = '/home/bigdata/k8s/deployment/modelranking/image/'
