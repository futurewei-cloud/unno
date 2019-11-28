import socket


def getHostIP():
    hostname = socket.gethostname()
    ip = socket.gethostbyname(hostname)
    return ip


class SQLConfig:
    # host = '10.145.83.34'
    host = getHostIP()
    port = 49162
    db = 'unno'
    username = 'root'
    pw = 'lxit'


class MinioConfig:
    port = 9000
    #host = '10.145.83.34:9000'
    host = getHostIP() + ':' + str(port)
    username = 'unno'
    pw = 'abcd1234'

