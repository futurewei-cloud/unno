class SQLConfig:
    host = '10.145.83.34'
    port = 49162
    db = 'unno'
    username = 'root'
    pw = 'lxit'

class ServiceConfig:
    # tracking module
    backend_endpoint = 'http://10.145.83.34:5011'
    result_api = backend_endpoint + '/api/v1/annotation'


class MinioConfig:
    host = '10.145.83.34:9000'
    username = 'unno'
    pw = 'abcd1234'
