var express = require('express');
var app = express();
var path = require('path');

app.use(express.static('public'));
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});
 
app.listen(4000, function () {
  console.log('Example app listening on port 4000!');
});