// Common function to generate bar chart
function generateBarChart(data, svgId, dropdownId, tooltipId) {
    // Adjust the width and height of the SVG
    var svgWidth = 1200; // Adjust as needed
    var svgHeight = 500; // Adjust as needed
    var margin = {
        top: 50,
        right: 20,
        bottom: 50,
        left: 50
    };

    var svg = d3.select(svgId).append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Create scales and axes
    var xScale = d3.scaleBand().range([0, svgWidth - margin.left - margin.right]).padding(0.1);
    var yScale = d3.scaleLinear().range([svgHeight - margin.top - margin.bottom, 0]);

    var xAxis = d3.axisBottom(xScale);
    var yAxis = d3.axisLeft(yScale).tickFormat(d3.format("$.1s")); // Format ticks as dollars in billions

    // Add X and Y axes (only once)
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + (svgHeight - margin.top - margin.bottom) + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y-axis")
        .call(yAxis);

    // Populate dropdown with entities
    var dropdown = d3.select(dropdownId)
        .style("height", "25px") // Limit the height of the dropdown
        .style("overflow-y", "auto"); // Add vertical scroll if needed

    dropdown.selectAll("option")
        .data(entities)
        .enter().append("option")
        .text(d => d);

    // Append a tooltip div to the SVG container
    var tooltip = d3.select(tooltipId)
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden");

    // Function to update the chart based on the selected entity
    function updateChart(selectedEntity) {
        // Filter data based on the selected entity
        var filteredData = data.filter(d => d.Entity === selectedEntity);

        // Update scales with filtered data
        xScale.domain(filteredData.map(d => d.Year));
        yScale.domain([0, d3.max(filteredData, d => +d.military_expenditure)]);

        // Add X axis label
        svg.append("text")
            .attr("class", "axis-label")
            .attr("transform", "translate(" + (svgWidth - margin.left - margin.right) / 2 + "," +
                (svgHeight - margin.top + 35) + ")")
            .style("text-anchor", "middle")
            .text("Year");

        // Add Y axis label
        svg.append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (svgHeight - margin.top - margin.bottom) / 2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Expenditure (in billions)");

        // Remove existing bars
        svg.selectAll(".bar").remove();

        // Append new bars with tooltips
        svg.selectAll(".bar")
            .data(filteredData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.Year))
            .attr("width", xScale.bandwidth())
            .attr("y", d => yScale(+d.military_expenditure))
            .attr("height", d => svgHeight - margin.top - margin.bottom - yScale(+d.military_expenditure))
            .attr("fill", "#3498db")
            .on("mouseover", function (event, d) {
                // Show tooltip on mouseover
                d3.select(this)
                    .attr("fill", "#00008b"); // Change color on hover (optional)

                var tooltipText = "Year: " + d.Year + "<br>Expenditure: $" + d3.format(",")(d.military_expenditure);
                showTooltip(tooltipText, event);
            })
            .on("mousemove", function (event) {
                // Update tooltip position on mousemove
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function () {
                // Hide tooltip on mouseout
                d3.select(this)
                    .attr("fill", "#3498db"); // Revert color on mouseout (optional)

                hideTooltip();
            });

        // Function to show tooltip
        function showTooltip(text, event) {
            const tooltip = d3.select(tooltipId);

            tooltip.transition().duration(200).style("opacity", 0.9);

            tooltip
                .html(text)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px")
                .style("visibility", "visible"); // Set visibility to visible
        }

        // Function to hide tooltip
        function hideTooltip() {
            const tooltip = d3.select(tooltipId);

            tooltip.transition().duration(200).style("opacity", 0);
            tooltip.style("visibility", "hidden");
        }

        // Update X axis with rotated labels
        svg.select(".x-axis")
            .call(xAxis)
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        // Update Y axis
        svg.select(".y-axis").call(yAxis);
    }

    // Event listener for dropdown change
    dropdown.on("change", function () {
        var selectedEntity = d3.select(this).property("value");
        updateChart(selectedEntity);
    });

    // Initialize chart with the first entity
    updateChart(entities[0]);
}

// Load data for the first chart
d3.csv("MilitaryExpenditureTotal.csv").then(data => {
    entities = [...new Set(data.map(d => d.Entity))];
    generateBarChart(data, "#bar-chart-svg-1", "#Entity-dropdown-1", "#tooltip-1");
});

// Load data for the second chart
d3.csv("MilitaryExpenditureTotal.csv").then(data => {
    entities = [...new Set(data.map(d => d.Entity))];
    generateBarChart(data, "#bar-chart-svg-2", "#Entity-dropdown-2", "#tooltip-2");
});