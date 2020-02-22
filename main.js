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

    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson", function(mapjson) {
        // loop through all the countries in the geojson file
        var dataByCountry;
        for(i = 0; i < mapjson.features.length; i++ ) {
            dataByCountry = dataset.filter(function(d) {
                return mapjson.features[i].properties.name == d.Country;
            });

            if(dataByCountry.length == 0) {
                // console.log(mapjson.features[i].properties.name);
                mapjson.features[i].properties.value = 0;
            } else {
                mapjson.features[i].properties.value = d3.max(dataByCountry, function(d) { return d.Balance; });
            }

            // console.log(mapjson.features[i].properties.value);
        }

    console.log(mapjson.features);

    mapSvg.selectAll("path")
          .data(mapjson.features)
          .enter()
          .append("path")
          .attr("d", mapPath)
          .style("fill", function(d) {
              //Get data value
              var value = d.properties.value;
              console.log("test");

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
