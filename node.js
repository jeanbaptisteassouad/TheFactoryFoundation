


var path = require('path');
var express = require('express');
var logger = require('morgan');
var app = express();
var elasticsearch = require('elasticsearch');
var gm = require('gm');
var async = require('async')



var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});

// Log the requests
app.use(logger('dev'));

// Serve static files
app.use(express.static(path.join(__dirname, '../thefactory')));




app.get('/query', function (req, res) {
    client.search({
        index: 'pdf',
        body: {
            query: {
                bool : {
                    must : [
                        {
                            multi_match : {
                                query : req.query.query,
                                fields : [ "table.*"], // fields : [ "content" ],
                                operator:   "and"
                            }
                        },
                        {
                            exists : { field : "table.2" }
                        }
                    ],
                "must_not" : [],
                "should" : []
                }
            }
        }
    }).then(function (resp) {
        console.log("Request was : " + req.query.query);


        async.forEachOf(resp.hits.hits,function (hit,hitNum,callback) {
            var image_path = "../thefactory/" + hit._source.image_path;
            var tab_query = req.query.query.split(" ");

            var list_good_indice = [];
            for (var i=0; i < Object.keys(hit._source.table).length; ++i){
                var isGoodLine = true;
                for (var j=0; j < tab_query.length; ++j){
                    var patt = new RegExp(tab_query[j]);
                    var res = patt.exec(hit._source.table[i]);
                    if (res === null) {
                        isGoodLine = false;
                    };
                }
                if (isGoodLine) {
                    list_good_indice.push(i);
                };
            }

            console.log(list_good_indice);

            gm(image_path)
            .size(function (err, size) {
                var image = gm(image_path);
                image.fill("rgba(255,0,0,128)");

                async.forEachOfSeries(list_good_indice,function (value, key, callback){
                    var coord = hit._source.list_frame[value].split(" ");
                    image
                    .drawRectangle(coord[0]*size.width, coord[1]*size.height, coord[2]*size.width, coord[3]*size.height);
                    callback();
                },function(err){
                    image
                    .write('../thefactory/tmp/'+hitNum+'.png', function (err) {
                      if (!err) console.log(hitNum + " : " + image_path +' : done');
                      else console.error(err);
                      callback();
                    });
                })

            });


        }, function (err) {
            var ans = {ans:[],len:-1}
            var i;
            for (i = 0; i < 8 && i < resp.hits.total; i++) {
                ans.ans[i] = "tmp/"+i+".png";
            };
            ans.len = i;
            res.send(ans);
        });

    }, function (err) {
        console.trace(err.message);
    });
});

// Route for everything else.
app.get('/', function(req, res){
  res.render('index.html');
});

// Fire it up!
app.listen(3000);
console.log('Listening on port 3000');
