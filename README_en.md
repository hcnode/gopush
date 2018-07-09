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
in some complex environment ip_hash sometimes is not as precise as we expect to keep the session sticky, in addition, you have to keep maintaining upstream block while some nodes need to scale or down.

* socket.io wrapped with [socket-io-sticky-session](https://github.com/wzrdtales/socket-io-sticky-session) to keep the session sticky.

how this libary work is firstly launch a master as an agent and then fork a number of slaves as backend servers, all requests go to the agent first, then get the client ip by header of x-forwarded-for, then pipe the request to a specify worker by calculating hash of the ip, which is a way to force slave worker stick to a conrresponding ip. the main problem of this approach is only one master, and you may probably can not scale it(I am not sure, is it?), and you may can not deploy this application by using pm2 with cluster mode neither.

## How this solution work ?
gopush provide agent server, which act as a route server, all requests including http and websocket go to agent server, then agent server pipe these requests to conrresponding service with "unique product and uid" identity and by implementing them in few hooks config, and gopush also offer a kind of built-in and out of box and pm2 support websocket service which you can develop some business base on "room" concept.

![with_agent](https://raw.githubusercontent.com/hcnode/gopush/e4e64a0690bb6afd3da05d6a36f4d82bf5a03c08/charts/modules.png)

## Usages

1. `yarn add gopush` 

2. create script in package.json;
 
 ```json
{
    "gopush": "cd gopush && bash ../node_modules/gopush/bin/gopush",
    "gopush-create": "bash ./node_modules/gopush/bin/gopush-create"
}
 ```

3. `npm run gopush-create`
 
4. `npm run gopush` and visit http://localhost:6003/

5. **edit config:**

    ```javsacript
    {
        "agentPort" : 6003, // port of agent server
        "serverPortStart" : 4000, // built-in websocket server start port
        "serverWorkers" : 2, // instances of built-in websocket server
        "agentWorkers" : 4, // instances of agent server
        "redisAdapter" : { // redis server
            "host" : "127.0.0.1",
            "port": 6379
        }
    }
    ```

6. **edit hooks:**

    http agent `agent.[evn].js` and websocket agent `onupgrade.[env].js` and router `router.[env].js`, which applied in production environment.

    * agent.[evn].js

    ```javascript
    module.exports = function(app){
        app.use(function(req, res, next){
            res.locals.uid = req.cookies.uid; // define res.locals.uid is necessary or response 430 error
            next();
        });
    }
    ```

    * onupgrade.[env].js

    ```javascript
    module.exports = function(req){ 
        // return Promise object and resolve uid
        return new Promise((resolve, reject) => {
            var cookies = parseCookies(req);
            resolve(cookies.uid);
        });
    }
    ```

    * router.[env].js

    ```javascript
    module.exports = {
        // test is the name of product by pass product url parameter of request:
        // for example:
        // var ioc = require("socket.io-client");
        // ioc(`ws://127.0.0.1:6003?product=test`)

        // uid is defined in hooks middleware
        // so you can pipe request to specify service by product and uid
        test: (req, uid) => {
            return {
                ip: "127.0.0.1",
                port: 4000
            };
        },
        // when product is empty, request goes to default service
        default: [
            {
                ip : "127.0.0.1",
                ports : [4000, 4001]
            }
        ]
    };

    ```

