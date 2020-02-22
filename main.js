// define width and height
var mapW = 1500;
var mapH = 600;

// define map projection
var mapProjection = d3.geoMercator()
                      .translate([mapW/2, mapH/2])
                      .center([0,20])
                      .scale(200);

// define path generator
var mapPath = d3.geoPath()
                .projection(mapProjection);

// define color scheme
var mapColor = d3.scaleQuantize()
                 .range(["#f3f4f6", "#cac8c5", "#ad9986", "#b7784e" ,"#73472e"]);

// create SVG element
var mapSvg = d3.select("body")
               .append("svg")
               .attr("width", mapW)
               .attr("height", mapH);

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

    mapSvg.selectAll("path")
          .data(mapjson.features)
          .enter()
          .append("path")
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
    });
});









var margin = {top: 20, right: 80, bottom: 200, left: 180};
var w = 1200 - margin.left - margin.right;
var h = 800 - margin.top - margin.bottom;


d3.csv("coffeetest.csv", function(data) {
     console.log(data);


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
            var xPosition=parseFloat(d3.select(this).attr("width")*1.3);

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
        .attr("class","axis")
        .attr("transform", "translate(0," + h + ")")
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .attr("class","axis")
        .attr("transform","translate(" + 0 + ",0)")
        .call(d3.axisLeft(yScale));

    svg.append("text")
        .attr("transform","rotate(-90)")
        .attr("y", 0 - margin.left + 10)
        .attr("x", 0 - (h/2))
        .attr("dy","1em")
        .style("text-anchor", "middle")
        .style("font-family","Lucida Calligraphy")
        .style("font-size","18px")
        .text("Coffee Owners");
    
    svg.append("text")        
        .attr("y", h + 10)
        .attr("x", w)
        .attr("dx","1em")
        .style("text-anchor", "right")
        .style("font-family","Lucida Calligraphy")
        .style("font-size","14px")
        .text("Balance");


});	
   