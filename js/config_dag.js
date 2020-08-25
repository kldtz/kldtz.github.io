
drawDiagram("/data/top-down-dag/dfs-lexicographic.json", "static-graph", function(_) {});
drawDiagram("/data/top-down-dag/dfs-lexicographic-reverse.json", "dynamic-graph", function(_) {});

d3.select("#dfs").on("click", dfs);
d3.select("#bfs").on("click", bfs);


function dfs() {
    d3.selectAll("g").interrupt();
    drawDiagram("/data/top-down-dag/dfs-lexicographic-reverse.json", "dynamic-graph", uncoverEdges);
}

function bfs() {
    d3.selectAll("g").interrupt();
    drawDiagram("/data/top-down-dag/bfs-lexicographic-reverse.json", "dynamic-graph", uncoverEdges);
}


function drawDiagram(data_path, svg_id, operation) {
    d3.json(data_path, function (data) {
        var goals = [];
        var nodes = {};
        for (let node of data) {
            if (node.isGoal) {
                goals.push(node);
            }
            node.label = node.position + (node.prediction.length > 0 ? ':' + node.prediction.join('') : '');
            nodes[node.id] = node;
        }

        for (let goal of goals) {
            markPath(nodes, goal);
        }
        drawGraph(data, svg_id);
        operation(svg_id);
    });
}

function uncoverEdges(svg_id) {
    let svg_selector = '#' + svg_id + ' ';
    d3.selectAll(svg_selector + ' g[class^="node "]').style('opacity', 0.3)

    d3.select(svg_selector + '#vertex-1').style('opacity', 1);
    d3.selectAll(svg_selector + "g.edgePath")
        .style("opacity", 0.3)
        .transition()
        .on('start', function (d, i) {
            let toId = "#vertex-" + d.w;
            d3.select(svg_selector + toId).style('opacity', 1);
        })
        .delay(function () {
            let edgeId = parseInt(this.id.split('-')[1]);
            return 500 * edgeId;
        })
        .duration(100)
        .style('opacity', 1);
}

function markPath(nodes, node) {
    node['isGoalPath'] = true;
    for (let parent of node.parents) {
        if (!parent.parentId) {
            continue;
        }
        markPath(nodes, nodes[parent.parentId]);
    }
}

function drawGraph(data, svg_id) {
    var g = new dagreD3.graphlib.Graph()
        .setGraph({ rankdir: 'LR', ranksep: 20, edgesep: 0, nodesep: 10 })
        .setDefaultEdgeLabel(function () { return {}; });

    for (let node of data) {
        let classLabel = (node.rule || node.parents[0].parentId == null ? "predict" : "match") +
            '-' + (node.isGoalPath ? 'goal-path' : 'non-goal-path');
        g.setNode(node.id, {
            label: node.label,
            shape: "rect", "class": classLabel, id: 'vertex-' + node.id
        });
        for (let parent of node.parents) {
            if (parent.parentId === null) continue;
            g.setEdge(parent.parentId, node.id, {
                arrowhead: 'vee', id: 'edge-' + parent.edgeId
            });
        }
    }

    g.nodes().forEach(function (v) {
        var node = g.node(v);
        // Round the corners of the nodes
        node.rx = node.ry = 5;
    });

    var render = new dagreD3.render();

    var svg = d3.select("#" + svg_id),
        svgGroup = svg.append("g");

    render(d3.select("#" + svg_id + " g"), g);

    // Center the graph
    var xCenterOffset = (svg.attr("width") - g.graph().width) / 2;
    svgGroup.attr("transform", "translate(" + xCenterOffset + ", 20)");
    svg.attr("height", g.graph().height + 40);
}

d3.select("#generate")
    .on("click", writeDownloadLink);

function writeDownloadLink() {
    try {
        var isFileSaverSupported = !!new Blob();
    } catch (e) {
        alert("blob not supported");
    }

    var html = d3.select("#static-graph")
        .attr("title", "DAG")
        .attr("version", 1.1)
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .node().parentNode.innerHTML;

    var blob = new Blob([html], { type: "image/svg+xml" });
    saveAs(blob, "dag.svg");
};

