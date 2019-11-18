chrome.runtime.sendMessage(
    {'type': 'getRequestedUrls'},
    function generateList(response) {
      
      var section = d3.select("section") //existing section

      var ol = section.append("ol") //lets add our ordered list

      var olJoin = ol.selectAll("ol") // now we need to have a data join

      var olUpdate = olJoin.data(response.result) // we join data to the selection

      //since our selection is empty let's update it
      var p = olUpdate.enter().append("li").append("p")

      p.append("em").text(function(d, i) { return i + 1 })
      p.append("code").text(function(d) { return d.url })
      p.append("text").text(function(d){ return chrome.i18n.getMessage('navigationDescription', [d.numRequests, d.average])})

      drawMap(response.result)

    });

var margin = {top: 20, right: 120, bottom: 20, left: 120},
    width = 560 - margin.right - margin.left,
    height = 400 - margin.top - margin.bottom;

var i = 0,
    duration = 750,
    root;

var tree = d3.layout.tree()
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.x, d.y]; });

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.right + ")");

function drawMap(hist) {
  root = {
    url: 'Main',
    numRequests: 1,
    children: hist,
    average: 0.0
  }
  root.x0 = height / 2;
  root.y0 = 0;

  function collapse(d) {
    if (d.requestList) {
      d._children = d.requestList;
      d._children.forEach(collapse);
      d.children = null;
    }
  }

  root.children.forEach(collapse);
  update(root);
}


d3.select(self.frameElement).style("height", "800px");

function update(source) {

  // Compute the new tree layout.
  var nodes = tree.nodes(root).reverse(),
      links = tree.links(nodes);

  // Normalize for fixed-depth.
  nodes.forEach(function(d) { d.y = d.depth * 110; });

  // Update the nodes…
  var node = svg.selectAll("g.node")
      .data(nodes, function(d) { return d.id || (d.id = ++i); });

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + source.x0 + "," + source.y0 + ")"; })
      .on("click", click);

  nodeEnter.append("circle")
      .attr("r", radius1)
      .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

  nodeEnter.append("text")
      .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
      .attr("dy", ".35em")
      .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
      .text(function(d) { return d.name; })
      .attr("title", function(d) { return d.url; })
      .style("fill-opacity", 1e1);

  // Transition nodes to their new position.
  var nodeUpdate = node.transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

  nodeUpdate.select("circle")
      .attr("r", radius)
      .style("fill", function(d) { return d._children ? "mediumorchid" : "#fff"; });

  nodeUpdate.select("text")
      .style("fill-opacity", 1);

  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + source.x + "," + source.y + ")"; })
      .remove();

  nodeExit.select("circle")
      .attr("r", radius1);

  nodeExit.select("text")
      .style("fill-opacity", 1e1);

  // Update the links…
  var link = svg.selectAll("path.link")
      .data(links, function(d) { return d.target.id; });

  // Enter any new links at the parent's previous position.
  link.enter().insert("path", "g")
      .attr("class", "link")
      .attr("d", function(d) {
        var o = {x: source.x0, y: source.y0};
        return diagonal({source: o, target: o});
      });

  // Transition links to their new position.
  link.transition()
      .duration(duration)
      .attr("d", diagonal);

  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
      .duration(duration)
      .attr("d", function(d) {
        var o = {x: source.x, y: source.y};
        return diagonal({source: o, target: o});
      })
      .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
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

