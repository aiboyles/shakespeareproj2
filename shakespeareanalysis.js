/**
 * @author Ann Boyles
 */

//global variables
var url = "";
var $html;

// helper function to sort speaker array from greatest to smallest value
function sortMapByValue(map) {
    var tupleArray = [];
    for (var key in map) tupleArray.push([key, map[key]]);
    tupleArray.sort(function (a, b) {
        return a[1] - b[1]
    });
    return tupleArray;
}

// takes existing array of speakers and corresponding number of lines and 
// outputs it to HTML page
function appendHtmlToPage(speakers) {
    speakers = sortMapByValue(speakers).reverse();

    var myAppend = "<table class='table table-bordered table-striped'><thead><tr><th style='width:75%'>Speaker</th> <th>Lines</th></tr></thead><tbody>";

    for (x in speakers) {
        myAppend += "<tr><td>" + (speakers[x][0]).toLowerCase() + "</td><td>" + speakers[x][1] + "</td></tr>";
    }

    myAppend += "</tbody></table>";
    $("div.list-area").html(myAppend);
}

// draws bar graph of results using D3.js
function createGraph(speakers) {
    
    // clears previous graph, if any
    d3.select("svg").remove()
    
    // sorts speakers and takes top 15
    var speakersSorted = sortMapByValue(speakers).reverse();
    speakersSorted = speakersSorted.slice(0, 15);

    var margin = {
        top: 30,
        right: 30,
        bottom: 40,
        left: 50
    }

    var height = 450 - margin.top - margin.bottom,
        width = 400 - margin.left - margin.right,
        barWidth = 50,
        barOffset = 5;

    var colors = d3.scale.linear()
        .domain([0, speakersSorted[0][1]])
        .range(['#FFB832','#C61C6F'])

    var yScale = d3.scale.linear()
        .domain([0, speakersSorted[0][1]])
        .range([0, height])

    var xScale = d3.scale.ordinal()
        .domain(d3.range(0, speakersSorted.length))
        .rangeBands([0, width], 0.2);

    var tooltip = d3.select('body').append('div')
        .style('position', 'absolute')
        .style('padding', '0 10px')
        .style('background', 'white')
        .style('opacity', 0)
    
    var myChart = d3.select('#chart-area').append('svg')
        .style('background', '#F7F7FA')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')')
        .selectAll('rect').data(speakersSorted)
        .enter().append('rect')
            .style('fill', function(d,i) {
                return colors(d[1]);
            })
            .attr('width', xScale.rangeBand())
            .attr('height', 0)
            .attr('x', function (d, i) {
                return xScale(i);
            })
            .attr('y', height)
    
    .on('mouseover', function(d) {
        tooltip.transition()
            .style('opacity', 0.9)
        
        tooltip.html((d[0].charAt(0).toUpperCase()) + d[0].toLowerCase().substring(1) + " " + d[1])
            .style('left', (d3.event.pageX - 35) + 'px')
            .style('top', (d3.event.pageY - 30) + 'px')
        
        tempColor = this.style.fill;
        
        d3.select(this)
            .style('opacity', 0.5)
            .style('fill', 'yellow')
    })
    
    .on('mouseout', function(d) {
        tooltip.transition()
            .style('opacity', 0)
        
        d3.select(this)
            .style('opacity', 1)
            .style('fill', tempColor)
    })
    
    myChart.transition()
        .attr('height', function (d, i) {
            return yScale(d[1]);
        })
        .attr('y', function (d) {
            return height - yScale(d[1]);
        })
        .delay(function (d, i) {
            return i * 30;
        })
        .duration(1000)
        .ease('elastic')

    var vGuideScale = d3.scale.linear()
        .domain([0, speakersSorted[0][1]])
        .range([height, 0])

    var vAxis = d3.svg.axis()
        .scale(vGuideScale)
        .orient('left')
        .ticks(10)

    var vGuide = d3.select('svg').append('g')
        vAxis(vGuide)
        vGuide.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')')
        vGuide.selectAll('path')
            .style({ fill: 'none', stroke: "#000"})
        vGuide.selectAll('line')
            .style({ stroke: "#000"})
        
    var hAxisLabel = d3.select('svg').append("text")
        .attr("x", (width / 2) + margin.left )
        .attr("y",  height + margin.bottom + 10)
        .style("text-anchor", "middle")
        .text("Speakers")
    
    var vAxisLabel = d3.select('svg').append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .text('Number of Lines')
    
    var graphTitle = d3.select('svg').append("text")
        .attr("x", (width / 2) + margin.left )
        .attr("y",  0 + margin.top - 10)
        .style("text-anchor", "middle")
        .text("Top 15 Speakers")
        

}

// loops through the num of total lines, creating a new key/value
// pair each time a new speaker is encountered, and adding to
// the value each time an existing speaker is encountered
function howManyLines(respText) {

    $html.append(respText);
    var lines = $html[0].querySelectorAll('a[name]');
    var speakers = new Array();

    for (i = 0; i < lines.length; i++) {
        if ($(lines[i]).attr('name').indexOf('speech') >= 0) {
            var person = lines[i].text.replace(/:$/, "");
            if (!speakers[person]) {
                speakers[person] = 0;
            }
            i++;
            while ((i < lines.length) && ($(lines[i]).attr('name').indexOf('speech') < 0)) {
                speakers[person] ++;
                i++;
            }
            i--;
        }
    }

    appendHtmlToPage(speakers);
    createGraph(speakers);

}

// processFile sets up the doc fragment to be read through
function processFile(respText) {
    $html.append(respText);
    howManyLines($html);
}

// play is loaded in from url
function backgroundReadFile(url) {
    var req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.addEventListener("load", function () {
        if (req.status < 400)
            howManyLines(req.responseText);
    });
    req.send(null);
}

// play is selected when button is clicked
$(document).ready(function () {
    $("button").click(function () {
        
        $("div.chart-area").html("");
        
        $html = $(document.createDocumentFragment());
        url = "../shakespeareproj1/playtext/" + $(this).attr("name") + ".html";
        backgroundReadFile(url);
    });
});