## What is this ?
this is a solution for mutiple websocket base applications and easy to scale, gopush provide a agent layer which take care all the websocket and http requests from clients, all you only need to do is deploy your websocket base app behide this agent.

## What is the problem ?
when using socket.io with cluster mode, you probably meet the sticky sesson issue.

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
in some complex situation ip_hash sometimes is not as precise as we expect to keep the session sticky, in addition, you have to keep maintaining upstream block while some nodes need to scale or down.

* socket.io wrapped with [socket-io-sticky-session](https://github.com/wzrdtales/socket-io-sticky-session) to keep the session sticky.

how this libary work is firstly launch a master as an agent and then fork a number of slaves as backend servers, all requests go to the agent first, then get the client ip by header of x-forwarded-for, then pipe the request to a specify worker by calculating hash of the ip, which is a way to force slave worker stick to a conrresponding ip. the main problem of this approach is only one master, and you may probably can not scale it(I am not sure, is it?), and you may can not deploy this application by using pm2 with cluster mode neither.

## How this solution work ?
gopush provide agent server, which act as a route server, all requests including http and websocket go to agent server, then agent server pipe these requests to conrresponding service with "unique product and uid" identity and by implementing them in few hooks config, and gopush also offer a kind of built-in and out of box and pm2 support websocket service which you can develop some business base on "room" concept.

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
