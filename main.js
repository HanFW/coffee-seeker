// define width and height
var mapW = window.innerWidth * 0.85;
var mapH = 500;

// define map projection
var mapProjection = d3.geoMercator()
                      .translate([mapW/2, mapH/2])
                      .center([50,10])
                      .scale(200);

// define path generator
var mapPath = d3.geoPath()
                .projection(mapProjection);

// define color scheme
var mapColor = d3.scaleQuantize()
                 .range(["#f3f4f6", "#cac8c5", "#ad9986", "#b7784e" ,"#73472e"]);

var zoom = d3.zoom()
             .scaleExtent([1, 8])
             .on("zoom", zoomed);

// create SVG element
var mapSvg = d3.select("body")
               .append("svg")
               .attr("width", mapW)
               .attr("height", mapH);

var g_map = mapSvg.append("g");

mapSvg.call(zoom);

// load data
d3.csv("coffee.csv", function(data) {
    dataset = data;
    // console.log(dataset);

    // define input domain for color scale
    mapColor.domain([
        d3.min(dataset, function(d) { return d.Balance; }),
        d3.max(dataset, function(d) { return d.Balance; })
    ]);

    d3.json("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson", function(mapjson) {
        // loop through all the countries in the geojson file
        // console.log(mapjson);

        var dataByCountry;
        for(i = 0; i < mapjson.features.length; i++ ) {
            // console.log(mapjson.features[i].properties.ADMIN);

            dataByCountry = dataset.filter(function(d) {
                return mapjson.features[i].properties.ADMIN == d.Country;
            });

            if(dataByCountry.length == 0) {
                // console.log(mapjson.features[i].properties.name);
                mapjson.features[i].properties.value = 0;
            } else {
                mapjson.features[i].properties.value = d3.max(dataByCountry, function(d) { return d.Balance; });
            }

            // console.log(mapjson.features[i].properties.value);
        }

        // console.log(mapjson.features);

        g_map.selectAll("path")
             .data(mapjson.features)
             .enter()
             .append("path")
             .attr('class', 'mapPath')
             .attr("d", mapPath)
             .style("fill", function(d) {
                //Get data value
                var value = d.properties.value;

                if (value > 0) {
                	//If value exists…
                	return mapColor(value);
                } else {
                	//If value is undefined…
                	return "#ccc";
                }
             });

        g_map.selectAll("path")
             .data(mapjson.features)
             .enter()
             .append("path")
             .attr("d", mapPath);
    });
});

function zoomed(){
    g_map.selectAll('path')
         .attr("transform", d3.event.transform);
}


// define legend
// var legend = mapSvg.selectAll('g.legendEntry')
//     .data(mapColor.range())
//     .enter()
//     .append('g').attr('class', 'legendEntry');
//
// legend
//     .append('rect')
//     .attr("x", mapW - 780)
//     .attr("y", function(d, i) {
//        return i * 20;
//     })
//    .attr("width", 10)
//    .attr("height", 10)
//    .style("stroke", "black")
//    .style("stroke-width", 1)
//    .style("fill", function(d){return d;});
//        //the data objects are the fill colors
//
// legend
//     .append('text')
//     .attr("x", mapW - 765) //leave 5 pixel space after the <rect>
//     .attr("y", function(d, i) {
//        return i * 20;
//     })
//     .attr("dy", "0.8em") //place text one line *below* the x,y point
//     .text(function(d,i) {
//         console.log(mapColor.invertExtent(d));
//         var extent = mapColor.invertExtent(d);
//         //extent will be a two-element array, format it however you want:
//         var format = d3.format("0.2f");
//         return format(+extent[0]) + " - " + format(+extent[1]);
//     });







var margin = {top: 20, right: 20, bottom: 30, left: 180};
var w = 1200 - margin.left - margin.right;
var h = 500 - margin.top - margin.bottom;

d3.csv("coffeetest.csv", function(data) {
     // console.log(data);


    var dataset = data;

    //introduced an ordinal scale to handle the left/right positioning of bars and labels along the x-axis
    var yScale = d3.scaleBand()//an ordinal scale, left to right, evenly spaced
                .rangeRound([h, 0])//calculate even bands starting at 0 and ending at w, then set this scale’s range to those bands
                //enable rounding
                .padding(0.1);//5 percent of the width of each band will be used for spacing in between bands
    var xScale = d3.scaleLinear()
                .range([0,w]);


    //create svg element
    var svg = d3.select("body")
                .append("svg")
                .attr("width", w + margin.left + margin.right)
                .attr("height", h + margin.top + margin.bottom)
                .append("g")
                .attr("transform","translate(" + margin.left + "," + margin.top + ")");

    data.forEach(function(d) {
            d.Balance = +d.Balance;
    });

    xScale.domain([d3.min(dataset, function(d){ return d.Balance;})-0.3,d3.max(dataset, function(d){ return d.Balance;})+0.3])
    yScale.domain(data.map(function(d) { return d.Owner; }))

    svg.selectAll(".bar")
        .data(dataset)
        .enter()
        .append("rect")
        .attr("class","bar")
        .attr("y", function(d){
            return yScale(d.Owner);
        })
        .attr("height", yScale.bandwidth())
        //.attr("x",function(d){
        //    return xScale(d.Balance);
        //})
        .attr("width", function(d){
            return xScale(d.Balance);
        })
        .attr("fill", function(d){ // for new bars
            return "rgb(173,153,134)";
        })
        .on("mouseover", function(d) {
            // get this bar's x/y values, then augment for the tooltip
            var yPosition=-parseFloat(d3.select(this).attr("y")) + yScale.bandwidth() / 2;
            var xPosition=parseFloat(d3.select(this).attr("width")) / 2 + w / 4;

            //update the tooltip position and value
                d3.select("#tooltip")
                    .style("left", xPosition + "px")
                    .style("bottom", yPosition + "px")
                    .select("#value")
                    .html(
                        "Country: " + d.Country + "<br/>"
                        + "Region: " + d.Region + "<br/>"
                        + "Producer: " + d.Producer + "<br/>"
                        + "Owner: " + d.Owner + "<br/>"
                        + "Balance: " + d.Balance + "<br/>"
                        + "Aroma: " + d.Aroma + "<br/>"
                        + "mean altitude: " + d.altitude_mean_meters
                    );
                // show the tooltip
                d3.select("#tooltip").classed("hidden",false);
        })
        .on("mouseout", function(d) {
                // hide the tooltip
                d3.select("#tooltip").classed("hidden", true);

        })
        .on("click", function(){                                   //click to sort the bars
            sortBars();
        })
        //Define sort order flag
        var sortOrder = false;

        //Define sort function
        var sortBars = function() {

            //Flip value of sortOrder
            sortOrder = !sortOrder;

            svg.selectAll("rect")
            .sort(function(a, b) {
                    if (sortOrder) {
                        return d3.ascending(a, b);
                    } else {
                        return d3.descending(a, b);
                    }
                })
            .transition()
            .delay(function(d) {
                return d.Balance * 50;
            })
            .duration(1000)
            .attr("y", function(d) {
                    return yScale(d.Owner);
            })

        };

    svg.append("g")
        .attr("transform", "translate(0," + h + ")")
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .call(d3.axisLeft(yScale));
});
