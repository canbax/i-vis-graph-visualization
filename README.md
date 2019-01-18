"# i-vis-graph-visualization" 

overview
This is web app uses npm to run a server. Database driver is running through browser. 
It uses bootstrap 4 for styling
used js files
To show graph: cytoscape, cytoscape-cose-bilkent
To show context menu buttons: cytoscape-context-menus
To connect to neo4j database: neo4j-driver

prerequisites
- nodejs, npm, a neo4j database must be installed or must be available to connect, the neo4j database must have APOC plugin. To fetch data it uses this plugin.

install instructions
1- clone project from github
git clone https://github.com/canbax/i-vis-graph-visualization.git

2- install npm modules
npm install

3- run server
node server.js

User manual
First you should connect to a neo4j database (this database must have APOC plugin installed). Connect with button up left
Than you should enter an actor name exaclty as it is like 'Tom Cruise', 'Keanu Reeves', 'Al Pacino'
you can view subgraph by entering an actor number
you can add nodes to subgraph using right-click>show actors of movie/show movies of person
