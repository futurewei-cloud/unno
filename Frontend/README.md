# UNNO - Frontend

## Getting Started:

* Install [nodejs](https://nodejs.org/)
```
# Using Ubuntu
$ curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
$ sudo apt-get install -y nodejs
```

* Configure backend endpoint
  In `src/api.js`, fill in backend endpoit at `const BASE_URL = `

* Navigate to this directory (unno/Frontend) in a command prompt
* Run `npm install`
* Then...
  - For Development:
  ```bash
  $ npm start
  ```
   The script will open a tab in your default browser and load the app when it's done compiling.
  - For Production:
    ```bash
    $ npm run build
    ```
    The compiled files will be saved to `unno/BackendManager/FrontendProd`.
    You can check the buld artifact by `find ../BackendManager/FrontendProd`


### Example of setting up a production Web server hosting this app
- Install NGINX
```
sudo apt-get update
sudo apt-get install nginx
```

- Configure NGINX
create a new configuration,
```
cd /etc/nginx/sites-available
sudo vim unno
```

copy the following content to the newly created file and save,
```
server {
  listen 80 default_server;
  listen [::]:80 default_server;
  root $CODEBASE_PATH$/BackendManager/FrontendProd;
  index index.html;
  server_name _;
  location / {
    try_files $uri $uri/ =404;
  }
}
```

enable the app in web server,
```
sudo ln -s /etc/nginx/sites-available/unno /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
```

restart the server,
```
sudo systemctl restart nginx
```
