var margin = {top: 20, right: 100, bottom: 20, left: 100},
    width = 560 - margin.right - margin.left,
    height = 400 - margin.top - margin.bottom;

var i = 0,
    duration = 750,
    root, origData;

var tree = d3.layout.tree()
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.x, d.y]; });

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.right + ")");

d3.xml("sitemap.xml", function(error, data) {
  if (error) throw error;
  
  // Convert data to an array of objects
  data = [].map.call(data.querySelectorAll("url"), function(url) {
    return {
      name: url.querySelector("loc").textContent,
      lastmod: url.querySelector("lastmod").textContent,
      changefreq: url.querySelector("changefreq").textContent,
      priority: url.querySelector("priority").textContent	  	  
    };
  });
  
  origData = data;
  
  data.forEach(d => {d.children = addChildren(d)})
  
  console.log(data);

  root = {
	"name" : "My root node",
	"children" : data.filter(d => d.children.length > 0), //Remove filter to see all root nodes. However some duplicates may exist delete them from origData first :-)
  };
  root.x0 = height / 2;
  root.y0 = 0;
  
  function addChildren(node){
	var grouped = d3.nest().key(function(d) {
			if(d.name.startsWith(node.name) && d.name != node.name){
				var sub = d.name.substring(node.name.length)
				if (sub.lastIndexOf("/") == sub.length - 1) //the last character
					return sub.search("/") == sub.length - 1 ? node.name : "";
				else 
					return sub.search("/") < 0 ? node.name : ""; //name does not include /
			} else return ""; 
		}).map(origData);
		
	//Set custom name
	node.cust_name = node.name.substr(node.name.length - 10, 10)
		
	if(grouped[node.name]){
		//here I think we should remove all grouped from the original data to create a tree structure
		grouped[node.name].forEach(n => {  origData = origData.slice(n)})
		return grouped[node.name];
	}
	return []
  }
  

  function collapse(d) {
    if (d.children) {
      d._children = d.children;
	  console.log(d.children);
      d._children.forEach(collapse);
      d.children = null;
    } else {
      d._children = addChildren(d);
	  console.log(d._children);
      d._children.forEach(collapse);
      d.children = null;
	
	}
  }

  root.children.forEach(collapse);
  
  console.log(root);
  console.log(origData);
  //root.forEach( n => {  n.x0 = height / 2;  n.y0 = 0 +  i ;update(n);})
  update(root);
  
});

d3.select(self.frameElement).style("height", "400px");

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
      .text(function(d) { return d.cust_name; })
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