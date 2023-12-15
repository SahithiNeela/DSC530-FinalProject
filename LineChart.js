let main;
let entities;
let currentScale = "linear"; // Default scale is linear

// Load data and initialize the chart
d3.csv("MilitaryExpenditureTotal.csv").then(data => {
    main = data;
    entities = [...new Set(data.map(d => d.Entity))];
    console.log(data);
    createScaleDropdown();
    generateMultiLineGraph(data);

});

// Function to generate the line chart
function generateMultiLineGraph(data) {
    const year = [...new Set(data.map(d => d.Year))];
    const entities = [...new Set(data.map(d => d.Entity))];

    // Create a tooltip div
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    const svg = d3.select("#line-chart-svg"),
        margin = {
            top: 20,
            right: 195,
            bottom: 100,
            left: 180
        },
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const x = d3.scaleLinear()
        .range([0, width])
        .domain(d3.extent(data, d => d.Year));

    // Calculate tick values with a 10-year difference, including 2020, excluding 2019
    const tickValues = d3.range(
        Math.floor(d3.min(data, d => d.Year)),
        Math.floor(d3.max(data, d => d.Year)) + 1,
        10
    ).filter(year => year !== 2019).concat([2020]);

    // Format x-axis ticks as integers without commas
    const xAxis = d3.axisBottom(x).tickValues(tickValues).tickFormat(d3.format("d"));

    // Use linear or log scale based on the currentScale variable
    const y = currentScale === "linear" ?
        d3.scaleLinear().range([height, 0]).domain([0, d3.max(data, d => parseFloat(d.military_expenditure))]) :
        d3.scaleLog().range([height, 0]).domain([1, d3.max(data, d => parseFloat(d.military_expenditure))]);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const line = d3.line()
        .x(d => x(d.Year))
        .y(d => y(parseFloat(d.military_expenditure)));

    entities.forEach(Entity => {
        const EntityData = data.filter(d => d.Entity === Entity);

        g.append("path")
            .data([EntityData])
            .attr("class", "line")
            .attr("d", line)
            .style("stroke", color(Entity))
            .on("mouseover", function (event, d) {
                // Show tooltip on mouseover
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9);

                // Find the x-coordinate of the mouse pointer relative to the SVG
                const mouseX = d3.pointer(event)[0];

                // Use the bisector to find the nearest data point
                const bisect = d3.bisector(d => d.Year).left;
                const index = bisect(d, x.invert(mouseX));
                const closestDataPoint = d[index];

                if (closestDataPoint) {
                    // Update tooltip content
                    tooltip.html(`${Entity} (${closestDataPoint.Year}): $${d3.format(",")(closestDataPoint.military_expenditure)}B`)
                        .style("left", (event.pageX) + "px")
                        .style("top", (event.pageY - 28) + "px");
                }
            })
            .on("mousemove", function (event) {
                // Update tooltip position on mousemove
                tooltip.style("left", (event.pageX) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function () {
                // Hide tooltip on mouseout
                tooltip.transition()
                    .duration(1000)
                    .style("opacity", 0);
            });

        // Add legend
        svg.append("text")
            .attr("x", width + margin.left + 80)
            .attr("y", (d, index) => 20 * index)
            .text(Entity)
            .attr("class", "legend");
    });

    g.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("x", width / 2)
        .attr("y", 40)
        .attr("dy", "0.71em")
        .attr("text-anchor", "middle")
        .style("fill", "black")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Year");

    g.append("g")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(currentScale === "linear" ? "$.2s" : ".2s")))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -160)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .attr("x", -60)
        .style("fill", "black")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Expenditure (in dollars)");
}

// Function to create a dropdown for selecting scale
function createScaleDropdown() {
    const dropdownContainer = d3.select("body").append("div")
        .attr("class", "dropdown-container");

    const dropdown = dropdownContainer.append("select")
        .attr("class", "scale-dropdown")
        .on("change", function () {
            currentScale = this.value;
            updateChartScale();
        });

    dropdownContainer.append("label")
        .text("Select Scale: ");

    dropdown.selectAll("option")
        .data(["linear", "log"])
        .enter().append("option")
        .attr("value", d => d)
        .text(d => d);
}

// Function to update the chart based on the selected scale
function updateChartScale() {
    // Remove the existing chart
    d3.select("#line-chart-svg").selectAll("*").remove();

    // Generate the updated chart
    generateMultiLineGraph(main);
}