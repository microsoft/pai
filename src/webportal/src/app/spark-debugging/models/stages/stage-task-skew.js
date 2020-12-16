const d3 = require('d3')
import Convert from '../utils/convert-utils'

export default class StageTaskDataSkew {
    static getAllTasks(stageId, stage_attempId, application) {
        try {
            let graphDataArr = new Array();
            let stage = application.getSpecifyStage(stageId);
            if (stage == null || stage.attempts == null || stage.attempts.length == 0) {
                return graphDataArr;
            }
            let attempt = stage.attempts.find(s => s.attemptId == stage_attempId);
            if (!attempt) {
              return [];
            }
            let tasks = attempt.tasks;
            if (tasks.length != 0) {
                let index = 0;
                for (let t of tasks) {
                    graphDataArr[index] = new Array(3);
                    graphDataArr[index][0] = t.readBytes + t.bytesWritten + t.shuffleLocalBytesRead + t.shuffleBytesWritten;
                    graphDataArr[index][1] = t.duration;
                    graphDataArr[index][2] = t.taskId;
                    index++;
                }
                return graphDataArr;
            }
            return graphDataArr;
        } catch (e) {
            console.log(e)
        }
    }

    static drawGraph(dataset) {
        var width = 400;
        var height = 300;

        var padding = { top: 20, right: 20, bottom: 30, left: 50 };
        var svg = d3.select("#content").append("svg:svg")
            .attr("width", width)
            .attr("height", 400);

        var xMax = 1.1 * d3.max(dataset, function (d) {
            if (d[0] == 0) {
                return 8;
            } else {
                return d[0];
            }
        })
        if (xMax < 50)
            xMax = 50;
        var xUnitName = Convert.getBytesUnitName(xMax);

        var xScale = d3.scaleLinear()
            .rangeRound([0, width - padding.left - padding.right])
            .domain([0, Convert.formatBytesByUnitName(xMax, xUnitName)]);

        var yMax = 1.1 * d3.max(dataset, function (d) {
            return d[1];
        });
        var yUnitName = Convert.getTimeUnitName(yMax);
        var yScale = d3.scaleLinear()
            .rangeRound([height - padding.top - 20, 0])
            .domain([0, Convert.formatTimeByUnitName(yMax, yUnitName)]);

        // Add tooltip        
        var tooltip = d3.select("#content")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "1px")
            .style("border-radius", "5px")
            .style("padding", "10px")

        svg.append('g')
            .selectAll("dot")
            .data(dataset)
            .enter()
            .append("circle")
            .attr("fill", "red")
            .attr("cx", function (d) {
                return padding.left + xScale(Convert.formatBytesByUnitName(d[0], xUnitName));
            })
            .attr("cy", function (d) {
                return yScale(Convert.formatTimeByUnitName(d[1], yUnitName)) + 20;
            })
            .attr("r", 4)
            .on("mouseover", function (d) {
                tooltip
                    .html("TaskId: " + d[2] + " {" + Convert.formatBytesByUnitName(d[0], xUnitName) + ", "
                        + Convert.formatTimeByUnitName(d[1], yUnitName) + "}")
                    .style("left", (d3.event.pageX + 5) + "px")
                    .style("top", (d3.event.pageY - 10) + "px")
                    .style("opacity", 1);
            })
            .on('mouseout', function (d) {
                d3.select(this).transition()
                    .duration('50')
                    .attr('opacity', '1');
                tooltip.transition()
                    .duration('300')
                    .style("opacity", 0);
            });

        var xAxis = d3.axisBottom().scale(xScale).ticks(8);

        var yAxis = d3.axisLeft().scale(yScale);

        svg.append("g").attr("class", "axis")
            .attr("transform", "translate(" + padding.left + "," + (height - 20) + ")")
            .call(xAxis);

        svg.append("g").attr("class", "axis")
            .attr("transform", "translate(" + padding.left + "," + padding.top + ")")
            .call(yAxis);

        svg.append("text")
            .attr("transform",
                "translate(" + (width / 2) + " ," +
                (height + 10) + ")")
            .style("text-anchor", "middle")
            .attr("dx", "1em")
            .text("Data size/" + xUnitName);

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Exectution Time/" + yUnitName);

    }
}