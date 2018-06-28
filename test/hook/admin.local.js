module.exports = function(app){
    app.use((req, res, next) => {
        next();
    })
}