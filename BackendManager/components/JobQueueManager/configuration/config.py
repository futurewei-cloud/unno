class SQLConfig:
    host = '10.175.20.126'
    port = 49162
    db = 'unno'
    username = 'root'
    pw = 'lxit'

class ServiceConfig:
    backend_endpoint = 'http://10.175.20.126:5011'
    result_api = backend_endpoint + '/api/v1/result'


class MinioConfig:
    host = '10.175.20.126:9000'
    username = 'unno'
    pw = 'abcd1234'


class Neo4jConfig:
    host = '10.145.65.20:7474'
    username = 'neo4j'
    pw = 'abcd1234'


class LocalConfig:
    dataset_dir = '/home/bigdata/Dev/image/'
    upload_dir = '/home/bigdata/k8s/deployment/modelranking/image/'
