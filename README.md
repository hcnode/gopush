## What is this ?
this is a solution of socket.io application which deploy by pm2 with cluster mode, and with socket.io-redis to subscribe event cross different socket.io instances, 
and these network enviroment are all behind a layer of ngnix.

## What is the problem ?
when using socket.io with cluster mode, you will meet the sticky sesson issue.

![without_agent](https://github.com/hcnode/socket.io-pm2-cluster-redis-sitcky-session-nginx/raw/master/chart/flow_without_agent.png)

## Some of solutions
* one of the solution of session persistence is using [upstream block to support load balance and session sticky](https://www.nginx.com/blog/nginx-nodejs-websockets-socketio/)

```
upstream socket_nodes {
    ip_hash;
    server srv1.app.com:5000 weight=5;
    server srv2.app.com:5000;
    server srv3.app.com:5000;
    server srv4.app.com:5000;
}
```
drawbacks: in my case this layer of ngnix maybe behind another layer of nginx, so ip_hash is not so accurate to keep the session sticky, in addition to this configuration, it need to maintain this upstream block while there are some nodes need to scale or down.

* socket.io wrapped with sticky-session lib to keep the session sticky, such as [socket-io-sticky-session](https://github.com/wzrdtales/socket-io-sticky-session)
how this lib work is first launch the master worker as an agent and fork a number of slaves as backend servers, all requests go to the agent first, then get the client ip by header of x-forwarded-for, then calculate which slave worker stick to this ip and finally send message to the slave worker which selected.

drawbacks: first of all the requests only can go to is master worker, and you may probably can not scale it(I am not sure, it is?), and you may not deploy this application by pm2 with cluster mode as well.

## how this project of solution work ?
actually nothing special, what I make is create one more agent layer to deal the request include http and websocket come from client, it is kind of like sticky-session lib, but I use standalone instance to serve as the agents instead of use master worker, in addition, agent can easy to scale more instances, and I also use the http and websocket client mode to connect the backend server instead of send message between master and slave workers.

![with_agent](https://github.com/hcnode/socket.io-pm2-cluster-redis-sitcky-session-nginx/raw/master/chart/flow_with_agent.png)


## usages

