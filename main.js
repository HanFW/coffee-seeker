// define width and height for map
var mapW = window.innerWidth * 0.85;
var mapH = 500;

// define other variables for map
var scale;
var domainBycountries = [];
var filters = {
   "Aroma": [0,10],
   "Flavor": [0,10],
   "Acidity": [0,10],
   "Body": [0,10],
   "Aftertaste": [0,10]
}
var filtered = [];

// define width and height for bar chart
var margin = {top: 20, right: 80, bottom: 200, left: 180};
var w = 1200 - margin.left - margin.right;
var h = 800 - margin.top - margin.bottom;



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
                 .range(["#EC8A45", "#CA763A", "#9F5D2D", "#804E36" ,"#4A2D20"]);

var zoom = d3.zoom()
             .scaleExtent([1, 8])
             .on("zoom", zoomed);

// create SVG element
var mapSvg = d3.select("body")
               .append("svg")
               .attr("class", "map")
               .attr("width", mapW)
               .attr("height", mapH);
mapSvg.append("rect")
               .attr("x", 0)
               .attr("y", 0)
               .attr("height", mapH)
               .attr("width", mapW)
               .style("stroke", "black")
               .style("fill", "none")
               .style("stroke-width", 1);


var g_map = mapSvg.append("g");

var svg = d3.select("body")
                .append("svg")
                .attr("width", w + margin.left + margin.right+ 100)
                .attr("height", h + margin.top + margin.bottom)
                .attr("class", "bars")
                .attr("id", "daBars")
                .append("g")
                .attr("transform","translate(" + margin.left + "," + margin.top + ")");
var yScale = d3.scaleBand()
                .rangeRound([h, 0])
                .padding(0.1);
var xScale = d3.scaleLinear()
                .range([0,w]);
    
var x_axis = d3.axisBottom(xScale);
var y_axis = d3.axisLeft(yScale);



mapSvg.call(zoom);

// define legend
mapSvg.append("g")
      .attr("class", "legendQuant")
      .attr("transform", "translate(20,20)");

// load data
d3.csv("coffee.csv", function(data) {
    dataset = data;
    // console.log(dataset);

    // initialize filtered data
    filtered = dataset;

    d3.json("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson", function(mapjson) {

        // loop through all the countries in the geojson file
        var dataByCountry;
        for(i = 0; i < mapjson.features.length; i++ ) {
            // console.log(mapjson.features[i].properties.ADMIN);

            dataByCountry = dataset.filter(function(d) {
                return mapjson.features[i].properties.ADMIN == d.Country;
            });

            if(dataByCountry.length == 0) {
                // console.log(mapjson.features[i].properties.name);
                mapjson.features[i].properties.value = 0;
                mapjson.features[i].properties.coffeeData = 0;
            } else {
                // return the max balance value in the country
                mapjson.features[i].properties.value = d3.max(dataByCountry, function(d) { return d.Balance; });
                domainBycountries.push(+mapjson.features[i].properties.value);

                // bind other coffee data
                mapjson.features[i].properties.coffeeData = [];
                for (j = 0; j < dataByCountry.length; j++) {
                    var coffee = {
                        "Country": dataByCountry[j].Country,
                        "Region": dataByCountry[j].Region,
                        "Producer": dataByCountry[j].Producer,
                        "Owner": dataByCountry[j].Owner,
                        "Altitude": dataByCountry[j].altitude_mean_meters,
                        "Balance": dataByCountry[j].Balance,
                        "Aroma": dataByCountry[j].Aroma,
                        "Flavor": dataByCountry[j].Flavor,
                        "Aftertaste": dataByCountry[j].Aftertaste,
                        "Acidity": dataByCountry[j].Acidity,
                        "Body": dataByCountry[j].Body
                    }
                    mapjson.features[i].properties.coffeeData.push(coffee);
                }
                // console.log(mapjson.features[i].properties.coffeedata);
            }
        }

        // define scale
        scale = mapColor.domain([
           d3.min(domainBycountries),
           d3.max(domainBycountries)
        ]);

        g_map.selectAll("path")
             .data(mapjson.features)
             .enter()
             .append("path")
             .attr('class', 'mapPath')
             .attr("d", mapPath)
             .style("fill", function(d) {

                var value = d.properties.value;

                // console.log(d.properties.coffeedata);

                if (value > 0) {
                	//If value exists…
                	return mapColor(value);
                } else {
                	//If value is undefined…
                	return "#ccc";
                }
             })

        // add legend
        var legend = d3.legendColor()
                       .shapeHeight(10)
                       .shapeWidth(80)
                       .title("Balance rating")
                       .orient("horizontal")
                       .scale(scale);

        mapSvg.select(".legendQuant")
              .call(legend);

        // tooptip on hover
        g_map.selectAll("path")
            .data(mapjson.features)
            .on("mouseover", function(d) {
                d3.select("#tooltip-map")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px")
                .html(d.properties.ADMIN)
                .classed("hidden",false);

                d3.select(this)
                .style("fill", "#537534");
            })
            .on("mouseout", function(d) {
                    d3.select("#tooltip-map").classed("hidden", true);

                    d3.select(this)
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
            })
            .on("click", function(d){
                updateBarChart(d);
            });

        var sliderAcidity = d3
            .sliderBottom()
            .min(6)
            .max(9)
            .width(160)
            .step(0.1)
            .ticks(5)
            .displayValue(false)
            .default([6,10])
            .fill('#2196f3')
            .on('onchange', function(d) {
                min = d[0]; max = d[1];

                // change global filter
                filters.Acidity = [min, max];

                // empty filtered data
                filtered = [];

                // filter on map
                g_map.selectAll("path.mapPath")
                     .style("fill", filterMap);
            });

        d3.select('#slider-acidity')
            .append('svg')
            .attr('width', 200)
            .attr('height', 100)
            .append('g')
            .attr('transform', 'translate(30,30)')
            .call(sliderAcidity);

        var sliderAroma = d3
            .sliderBottom()
            .min(6)
            .max(9)
            .width(160)
            .step(0.1)
            .ticks(5)
            .displayValue(false)
            .default([6,10])
            .fill('#2196f3')
            .on('onchange', function(d) {
                min = d[0]; max = d[1];

                // change global filter
                filters.Aroma = [min, max];

                // empty filtered data
                filtered = [];

                // filter on map
                g_map.selectAll("path.mapPath")
                     .style("fill", filterMap);
            });

        d3.select('#slider-aroma')
            .append('svg')
            .attr('width', 200)
            .attr('height', 100)
            .append('g')
            .attr('transform', 'translate(30,30)')
            .call(sliderAroma);

        var sliderAftertaste = d3
            .sliderBottom()
            .min(6)
            .max(9)
            .width(160)
            .step(0.1)
            .ticks(5)
            .displayValue(false)
            .default([6,10])
            .fill('#2196f3')
            .on('onchange', function(d) {
                min = d[0]; max = d[1];

                // change global filter
                filters.Aftertaste = [min, max];

                // empty filtered data
                filtered = [];

                // filter on map
                g_map.selectAll("path.mapPath")
                     .style("fill", filterMap);
            });

        d3.select('#slider-aftertaste')
            .append('svg')
            .attr('width', 200)
            .attr('height', 100)
            .append('g')
            .attr('transform', 'translate(30,30)')
            .call(sliderAftertaste);

        var sliderBody = d3
            .sliderBottom()
            .min(6)
            .max(9)
            .width(160)
            .step(0.1)
            .ticks(5)
            .displayValue(false)
            .default([6,10])
            .fill('#2196f3')
            .on('onchange', function(d) {
                min = d[0]; max = d[1];

                // change global filter
                filters.Body = [min, max];

                // empty filtered data
                filtered = [];

                // filter on map
                g_map.selectAll("path.mapPath")
                     .style("fill", filterMap);
            });

        d3.select('#slider-body')
            .append('svg')
            .attr('width', 200)
            .attr('height', 100)
            .append('g')
            .attr('transform', 'translate(30,30)')
            .call(sliderBody);

        var sliderFlavor = d3
            .sliderBottom()
            .min(6)
            .max(9)
            .width(160)
            .step(0.1)
            .ticks(5)
            .displayValue(false)
            .default([6,10])
            .fill('#2196f3')
            .on('onchange', function(d) {
                min = d[0]; max = d[1];

                // change global filter
                filters.Flavor = [min, max];

                // empty filtered data
                filtered = [];

                // filter on map
                g_map.selectAll("path.mapPath")
                     .style("fill", filterMap);
            });

        d3.select('#slider-flavor')
            .append('svg')
            .attr('width', 200)
            .attr('height', 100)
            .append('g')
            .attr('transform', 'translate(30,30)')
            .call(sliderFlavor);
    });


// bar chart
    
    
    
});

function zoomed(){
    g_map.selectAll('path')
         .attr("transform", d3.event.transform);
}

function filterMap(d) {
    var inst = d.properties.coffeeData;
    var qualified_in_the_country = [];
    var country = d.properties.ADMIN;
    // console.log(inst);

    if (inst === 0) {
        return "#ccc";
    }

    // find all coffee in the range
    // loop through coffee in each country
    for (j = 0; j < inst.length; j++) {
        var acidity = +inst[j].Acidity;
        var aroma = +inst[j].Aroma;
        var flavor = +inst[j].Flavor;
        var body = +inst[j].Body;
        var aftertaste = +inst[j].Aftertaste;
        // console.log(acidity + " " + aroma + " " + flavor + " " + body + " " +aftertaste);

        if ( // filter by all five attributes
            acidity >= filters.Acidity[0] && acidity <= filters.Acidity[1]
            && aroma >= filters.Aroma[0] && aroma <= filters.Aroma[1]
            && flavor >= filters.Flavor[0] && flavor <= filters.Flavor[1]
            && body >= filters.Body[0] && aroma <= filters.Body[1]
            && aftertaste >= filters.Aftertaste[0] && aftertaste <= filters.Aftertaste[1]
        ) {
            qualified_in_the_country.push(inst[j]);

            // add qualified data to global filtered data
            filtered.push(inst[j]);
        }
    }

    // if no qualified data in the country
    if(qualified_in_the_country.length == 0) {
        // assign new highest balance to country on the map
        d.properties.value = 0;
        return "#ccc";
    }

    // find the new highest Balance
    highestBalance = d3.max(qualified_in_the_country, function(d) { return +d.Balance; });

    // assign new highest balance to country on the map
    d.properties.value = highestBalance;

    return mapColor(highestBalance);
}

function updateBarChart(d) {
    
    var country = d.properties.ADMIN;

    dataset = filtered.filter(function(d) {
        return d.Country == country;
    });

    console.log(dataset);
    
    dataset.forEach(function(d) {
        d.Balance = +d.Balance;
    });
    
    dataset.sort(function(a,b){
        return +a.Balance - +b.Balance
    })
    

    var t = d3.transition()
                .duration(500);


    xScale.domain([d3.min(dataset, function(d){ return d.Balance;})-0.3,d3.max(dataset, function(d){ return d.Balance;})+0.3])
    yScale.domain(dataset.map(function(d) { return d.Owner; }))
    
    var title = svg.selectAll("text")
                    .data(dataset);
        
    title.exit()
            .remove();
    
    title.enter()
        .append("text")        
        .attr("x", (w/2))
        .attr("y", 0)
        .attr("text-anchor","middle")
        .style("font-family","Lucida Calligraphy")
        .style("font-size","22px")
        .merge(title)
        .text("Owners in " + country)

    svg.append("g")
        .attr("class","x axis")
        .attr("transform", "translate(0," + h + ")");

    svg.append("g")
        .attr("class","y axis")
        .attr("transform","translate(" + 0 + ",0)"); 

    var bars = svg.selectAll(".bar")
        .data(dataset)

    bars
        .exit()
        .remove();

    var new_bars = bars
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
        .attr("fill", "rgb(173,153,134)")
        .on("mouseover", function(d) {
           
            var yPosition=mapH + parseFloat(d3.select(this).attr("y")) + yScale.bandwidth() / 2;
            var xPosition=parseFloat(d3.select(this).attr("width")*1.3);
            

            //update the tooltip position and value
                d3.select("#tooltip")
                    .style("left", xPosition + "px")
                    .style("top", yPosition + "px")
                    .select("#value")
                    .html(
                        //"Country: " + d.Country + "<br/>"
                         "Region: " + d.Region + "<br/>"
                        + "Producer: " + d.Producer + "<br/>"
                        + "Owner: " + d.Owner + "<br/>"
                        + "mean altitude: " + d.altitude_mean_meters + "<br/>"
                        + "Balance: " + d.Balance + "<br/>"
                        + "Aroma: " + d.Aroma + "<br/>"
                        + "Flavor: " + d.Flavor + "<br/>"
                        + "Aftertaste: " + d.Aftertaste + "<br/>"
                        + "Acidity: " + d.Acidity + "<br/>"
                        + "Body: " + d.Body
                    );
                // show the tooltip
                d3.select("#tooltip").classed("hidden",false);
        })
        .on("mouseout", function(d) {
                // hide the tooltip
                d3.select("#tooltip").classed("hidden", true);

        })
    
    new_bars.merge(bars)
        .transition(t)
        .attr('width',function(d){
            return xScale(+d.Balance);
        })
        .attr('y', function(d){
            return yScale(d.Owner);
        })
        .attr('height', yScale.bandwidth())
        .attr('fill', "rgb(173,153,134)")
    
    svg.select('.x.axis')
        .call(x_axis);
    
    svg.select('.y.axis')
        .call(y_axis);

    svg.select(".ytxt").remove();
    svg.select(".xtxt").remove();

    svg.append("text")
        .attr("class","ytxt")
        .attr("transform","rotate(-90)")
        .attr("y", 0 - margin.left + 10)
        .attr("x", 0 - (h/2))
        .attr("dy","1em")
        .style("text-anchor", "middle")
        .style("font-family","Lucida Calligraphy")
        .style("font-size","18px")
        .text("Coffee Owners");

    svg.append("text")
        .attr("class","xtxt")
        .attr("y", h + 10)
        .attr("x", w)
        .attr("dx","1em")
        .style("text-anchor", "right")
        .style("font-family","Lucida Calligraphy")
        .style("font-size","14px")
        .text("Balance");

    
};
