var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var request = require('request');
var app = express();

app.set('trust proxy', true)
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use((function () {
    var morgan = require('morgan');
    var FileStreamRotator = require('file-stream-rotator');
    var fs = require('fs-extra');
    var logDirectory = __dirname + '/../../log';
    var accessLogDirectory = logDirectory + '/socket-io-agent';

    // ensure log directory exists
    fs.ensureDirSync(accessLogDirectory)

    // access log
    var accessLogStream = FileStreamRotator.getStream({
        date_format: 'YYYYMMDD',
        filename: accessLogDirectory + '/access-%DATE%.log',
        frequency: 'daily',
        verbose: false
    });
    return morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]', {
        stream: accessLogStream
    });
})());

module.exports = app;