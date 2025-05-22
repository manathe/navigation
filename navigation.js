chrome.runtime.sendMessage(
    {'type': 'getRequestedUrls'},
    function generateList(response) {
      
      var section = d3.select("section") //existing section

      var ol = section.append("ol") //lets add our ordered list

      var olJoin = ol.selectAll("ol") // now we need to have a data join

      var olUpdate = olJoin.data(response.result) // we join data to the selection

      //since our selection is empty let's update it
      var p = olUpdate.enter().append("li").append("p")

      p.append("img").attr("src", function(d) { return 'chrome://favicon/' + d.url })
      p.append("a").text(function(d) { return new URL(d.url).host || d.url }).attr("href", function(d) {return d.url})
      p.append("text").text(function(d){ return chrome.i18n.getMessage('navigationDescription', [d.numRequests, d.average])})

      drawMap(response.result)

    });

// Set the dimensions and margins of the diagram
var margin = {top: 20, right: 120, bottom: 20, left: 120},
    width = 560 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

var i = 0,
    duration = 750,
    root;

// declares a tree layout and assigns the size
var treemap = d3.tree().size([height, width]);

// append the svg object to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .attr("xmlns:xlink", "http://www.w3.org/1999/xlink")
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.right + ")");

function drawMap(hist) {
  hist.forEach(function(x) {x.children = x.requestList})
  treeData = {
    url: 'Main',
    numRequests: 1,
    children: hist,
    average: 0.0
  }
  
  // Assigns parent, children, height, depth
  root = d3.hierarchy(treeData, d => d.children);
  root.x0 = height / 2;
  root.y0 = 0;

  // Collapse after the second level
  root.children.forEach(collapse);

  update(root);

  // Collapse the node and all it's children
  function collapse(d) {
    if(d.children) {
      d._children = d.children
      d._children.forEach(collapse)
      d.children = null
    }
  }
}


d3.select(self.frameElement).style("height", "800px");

function update(source) {

  // Assigns the x and y position for the nodes
  var treeData = treemap(root);

  // Compute the new tree layout.
  var nodes = treeData.descendants(),
      links = treeData.descendants().slice(1);

  // Normalize for fixed-depth.
  nodes.forEach(function(d){ d.y = d.depth * 110 });

  // ****************** Nodes section ***************************

  // Update the nodes...
  var node = svg.selectAll('g.node')
      .data(nodes, function(d) {return d.id || (d.id = ++i); });

  // Enter any new modes at the parent's previous position.
  var nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr("transform", function(d) {
        return "translate(" + source.x0 + "," + source.y0 + ")";
    })
    .on('click', click);

    //Create an image background
    nodeEnter.append('svg:defs').append('svg:pattern')
      .attr("id", function(d, i) { return "grump_avatar" + i })
     // .attr("width", config.avatar_size) 
     // .attr("height", config.avatar_size)
      .attr("patternUnits", "userSpaceOnUse")
      .append("svg:a")
      .attr("href", function(d) { return d.data.url})
      .attr("target", "_blank")
      .append("svg:image")
      .attr("href", function(d) { return 'chrome://favicon/' + d.data.url})
     // .attr("width", config.avatar_size)
     // .attr("height", config.avatar_size)
      .attr("x", 0)
      .attr("y", 0);

  // Add Circle for the nodes
  nodeEnter.append('circle')
      .attr('class', 'node')
      .attr('r', 1e-6)
      .style("fill", (d) => d._children ? "lightsteelblue" : "#fff")
      .style("fill", (d, i) => `url(#grump_avatar${i})`)
      .append('title')
      .text((d) => d.data.url);

  // Add labels for the nodes
  nodeEnter.append('text')
      .attr("dy", ".35em")
      .attr("x", (d) =>  d.children || d._children ? -13 : 13)
      .attr("text-anchor", (d) => d.children || d._children ? "end" : "start")
      .text((d) => d.data.name);

  // UPDATE
  var nodeUpdate = nodeEnter.merge(node);

  // Transition to the proper position for the node
  nodeUpdate.transition()
    .duration(duration)
    .attr("transform", function(d) { 
        return "translate(" + d.x + "," + d.y + ")";
     });

  // Update the node attributes and style
  nodeUpdate.select('circle.node')
    .attr('r', 10)
    .style("fill", function(d) {
        return d._children ? "mediumorchid" : "#fff";
    })
    .attr('cursor', 'pointer');


  // Remove any exiting nodes
  var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) {
          return "translate(" + source.x + "," + source.y + ")";
      })
      .remove();

  // On exit reduce the node circles size to 0
  nodeExit.select('circle')
    .attr('r', 1e-6);

  // On exit reduce the opacity of text labels
  nodeExit.select('text')
    .style('fill-opacity', 1e-6);

  // ****************** links section ***************************

  // Update the links...
  var link = svg.selectAll('path.link')
      .data(links, function(d) { return d.id; });

  // Enter any new links at the parent's previous position.
  var linkEnter = link.enter().insert('path', "g")
      .attr("class", "link")
      .attr('d', function(d){
        var o = {x: source.x0, y: source.y0}
        return diagonal(o, o)
      });

  // UPDATE
  var linkUpdate = linkEnter.merge(link);

  // Transition back to the parent element position
  linkUpdate.transition()
      .duration(duration)
      .attr('d', function(d){ return diagonal(d, d.parent) });

  // Remove any exiting links
  var linkExit = link.exit().transition()
      .duration(duration)
      .attr('d', function(d) {
        var o = {x: source.x, y: source.y}
        return diagonal(o, o)
      })
      .remove();

  // Store the old positions for transition.
  nodes.forEach(function(d){
    d.x0 = d.x;
    d.y0 = d.y;
  });

  // Creates a curved (diagonal) path from parent to the child nodes
  function diagonal(s, d) {

    path = `M ${s.x} ${s.y}
            C ${s.x} ${(s.y + d.y) / 2},
              ${d.x} ${(s.y + d.y) / 2},
              ${d.x} ${d.y}`

    return path
  }
}

//Set radius depending on the children count
function radius(d) {
  return getRadius(d, 9.5);
}
function radius1(d) {
  return getRadius(d,1e1);
}
function getRadius(d,r){
  return (d.children && d.children.length > 0) ? d.children.length + r : 
    ((d._children && d._children.length > 0) ? d._children.length + r : r ) ;
}

// Toggle children on click.
function click(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  update(d);
}

