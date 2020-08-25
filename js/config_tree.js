d3.json("/data/top-down-tree/a-a-b-b-a-b-lexicographic.json").then(function (data) {
    drawTree(data);
});

function markPaths(node) {
    if (node.data.isGoal) {
        node.data.isGoalPath = true;
        return true;
    }
    if (!node.children) {
        node.data.isGoalPath = false;
        return false;
    }
    var isGoalPath = false;
    for (let child of node.children) {
        if (markPaths(child)) {
            isGoalPath = true
        }
    }
    node.data.isGoalPath = isGoalPath;
    return isGoalPath;
}

function drawTree(data) {
    var treeData = d3.stratify()
        .id(function (d) { return d.id; })
        .parentId(function (d) { return d.parentId; })
        (data);

    // set the dimensions and margins of the diagram
    var margin = { top: 40, right: 90, bottom: 40, left: 90 },
        width = 1000 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

    // declares a tree layout and assigns the size
    var treemap = d3.tree()
        .size([width, height]);

    // maps the node data to the tree layout
    var nodes = treemap(treeData);

    // add goal path attribute
    markPaths(nodes);

    // append the svg object to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    var svg = d3.select("#tree")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom),
        g = svg.append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

    // adds the links between the nodes
    var link = g.selectAll(".link")
        .data(nodes.descendants().slice(1))
        .enter().append("path")
        .attr("class", "link")
        .attr("d", function (d) {
            return "M" + d.x + "," + d.y
                + "C" + d.x + "," + (d.y + d.parent.y) / 2
                + " " + d.parent.x + "," + (d.y + d.parent.y) / 2
                + " " + d.parent.x + "," + d.parent.y;
        });

    // adds each node as a group
    var node = g.selectAll(".node")
        .data(nodes.descendants())
        .enter().append("g")
        .attr("class", function (d) {
            return "node" +
                (d.children ? " node--internal" : " node--leaf");
        })
        .attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

    // adds the circle to the node
    node.append("circle")
        .attr("class", function (d) {
            return (d.data.rule || !d.parent ? "predict" : "match");
        })
        .attr("data-goal", function (d) { return d.data.isGoal; })
        .attr("data-goal-path", function (d) { return d.data.isGoalPath; })
        .attr("r", 10);

    node.append("title")
        .text(function (d) { return 'Step ' + d.id + ': ' + (d.data.rule || !d.parent ? "predict " + (d.data.rule ? d.data.rule : "S' -> S") : "match " + d.parent.data.prediction[0]); })

    // adds the text to the node
    node.append("text")
        .attr("dy", ".35em")
        .attr("y", function (d) { return d.children ? -20 : 20; })
        .style("text-anchor", "middle")
        .text(function (d) { return d.data.position + (d.data.prediction.length > 0 ? ':' + d.data.prediction.join('') : ''); });
}
