## What is this ?
this is a solution for websocket based applications and easy to scale, gopush provide a agent layer which take care all the websocket connections and http requests from clients, all you need to do is only deploy your websocket app behide this agent.

## What is the problem of socket.io ?
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
in some complex environment ip_hash sometimes is not as precise as we expected to keep the session sticky, in addition to that, you have to keep maintaining upstream block while some nodes need to scale or down.

* socket.io wrapped with [socket-io-sticky-session](https://github.com/wzrdtales/socket-io-sticky-session) to keep the session sticky.

This library works firstly launch a master instance as an agent and then fork a number of slaves instances as backend servers, all requests go to the agent first, then get the client ip by header of x-forwarded-for, then pipe the request to a specify worker by calculating hash of the ip, which is a way to force slave worker stick to a conrresponding ip. the main problem of this approach is only one master, and you may probably can not scale it, and you probably can not deploy this application by using pm2 with cluster mode neither.

## How this solution work ?
gopush provide agent layer, which act as a router services, all requests includs http and websocket go to agent server, then agent server pipe these requests to conrresponding service with "unique product and uid" identity and by implementing them in specify hooks config, and gopush also offer a kind of built-in and out of box and pm2 support websocket service which you can develop some business base on "room" concept.

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



## 这是什么
这是一个给基于websocket的应用进行websocket或者是http协议的代理agent服务, agent层相当于是一个路由层, 接收相关的http或者websocket协议的请求, 再根据用户uid和产品识别号pipe到对应的后端服务.

## 解决的问题
解决后端websocket服务器的集群和扩展功能, 并提供路由功能, 可以很方便进行部署, 后端服务器只需要部署内网服务, 而不需要关心如何配置面向用户的前端服务.

![without_agent](https://raw.githubusercontent.com/hcnode/gopush/master/charts/issue_with_cluster_socket.io.png)

## 其他解决方案
* 对于socket.io所需要的sticky session功能, 可以使用nginx的ip_hash配置实现, [upstream block to support load balance and session sticky](https://www.nginx.com/blog/nginx-nodejs-websockets-socketio/)

```
upstream socket_nodes {
    ip_hash;
    server srv1.app.com:5000 weight=5;
    server srv2.app.com:5000;
    server srv3.app.com:5000;
    server srv4.app.com:5000;
}
```
但是在一些复杂的网络环境, ip_hash 不一定可以对用户进行精确的定位, 而且这种是需要维护这个upstream块

* 使用[socket-io-sticky-session](https://github.com/wzrdtales/socket-io-sticky-session) 来实现 session sticky.

这个的原理是, 首先创建一个master当作是一个agent代理, 然后通过用户的x-forwarded-for头去识别用户需要连接到哪一个实例, 这个解决方案的缺点是, 只能通过master一个实例实现agent层, 并且不能使用pm2去部署.

## 这个库提供的方案的原理是?
和socket-io-sticky-session类似, gopush提供了agent层接管所有的websocket请求, 但是在agent层可以扩展, 可以使用pm2的集群方式进行部署, 并且gopush还提供了产品路由功能, 所有请求可以通过请求的产品号, pipe到对应的后端服务

![with_agent](https://raw.githubusercontent.com/hcnode/gopush/e4e64a0690bb6afd3da05d6a36f4d82bf5a03c08/charts/modules.png)

## 使用方式

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
