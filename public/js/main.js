// yusuf sait canbaz
// 18 Jan 2019

// global variables
window.neo4jdriver = null;
window.cy = null;

// show a pop up to user
function notify(title, msg) {
  document.getElementById('exampleModalLabel').innerText = title;
  document.getElementById('modalBody').innerText = msg;
  $("#exampleModal").modal();
}

function initCytoscape() {
  window.cy = cytoscape({
    container: document.getElementById('cy'), // container to render in
    layout: {
      name: 'cose-bilkent',
      animate: false,
      randomize: true
    },
    style: [ // the stylesheet for the graph
      {
        selector: 'node[label="Person"]',
        style: {
          'background-color': '#28a745',
          'label': 'data(text)'
        }
      },
      {
        selector: 'node[label="Movie"]',
        style: {
          'background-color': '#dc3545',
          'label': 'data(text)'
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 3,
          'line-color': '#ccc',
          'target-arrow-color': '#ccc',
          'target-arrow-shape': 'triangle'
        }
      }
    ],
  });
  registerContextMenus();
}

$(document).ready(function () {
  initCytoscape();
});

function connect2Db() {
  var dbURI = document.getElementById('dbURI').innerText;
  if (!dbURI || dbURI === '') {
    dbURI = 'bolt://localhost';
  }
  var usrName = $('#userName1').val();
  var pwd = $('#password1').val();
  console.log('uname: ', usrName, ' pwd: ', pwd);
  window.neo4jdriver = neo4j.v1.driver(dbURI, neo4j.v1.auth.basic(usrName, pwd));
  var session = window.neo4jdriver.session();

  neo4jSessionRunner('MATCH (r) RETURN r LIMIT 1', false, false, function(){
    $("#submitbtn").prop("disabled", false);
    notify('connection succesful', 'connected');
  });
}

function neo4jSessionRunner(cypherQuery, isRedraw, randomizeLayout, callback){
  var session = window.neo4jdriver.session();

  session.run(cypherQuery)
  .then(function (result) {
    if (callback){
      callback();
    }else{
      parseNeo4jData(result, isRedraw);
      layoutCy(randomizeLayout);
    }
    session.close();
  })
  .catch(function (error) {
    notify('neo4jSessionRunner error: ', cypherQuery, error);
    console.log(error);
  });
}

function addNeighborsOfNode(node){
  checkDbConn();
  var matchQuery = '';
  if (node._private.data.label === 'Person'){
    matchQuery = `Person{name:"${node._private.data.text}"}`;
  }else if (node._private.data.label === 'Movie'){
    matchQuery = `Movie{title:"${node._private.data.text}"}`;
  }
  var cypherQuery =  
  `MATCH (n1:${matchQuery}) with n1 
  call apoc.path.expand(n1, 'ACTED_IN', 'Movie|Person', 0, 1) 
  yield path 
  return path`;

  neo4jSessionRunner(cypherQuery, false, false);
}

function getPersonCenteredGraph(){
  var person = $('#inp0').val();
  var perimeter = $('#inp1').val();
  checkDbConn();
  perimeter = perimeter * 2;
  var cypherQuery =  
  `MATCH (n1:Person{name:"${person}"}) with n1 
  call apoc.path.expand(n1, 'ACTED_IN', 'Movie|Person', 0, ${perimeter}) 
  yield path 
  return path`;

  neo4jSessionRunner(cypherQuery, true, true);
}

function parseNeo4jData(result, isRedraw) {
  
  if (isRedraw){
    window.cy.elements().remove();
  }

  if (!result || !result.records) {
    return 'result or records is falsy';
  }

  function getNodeObj(n){
    var nodeLabel = n.labels[0];
    var nodeText = n.properties.title;
    if (!nodeText){
      nodeText = n.properties.name;
    }
    return {label: nodeLabel, text: nodeText};
  }

  function addNode(node2add){
    var currNodes = window.cy.nodes().map(function(x){
      return {label: x._private.data.label, text: x._private.data.text};
    });
    
    var elem2add = getNodeObj(node2add);

    if (!arrayContainsObj(currNodes, elem2add)){
      var nodeId = 'n' + currNodes.length;
      window.cy.add({ group: 'nodes', data: { id: nodeId, label: elem2add.label, text: elem2add.text } });
    }
  }

  for (var i = 0; i < result.records.length; i++) {
    if (!result.records[i]._fields || !result.records[i]._fields[0]) {
      continue;
    }
    var node1 = result.records[i]._fields[0].start;
    var node2 = result.records[i]._fields[0].end;
    addNode(node1);
    addNode(node2);

    if (!result.records[i]._fields[0].segments || result.records[i]._fields[0].segments.length < 1) {
      continue;
    }
  }

  for (var i = 0; i < result.records.length; i++) {
    for (var j = 0; j < result.records[i]._fields[0].segments.length; j++) {
      var segment = result.records[i]._fields[0].segments[j];
      var o1 = getNodeObj(segment.start);
      var o2 = getNodeObj(segment.end);
      var nodes = window.cy.nodes().map(x => x._private.data);
      var s = nodes.filter(function(x){
        return x.label === o1.label && x.text === o1.text;
      });
      var t = nodes.filter(function(x){
        return x.label === o2.label && x.text === o2.text;
      });
      
      var edges = window.cy.edges().map(function(x){
        return {s: x._private.data.source, t: x._private.data.target};
      });

      if (!arrayContainsObj(edges, {s: s[0].id, t: t[0].id})){
        window.cy.add({ group: 'edges', data: { id: 'e' + edges.length, source: s[0].id, target: t[0].id } });
      }
    }
  }
}

function checkDbConn(){
  if (!window.neo4jdriver){
    var msg = "database connection is not provided";
    notify("database connection error", msg);
    throw msg;
  }
}

function registerContextMenus() {
  window.cy.contextMenus({
    menuItems: [
      {
        id: 'showMoviesOfPerson',
        content: 'show movies of person',
        tooltipText: 'show movies of person',
        selector: 'node[label="Person"]',
        onClickFunction: function (event) {
          var target = event.target || event.cyTarget;
          console.log('target: ', target);
          addNeighborsOfNode(target);
        }
      },
      {
        id: 'showActorsOfMovie',
        content: 'show actors of movie',
        tooltipText: 'show actors of movie',
        selector: 'node[label="Movie"]',
        onClickFunction: function (event) {
          var target = event.target || event.cyTarget;
          console.log('target: ', target);
          addNeighborsOfNode(target);
        }
      }
    ]
  });
}

function layoutCy(randomize) {
  var layout = window.cy.layout({
    name: 'cose-bilkent',
    // animate: 'end',
    // animationEasing: 'ease-out',
    // animationDuration: 1000,
    randomize: randomize
  });
  layout.run();
}

// ------------------------------------- helper functions ------------------------------------- //
// check if an array of objects contains an object
function arrayContainsObj(arr, obj) {
  for (var i = 0; i < arr.length; i++) {
    if (objectsAreEqual(arr[i], obj)) {
      return true;
    }
  }
  return false;
}

// https://stackoverflow.com/a/42611416/3209523
function objectsAreEqual(a, b) {
  for (var prop in a) {
    if (a.hasOwnProperty(prop)) {
      if (b.hasOwnProperty(prop)) {
        if (typeof a[prop] === 'object') {
          if (!objectsAreEqual(a[prop], b[prop])) return false;
        } else {
          if (a[prop] !== b[prop]) return false;
        }
      } else {
        return false;
      }
    }
  }
  return true;
}

