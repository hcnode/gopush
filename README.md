## What is this ?
this is a solution of socket.io base application which deploy by [pm2](https://github.com/Unitech/pm2) with cluster mode, and to subscribe event with socket.io-redis cross different socket.io instances, and these network enviroment are all behind a layer of ngnix.

## What is the problem ?
when using socket.io with cluster mode, you will meet the sticky sesson issue.

![without_agent](https://raw.githubusercontent.com/hcnode/gopush/master/charts/issue_with_cluster_socket.io.png)

## Some of solutions
* one of the solutions to keep session persistence is using [upstream block to support load balance and session sticky](https://www.nginx.com/blog/nginx-nodejs-websockets-socketio/)

```
upstream socket_nodes {
    ip_hash;
    server srv1.app.com:5000 weight=5;
    server srv2.app.com:5000;
    server srv3.app.com:5000;
    server srv4.app.com:5000;
}
```
drawbacks: this layer of ngnix maybe behind another layer of nginx, so ip_hash is not so accurate to keep the session sticky, in addition, extra maintanences is necessary of this upstream block while some nodes need to scale or down.

* socket.io wrapped with [socket-io-sticky-session](https://github.com/wzrdtales/socket-io-sticky-session) to keep the session sticky.

workaround of this lib work is firstly launch the master worker as an agent and then fork a number of slaves as backend servers, all requests go to the agent first, then get the client ip by calculating header of x-forwarded-for, which is a way to force slave worker stick to a certain ip and eventually send message to this slave worker.

drawbacks: only a master worker as the agent role, and you may probably can not scale it(I am not sure, is it?), and you may not deploy this application by pm2 with cluster mode neither.

## How this solution work ?
Actually nothing special, what I was doing is create one more agent layer to handle the requests(include http and websocket) come from clients, it is likely kind of like sticky-session lib, but I use multiple standalone instances as the agent role instead of use only one master worker, in addition, agent can easy to scale more instances, moreover, this can be deploy by pm2!

![with_agent](https://raw.githubusercontent.com/hcnode/gopush/master/charts/modules.png)

## Usages
(depend on pm2 and redis, mongodb is optional)

1. `npm i gopush -g` 

2. `mkdir project-name` 

3. `cd project-name`
 
4. `gopush-create` to create your own config and hooks

5. **edit config:**

    include local, develop and production config json file in config folder, which one would be used depend on the environment of your server:

    * local.json : mac or windows
    * production : process.env.NODE_ENV === 'production'
    * develop : neither above

    ```javsacript
    {
        "agentPort" : 6003, // port of agent server
        "serverPortStart" : 7050, // port of socket.io server
        "senecaPort" : 60000, // port of microservice server
        "serverIps" : ["127.0.0.1"], // server ips
        "serverWorkers" : 2, // instances of socket.io server
        "agentWorkers" : 1, // instances of agent server
        "redisAdapter" : { // redis server
            "host" : "127.0.0.1",
            "port": 6379
        },
        "mongodb" : "mongodb://localhost/push_service"
    }
    ```

6. **edit hooks:**

    include agent middleware `onupgrade-middleware.js` and `agent-middleware.js`, admin middleare `admin-middleware.js`, each of them also have a production copy(*_production.js), which applied in production environment.

    * agent-middleware.js

    ```javascript
    module.exports = function(app){
        app.use(function(req, res, next){
            res.locals.uid = req.cookies.uid; // define res.locals.uid is necessary or response 430 error
            next();
        });
    }
    ```

    * onupgrade-middleware.js

    ```javascript
    module.exports = function(req){ 
        // return Promise object and resolve uid
        return new Promise((resolve, reject) => {
            var cookies = parseCookies(req);
            resolve(cookies.uid);
        });
    }
    ```

    * admin-middleware.js

    ```javascript
    module.exports = function(app){
        app.use((req, res, next) => {
            // do something to verify the user
            next();
        })
    }
    ```

7. run `gopush` after finishing config 

8. visit `http://localhost:6003` you will see `hello world` if every thing is ok.

9. visit `http://localhost:6012/pushManager/admin/` to subscribe message or manage message
