//************************************************************************
//Analyzes and Graphs Intenral Data from UYoung SVOD (dummy data)
//************************************************************************
  
//Main Function 
function optionChanged() {

  //initiate chart 1
  d3.select("#chart1").html("")

  var url = `/static/external_data.csv`;
  var url_mlregion = `/static/external_data2.csv`;
  var url_int = `/static/internal_data.csv`;

  //Initiates
  d3.csv(url).then(function (response) {
    Object.values(response).map(profit=>{
      if (typeof profit['views']!='undefined'){
        profit['views']=parseFloat(profit['views'])}
    });
    d3.csv(url_mlregion).then(function (response2) {
      Object.values(response2).map(profit=>{
        if (typeof profit['projected_views']!='undefined'){
          profit['projected_views']=parseFloat(profit['projected_views'])}
      });
      d3.csv(url_int).then(function (internal_response) {

        //************************************************************************
        //SORT THE DATA AND STORY IN ARRAYS AND OBJECTS FOR GRAPHING
        //************************************************************************
      
        //create an array of dates for 2020 and sorts it
        var theDates=[];
        for(i=1;i<response.length;i++){
          temp=response[i].view_date;
          if (temp.split('/')[2]==='2020'){
            if (theDates.includes(temp)){        
            }
            else {       
              theDates.push(temp)
            }
          };
        };
    
        //splits the date and and reassembles to make sorting easier
        let myDateSplit="";
        for (i=0;i<theDates.length;i++){
          myDateSplit=theDates[i].split('/');
          theDates[i]=`${myDateSplit[1]}/${myDateSplit[0]}/${myDateSplit[2]}`
        }
    
        theDates.sort()


        //after sorting reassembles to original format 
        //not the most efficient so if I have time I will adjust this but right I have a function dependent on this step
        myDateSplit="";
        for (i=0;i<theDates.length;i++){
          myDateSplit=theDates[i].split('/');
          theDates[i]=`${myDateSplit[1]}/${myDateSplit[0]}/${myDateSplit[2]}`
        }

        
        //variable to store all the months category information
        var myCategoryMonthly={'UYoung':[],'Acquisition':[],'Other':[]};
    
        //creates an object with the dates as the keys (the values are null for now------
        var theProfits={};
        
        theDates.map(date=>{
          theProfits[date]=0;
        });
        
        //change the daily views to an aggregate------
        for(i=1;i<response.length;i++){
          temp=response[i].view_date;
          if (temp in theProfits){
            theProfits[temp]=parseFloat(theProfits[temp]+response[i].views)
            //console.log(parseFloat(theProfits[temp]+response[i].views))
          };
        };
        
        //Map objects into category dictionary
        var myCategoryMonthly={'UYoung':[0,0,0],'Acquisition':[0,0,0],'Other':[0,0,0]};

        Object.entries(internal_response).forEach(([key,value]) => {
          myCategoryMonthly['UYoung'].push(value['Dev'])
          myCategoryMonthly['Acquisition'].push(value['Acq'])
          myCategoryMonthly['Other'].push(value['Oth'])
        });

        //puts projected profits into its own object (adjust q-counter if previous predictions are needed)
        var theProjectedProfits={};
        
        theProjectedProfits['31/12/2021']=0;
        for (q=0;q<response2.length-1;q++){

          let tempDate=response2[q]['date'].split('/')
          if(tempDate[2]==='21'){
            let reorderedDate=""
            if (tempDate[1]<10){
              reorderedDate=`0${tempDate[1]}`
            }
            else {
              reorderedDate=`${tempDate[1]}`
            }
            if (tempDate[0]<10){
              reorderedDate=reorderedDate+`/0${tempDate[0]}`
            }
            else {
              reorderedDate=reorderedDate+`/${tempDate[0]}`
            }
            reorderedDate=reorderedDate+`/20${tempDate[2]}`
            theProjectedProfits[reorderedDate]=response2[q]['projected_views']
          }  
        }
        theProjectedProfits['01/04/2021']=0;

        //************************************************************************
        //SET UP THE SVG GRAPH
        //************************************************************************

        //set the graph size and margins
        var svgWidth = 790;
        var svgHeight = 400;
        var margin = {
          top: 20,
          right: 130,
          bottom: 80,
          left: 100
        };
        var width = svgWidth - margin.left - margin.right;
        var height = svgHeight - margin.top - margin.bottom;

        //set the graph size
        let myValue=0;
        var currMonth='01'

        //Creates temporary arrays for the needed data
        var theX_original=Object.keys(theProfits);
        var theY_original=Object.entries(theProfits).map(([key, value]) =>{
          if(currMonth!=key.split('/')[0]){
            currMonth=key.split('/')[0]
          }    
          return myValue=myValue+value});
        var theX_proj_original=Object.keys(theProjectedProfits);
        var theY_proj_original=Object.values(theProjectedProfits).map(profit=>{return myValue=myValue+profit});

        //calls a function to normalize the data points and dates

        let myTempArray=fillInDates(theX_original,theY_original);
      
        //stores the normalized data and dates into new arrays
        var theX=myTempArray[0];
        var theY=myTempArray[1];

        //calls a function to normalize the data points and dates for the projected 
        myTempArray=fillInDates(theX_proj_original,theY_proj_original);
      
        //stores the normalized projected data and dates into new arrays
        var theXproj=myTempArray[0];
        var theYproj=myTempArray[1];


        count=0
        newMonth=[4,8,3,4,4,2.5,2.7,2.5,2,2.1,2.4,2,2,2]
        currMonth='01'
        oldLastMonth=0
        theSubtract=0
        for(i=0;i<theY.length-1;i++){
          if (currMonth!=theX[i].split('/')[0]){
            currMonth=theX[i].split('/')[0]
            theSubtract=oldLastMonth
            count=count+1
          }
          else oldLastMonth=theY[i]
          theY[i]=(theY[i]*newMonth[count]-theSubtract)
        }


        //************************************************************************
        //Build The SVG Graph Structure
        //************************************************************************
        var svg = d3
          .select("#chart1")
          .append("svg")
          .attr("preserveAspectRatio", "xMinYMin meet")
          .attr("viewBox", "0 0 790 400");

        //set the graph group
        var chartGroup = svg.append("g")
          .attr("transform", `translate(${margin.left}, ${margin.top})`);

        //create the scale of the graph
        var xScale = d3.scaleLinear().domain([0,theX.length+theXproj.length-59]).range([0, width]);
        var yScale = d3.scaleLinear().domain([0,theYproj[theYproj.length-1]+theYproj[theYproj.length-1]*.08]).range([height,0]);


        //sets up the graph points
        //currently myPoints and myCirclePoints are the same -- I may change onw to show more data points later on
        var myPoints=[];
        var myLine=[];
        
        var myCirclePoints=[];


        for (c=0;c<theX.length;c++){
          if (theX[c].split('/')[1]==='01' || theX[c]==='12/30/2020'){
            myPoints.push({'x':c,'y':theY[c]})
            if(c>=90)myLine.push({'x':c-90,'y':theY[c]})
          }
          if (theX[c].split('/')[1]==='01'){
            myCirclePoints.push([c,theY[c]])
          }
        }
        //color for x axis grid
        chartGroup.append('rect').attr('fill',"#F29025").attr("width", 130).attr("height", 5).attr('opacity',.5)
          .attr('x',387).attr('y',300);
        chartGroup.append('rect').attr('fill',"#17CAE2").attr("width", 390).attr("height", 5).attr('opacity',.5)
          .attr('x',0).attr('y',300);
      
        //sets up the projected graph points
        var myPointsProj=[];
        
        var myCirclePointsProj=[];
        
        for (c=0;c<theXproj.length;c++){
          if (theX[c].split('/')[1]==='01'){
            myPointsProj.push({'x':c+theX.length-1-90,'y':theYproj[c]})
          }
          if (theXproj[c].split('/')[1]==='01'){
            if(theXproj[c].split('/')[0]!='12'){
              myCirclePointsProj.push([c+theX.length-1,theYproj[c]])
            }
          }
        }

        //finds only the 1st of the months and uses those dates as the x-axis tick labels
        myTickLabels=[];
        for (b=0;b<theX.length;b++){
          if(theX[b].split('/')[1]=='01'){
            if (parseInt(theX[b].split('/')[0])>3){
            var x_label=returnLabelMonth(theX[b].split('/')[0])
            myTickLabels.push(x_label)}
          }
        }
   
    
        //finds only the 1st of the projected months and uses those dates as the x-axis tick labels
        for (b=0;b<theXproj.length;b++){
          if(theXproj[b].split('/')[1]=='01'){
            if(theXproj[b].split('/')[0]==='04')myTickLabels.push('Mar')
            else{
              var x_label=returnLabelMonth(theXproj[b].split('/')[0])
            
              myTickLabels.push(x_label)
            }
          }
        }
        myTickLabels.push("")
        // Create initial axis functions
        var xAxisScale = d3.scaleLinear().domain([0,myTickLabels.length-1]).range([0, width]);
        var bottomAxis = d3.axisBottom(xAxisScale).tickSizeInner([15]);
        var leftAxis = d3.axisLeft(yScale).tickSizeInner([-width]).tickFormat(d=>numFormatter(d))
        //adjust tick sizes

        leftAxis
        //call the y axis
        chartGroup.append("g")
        .classed("y-axis", true)
        .call(leftAxis).selectAll("text")	
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("font-size", "13px")

        //tick labels x axis
        bottomAxis.tickFormat((d, i) =>myTickLabels[i])
        .tickValues(d3.range(myTickLabels.length))

        chartGroup.append('rect').attr('width',width).attr('height',height).attr('fill','black').attr('opacity',.2)
      

        // call the x axis
        var xAxis = chartGroup.append("g")
          .classed("x-axis", true)
          .attr("transform", `translate(0, ${height})`)
          .call(bottomAxis).selectAll("text")	
          .attr("dx", "+.2em")
          .attr("dy", ".85em")
          .attr("font-size", "13px")
          .attr("transform", "rotate(0)");

        //************************************************************************
        //Chart The SVG Graph Points
        //************************************************************************
  
        
        //set up the line function
        var line = d3.line()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y))
        .curve(d3.curveCatmullRom.alpha(.5))


        //append the lines for the data points
        chartGroup.append('path') // add a path to the existing svg
        .datum(myLine)
        .attr("fill", "none")
        .attr("stroke", "#17CAE2")
        .attr("stroke-width", 4.5)
        .attr('d', line);

        //append the lines for the projected data points
        chartGroup.append('path') // add a path to the existing svg
        .datum(myPointsProj)
        .attr("fill", "none")
        .attr("stroke", "#F29025")
        .attr("stroke-width", 4.5)
        .attr('d', line);

        //plot the circle points
        var circlesGroup = chartGroup.selectAll("circle")
        .data(myCirclePoints.slice(3,12))
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d[0]-90))
        .attr("cy", d => yScale(d[1]))
        .attr("r", 5)
        .attr("stroke", "#17CAE2")
        .attr("stroke-width",2.5)
        .attr("fill", "white")
        .attr("opacity", "1");

        //plot the projected circle points
        var circlesGroupProj = chartGroup.selectAll(".projectedCircle")
        .data(myCirclePointsProj)
        .enter()
        .append("circle")
        .attr("cx", d => {
          if (d!=0)
          return xScale(d[0]-90)
        
        })
        .attr("cy", d => yScale(d[1]))
        .attr("r", 5)
        .attr("stroke", "#F29025")
        .attr("stroke-width", 2.5)
        .attr("fill", "white")
        .attr("opacity", "1");


        //legend
          
        chartGroup.append('rect').attr('fill',"#2b3e4e").attr("width", 97).attr("height", 25)
        .attr('x',30).attr('y',33).attr('opacity',1);
    
        chartGroup.append('rect').attr('fill',"#17CAE2").attr("width", 15).attr("height", 3)
        .attr('x',30).attr('y',37);
  
        chartGroup.append('rect').attr('fill',"#F29025").attr("width", 15).attr("height",3)
        .attr('x',30).attr('y',50);

        chartGroup.append('text').text('Views 2020').attr("x", 50).attr("y", 43)
        .attr('font-size','11.5px').style("fill","#17CAE2")

        chartGroup.append('text').text('Views 2021').attr("x", 50).attr("y", 55)
          .attr('font-size','11.5px').style("fill","#F29025")
        
        chartGroup.append('rect').attr('fill',"#2b3e4e").attr("width", 97).attr("height", 25)
        .attr('x',30).attr('y',33).attr('opacity',0);

        //************************************************************************
        //Creates The SVG for the interactive elements
        //************************************************************************

        //add circle
        //the percentage bars created
        svg.append("rect").attr("id","firstS").attr("width", 90).attr("height", 320)
          .attr("x", 675).attr("y", -2).style("fill","#2b3e4e");

        var middleBar=svg.append("rect").attr("id","firstS").attr("width", 18).attr("height", 300)
          .attr("x", 711).attr("y", 0).style("fill","#17CAE2");
        
        svg.append("rect").attr("id","firstU").attr("width", 60).attr("height", 160)
          .attr("x", 700).attr("y", -4).style("fill","#2b3e4e").attr("opacity",1);
        svg.append("rect").attr("id","firstD").attr("width", 60).attr("height", 160)
          .attr("x", 700).attr("y", 161).style("fill","#2b3e4e").attr("opacity",1);

        //clip boxes
        svg.append("rect").attr("id","clipD").attr("width", 70).attr("height", 100)
          .attr("x", 698).attr("y", 318).style("fill","#2b3e4e").attr("opacity",1);

        //text count positive
        svg.append("text").attr("id","firstUtext").text('0%')
          .attr("x", 700).attr("y", 135).style("fill","#17CAE2")
          .attr('font-size','25px').attr('opacity',0);

        //text count negative
        svg.append("text").attr("id","firstDtext").text('0%')
          .attr("x", 700).attr("y", 205).style("fill","#17CAE2")
          .attr('font-size','25px').attr('opacity',0);

        //text count negative
        var trendText=svg.append("text").attr("id","header").text("")
        .attr("x", 675).attr("y",30 ).style("fill","#17CAE2")
        .attr('font-size','14px').attr('opacity',1);

        //up arrow
        var aM=.07;
        var aX=695.5;
        var aY=125;
        var aU=[(110*aM)+aX,(450*aM)+aY,(360*aM)+aX,(50*aM)+aY,(610*aM)+aX,(450*aM)+aY]

        var upArrow=svg
        .append('polyline').attr('opacity',1)
        .attr('points', `${aU[0]} ${aU[1]}, ${aU[2]} ${aU[3]+10}, ${aU[4]} ${aU[5]}`)
        .style('fill', '#17CAE2');

        //arrow
        aX=695.5;
        aY=129;
        aD=[(110*aM)+aX,(450*aM)+aY,(360*aM)+aX,(880*aM)+aY,(610*aM)+aX,(450*aM)+aY]

        var downArrow=svg
        .append('polyline').attr('opacity',1)
        .attr('points', `${aD[0]} ${aD[1]}, ${aD[2]} ${aD[3]-30}, ${aD[4]} ${aD[5]}`)
        .style('fill', '#17CAE2');

        //counts up the the total views
        var myNumTotalText=svg.append("text")
        .attr("x", 680).attr("opacity","0").attr("y", 248)
        .attr("font-size", "14px").attr("font-weight","bold")
        .attr("fill", "#17CAE2")

        //counts up the the total views
        var myMonthTotalText=svg.append("text")
        .attr("x", 671).attr("opacity","0").attr("y", 200)
        .attr("font-size", "13px").attr("font-weight","bold")
        .attr("fill", "#17CAE2")


        //Month Trend Month Text
        var myMonthText=svg.append("text")
        .attr("x", 694).attr("opacity","0").attr("y", 200).text("March")
        .attr("font-size", "16px").attr("font-weight","bold")
        .attr("fill", "#17CAE2")

        //Month Trend Month Text
        var myValMonthText=svg.append("text")
        .attr("x", 694).attr("opacity","0").attr("y", 220).text("March")
        .attr("font-size", "14px").attr("font-weight","bold")
        .attr("fill", "#12a1b4")

        //Month Trend Month Text
        var myMonthTextU=svg.append("text")
        .attr("x", 694).attr("opacity","0").attr("y", 125).text("March")
        .attr("font-size", "16px").attr("font-weight","bold")
        .attr("fill", "#17CAE2")

        //Month Trend Month Text
        var myValMonthTextU=svg.append("text")
        .attr("x", 694).attr("opacity","0").attr("y", 105).text("March")
        .attr("font-size", "14px").attr("font-weight","bold")
        .attr("fill", "#12a1b4")

        //Month Trend Value Text
        var myMonthValueText=svg.append("text")
        .attr("x", 715).attr("opacity","0").attr("y", 200).text("March")
        .attr("font-size", "16px").attr("font-weight","bold")
        .attr("fill", "#17CAE2");

        myBoxLine=svg.append('rect').attr("width", 35).attr("height", 5)
        .attr("x", 703).attr("y", 156).style("fill","#17CAE2")



      //************************************************************************
      //Set Up Events The Interactivity for Graph
      //************************************************************************

      //Function Event For Mouse Over of Circles
      circlesGroup.on("mouseover",monthCircleSelect); 
      circlesGroupProj.on("mouseover",monthCircleSelect); 
        
      function monthCircleSelect() {
 
        //reset everything
        middleBar.style("fill",'#17CAE2')
        //up arrow
        var aM=.07;
        var aX=695.5;
        var aY=125;
        var aU=[(110*aM)+aX,(450*aM)+aY,(360*aM)+aX,(50*aM)+aY,(610*aM)+aX,(450*aM)+aY]

        upArrow
        .attr('points', `${aU[0]} ${aU[1]}, ${aU[2]} ${aU[3]+10}, ${aU[4]} ${aU[5]}`)
        .attr("transform", `translate(0,0)`)
        .style('fill', '#17CAE2');

        myBoxLine.style('fill','#17CAE2')

        //arrow
        aX=695.5;
        aY=129;
        aD=[(110*aM)+aX,(450*aM)+aY,(360*aM)+aX,(880*aM)+aY,(610*aM)+aX,(450*aM)+aY]

        downArrow
        .attr('points', `${aD[0]} ${aD[1]}, ${aD[2]} ${aD[3]-30}, ${aD[4]} ${aD[5]}`)
        .attr("transform", `translate(0,0)`)
        .style('fill', '#17CAE2');

        trendText.style('fill','#17CAE2')
        trendText2.style('fill','white')

        d3.select("#firstU").attr("width", 60).attr("height", 160)
          .attr("x", 700).attr("y", -4).attr("transform", `translate(0,0)`)
        d3.select("#firstD").attr("width", 60).attr("height", 160)
          .attr("x", 700).attr("y", 161).attr("transform", `translate(0,0)`)

        d3.select("#firstDtext").attr("transform", `translate(0,0)`)
        d3.select("#firstUtext").attr("transform", `translate(0,0)`)
        
        
        var theMonthlyVal=d3.select(this).data()[0][1]
        uyoungsvod.transition().style("fill","orange").duration(1500)
        if (d3.select(this).attr("stroke")==="#F29025") {
          var circle=myCirclePointsProj
          var myColor="#F29025"
          middleBar.transition().style("fill","#F29025").duration(1500)
          trendText.transition().style("fill","#F29025").duration(1500)
          trendText2.transition().style("fill","white").duration(1500)
          myBoxLine.transition().style("fill","#F29025").duration(1500)

          var myTextColor= "#C1731D"
        }
        else {
          circle=myCirclePoints
          var myColor="#17CAE2"
          middleBar.transition().style("fill",myColor).duration(1500)
          trendText.transition().style("fill",myColor).duration(1500)
          trendText2.transition().style("fill",'white').duration(1500)
          myBoxLine.transition().style("fill",'myColor').duration(1500)

          var myTextColor= "#12a1b4"

        }
        var prevMonthVal=findPreviousMonth(theMonthlyVal,circle);//an array of the money made the two last months

        if(prevMonthVal[0]===undefined) {
          prevMonthVal[1]=myCirclePoints[10];
          prevMonthVal[0]=myCirclePoints[11];
        }
        if(prevMonthVal[1]===undefined && prevMonthVal[0]!=undefined) {
          prevMonthVal[1]=myCirclePoints[11];
        }

        //finds the percentage change for the month
        var thePerc= generateBar(prevMonthVal,theMonthlyVal);
        var tempPerc;
        var theDiff=generateBarDiff(prevMonthVal,theMonthlyVal);
        var theFullMonth=returnMonth (`${d3.select(this).data()[0][0]}`)

        fullMonthAdjust=[0,0,0,15,13,9,4,-2,-8,-10,0,0]
        myMonthText.attr("x", 690+fullMonthAdjust[theFullMonth[1].length])
        myMonthTextU.attr("x", 690+fullMonthAdjust[theFullMonth[1].length])
        if (theDiff>0){
          var monthlySum=numberWithCommas(Math.round((theDiff)));
          monthlySum=`+${monthlySum}`
        }
        else{
          var monthlySum=numberWithCommas(Math.round((Math.abs(theDiff))));
          monthlySum=`-${monthlySum}`
        }
        if(monthlySum.length<7){
          myValMonthText.attr('x',699)
          myValMonthTextU.attr('x',699)
        }
        else{
          myValMonthText.attr('x',694)
          myValMonthTextU.attr('x',694)
        }

        //shows the total views in the small selected circle
        myNumTotalText.text(numFormatter(Math.round(theMonthlyVal))).attr('opacity',0)
        .attr("x",84+parseFloat((d3.select(this).attr('cx'))))
        .attr("y",42+parseFloat((d3.select(this).attr('cy'))))
        .attr("fill",myColor)
        .attr("pointer-events",'none')

        //shows the total views in the small selected circle
        myMonthTotalText.text(theFullMonth[0]).attr('opacity',0)
        .attr("x",83+parseFloat((d3.select(this).attr('cx'))))
        .attr("y",5+parseFloat((d3.select(this).attr('cy'))))
        .attr("fill",myColor)
        .attr("pointer-events",'none')
        
        //small circle gets bigger    
        d3.select(this).transition()
          .attr("r", 34)
          .duration(245)


        myNumTotalText.transition()
        .attr("opacity",1)
        .duration(405)

        myMonthTotalText.transition()
        .attr("opacity",1)
        .duration(405)

        if(thePerc>100) {tempPerc=75}
        else if(thePerc>0 && thePerc<36){tempPerc=thePerc*1.2}
        else {tempPerc=thePerc}

        if(thePerc<0){
          if(thePerc<0 && thePerc>-36){tempPerc=thePerc*1.2}
          else {tempPerc=thePerc}
        }
      
        //CONTENT Coordinates X,Y
        content={54300:[44,46,49],82142:[43,45,42],51051:[43,45,49],82761:[42,44,54],91350:[43,44,57],81476:[45,43,49],127708:[41,44,43],
          203632:[41,43,51],194554:[41,44,56],211286:[44,48,47],238474:[42,48,48],257365:[45,45,52],274499:[48,49,48]}
        contentF={54300:[39,33,28],82142:[34,31,27],51051:[33,35,31],82761:[38,33,35],91350:[41,36,38],81476:[43,39,40],127708:[39,38,33],
          203632:[38,33,31],194554:[39,40,28],211286:[39,31,35],238474:[39,37,32],257365:[41,35,37],274499:[40,36,39]}

        //Animate the Trend Count
        //asign colors
        theTrendColor={'#C1731D':["#f5a955","#ef840e","#bf690b"],'#12a1b4':["#a2e9f3", "#17cae2","#108c9d"]}

        console.log(myTextColor)
        trendCount.attr('opacity',0).style('fill','#17CAE2');
        trendCount.transition()
        .attr('opacity',1).style("fill",theTrendColor[myTextColor][0])
        .tween("text", function() {
          var selection = d3.select(this);    // selection of node being transitioned
          var start = 0; // start value prior to transition
          var end = content[Math.round(theMonthlyVal)][0];  // specified end value
          var interpolator = d3.interpolateNumber(start,end); // d3 interpolator
    
        return function(t) { selection.text(`${numberWithCommas(Math.round(interpolator(t)))}%`); };  // return value         
          }).duration(1500)

        trendCount2.attr('opacity',0).style('fill','#17CAE2');
        trendCount2.transition()
        .attr('opacity',1).style("fill",theTrendColor[myTextColor][1])
        .tween("text", function() {
          var selection = d3.select(this);    // selection of node being transitioned
          var start = 0; // start value prior to transition
          var end = content[Math.round(theMonthlyVal)][1];// specified end value
          var interpolator = d3.interpolateNumber(start,end); // d3 interpolator

        return function(t) { selection.text(`${numberWithCommas(Math.round(interpolator(t)))}%`); };  // return value         
          })
          .duration(1500)

        trendCount3.attr('opacity',0).style('fill','#17CAE2');
        trendCount3.transition()
        .attr('opacity',1).style("fill",theTrendColor[myTextColor][2])
        .tween("text", function() {
        var selection = d3.select(this);    // selection of node being transitioned
        var start = 0; // start value prior to transition
        var end = content[Math.round(theMonthlyVal)][2]; // specified end value
        var interpolator = d3.interpolateNumber(start,end); // d3 interpolator

        return function(t) { selection.text(`${numberWithCommas(Math.round(interpolator(t)))}%`); };  // return value         
          })
          .duration(1500)

        trendCount4.attr('opacity',0).style('fill','#17CAE2');
        trendCount4.transition()
        .attr('opacity',1).style("fill",theTrendColor[myTextColor][0])
        .tween("text", function() {
        var selection = d3.select(this);    // selection of node being transitioned
        var start = 0; // start value prior to transition
        var end = contentF[Math.round(theMonthlyVal)][0]; // specified end value
        var interpolator = d3.interpolateNumber(start,end); // d3 interpolator

          return function(t) { selection.text(`${numberWithCommas(Math.round(interpolator(t)))}%`); };  // return value         
          })
          .duration(1500)

        trendCount5.attr('opacity',0).style('fill','#17CAE2');
        trendCount5.transition()
        .attr('opacity',1).style("fill",theTrendColor[myTextColor][1])
        .tween("text", function() {
        var selection = d3.select(this);    // selection of node being transitioned
        var start = 0; // start value prior to transition
        var end = contentF[Math.round(theMonthlyVal)][1];                    // specified end value
        var interpolator = d3.interpolateNumber(start,end); // d3 interpolator

        return function(t) { selection.text(`${numberWithCommas(Math.round(interpolator(t)))}%`); };  // return value         
          })
          .duration(1500)

        trendCount6.attr('opacity',0).style('fill','#17CAE2');
        trendCount6.transition()
        .attr('opacity',1).style("fill",theTrendColor[myTextColor][2])
        .tween("text", function() {
        var selection = d3.select(this);    // selection of node being transitioned
        var start = 0; // start value prior to transition
        var end = contentF[Math.round(theMonthlyVal)][2];                    // specified end value
        var interpolator = d3.interpolateNumber(start,end); // d3 interpolator

        return function(t) { selection.text(`${numberWithCommas(Math.round(interpolator(t)))}%`); };  // return value         
          })
          .duration(1500)

        //***BAR Arrow GRAPH***
        //checks to see if percentage is positive or negative then grows accordingly
        
        if (thePerc>0){
  
        //Shows the total views
        myValMonthText.attr('fill','#17CAE2').attr("transform", `translate(0,0)`).attr('opacity',0);
        myValMonthText.text(monthlySum).transition()
        .attr("opacity", "1")
        .attr("transform", `translate(0,-10)`)
        .attr("fill",myTextColor)
        .duration(1500)

        myMonthText.attr('fill','#17CAE2').attr("transform", `translate(0,0)`).attr('opacity',0);
        myMonthText.text(theFullMonth[1]).transition()
        .attr("opacity", "1")
        .attr("fill",myColor)
        .attr("transform", `translate(0,-10)`)
        .duration(1500)

        d3.selectAll("#firstU").transition()
        .attr("transform", `translate(0,${-1*tempPerc})`).duration(1500);
        //percentage animates up
        d3.selectAll("#firstUtext").style('fill','#17CAE2');
        
        d3.selectAll("#firstUtext").attr('opacity',1);
        d3.selectAll("#firstUtext")
          .text(0)
          .transition()
          .duration(100)
          .style("fill",myColor)
          .tween("text", function() {
              var selection = d3.select(this); // selection of node being transitioned
              var start = 0; // start value prior to transition
              var end = thePerc;  // specified end value
              var interpolator = d3.interpolateNumber(start,end); // d3 interpolator
        
            return function(t) { selection.text(`${Math.round(interpolator(t))}%`); };  // return value         
          })
        .attr("transform", `translate(0,${-1*tempPerc})`)
        .duration(1500);

        //transitions up arrow grows
        upArrow.transition()
        .duration(1500)
        .style("fill",myColor)
        .attr("transform", `translate(0,${-1*tempPerc})`)
        .attr('points', `${aU[0]} ${aU[1]}, ${aU[2]} ${aU[3]+10}, ${aU[4]} ${aU[5]}`)
        
        }
        //if negative    
        else{
          myMonthTextU.text(theFullMonth[1]);
          myValMonthTextU.text(monthlySum);

          myMonthTextU.attr('fill','#17CAE2').attr("transform", `translate(0,0)`).attr('opacity',0);;
          myMonthTextU.transition()
          .attr("opacity", "1")
          .attr("fill",myColor)
          .attr("transform", `translate(0,15)`)
          .duration(1500)

          myValMonthTextU.attr('fill','#17CAE2').attr("transform", `translate(0,0)`).attr('opacity',0);;
          myValMonthTextU.transition()
          .attr("opacity", "1")
          .attr("fill",myTextColor)
          .attr("transform", `translate(0,15)`)
          .duration(1500)


          if(thePerc>100) tempPerc=100;
          else {tempPerc=thePerc};
          d3.selectAll("#firstD").transition()
            .attr("fill",myColor)
            .attr("transform", `translate(0,${-1*tempPerc*1.7})`).duration(1500);

          //percentage counts down
          d3.selectAll("#firstDtext").style('fill','#17CAE2');

          d3.selectAll("#firstDtext").attr('opacity',1);
          d3.selectAll("#firstDtext")
            .text(0)
            .transition()
            .duration(100)
            .style("fill",myColor)
            .tween("text", function() {
                var selection = d3.select(this);    // selection of node being transitioned
                var start = 0; // start value prior to transition
                var end = thePerc;                     // specified end value
                var interpolator = d3.interpolateNumber(start,end); // d3 interpolator
          
              return function(t) { selection.text(`${Math.round(interpolator(t))}%`); };  // return value         
            })
          .attr("transform", `translate(0,${-1*tempPerc*1.7})`)
          .duration(1500);

          //transitions down arrow animate
          downArrow.transition()
          .duration(1500)
          .style("fill",myColor)
          .attr('points', `${aD[0]} ${aD[1]}, ${aD[2]} ${aD[3]-10}, ${aD[4]} ${aD[5]}`)
          .attr("transform", `translate(0,${-1*tempPerc*1.7})`)

          //up arrow retracts
          upArrow.transition()
          .style("fill",myColor)
          .duration(1500)
          .attr('points', `${aU[0]} ${aU[1]}, ${aU[2]} ${aU[3]+27}, ${aU[4]} ${aU[5]}`)
        }

        //Animates the horizontal bar chart
        //2020
        if (myColor==="#17CAE2"){
          let monthsTranslate={'December':12,'January':1,'February':2,'March':3, 'April':4,
          'May':5,'June':6,'July':7,'August':8,'September':9,'October':10,'November':11};
          let endMonthNum=monthsTranslate[theFullMonth[1]];

          categoryAnim(myCategoryMonthly['UYoung'][endMonthNum],'UYoung',false);
          categoryAnim(myCategoryMonthly['Acquisition'][endMonthNum],'Acquisition',false);
          categoryAnim(myCategoryMonthly['Other'][endMonthNum],'Other',false);
        }
        //2021
        else{
          let monthsTranslate={'December':12,'January':1,'February':2,'March':3, 'April':4,
          'May':5,'June':6,'July':7,'August':8,'September':9,'October':10,'November':11};
          let endMonthNum=monthsTranslate[theFullMonth[1]];
          if(endMonthNum<12)endMonthNum=endMonthNum+12;

          categoryAnim(myCategoryMonthly['UYoung'][endMonthNum],'UYoung',true);
          categoryAnim(myCategoryMonthly['Acquisition'][endMonthNum],'Acquisition',true);
          categoryAnim(myCategoryMonthly['Other'][endMonthNum],'Other',true);      
          };        
      };

        //Event For Mouse Out of Circles   
        circlesGroup.on("mouseout", mouseOut);
        circlesGroupProj.on("mouseout", mouseOut);
        
        function mouseOut() {

          UYoung.transition().attr("transform", `translate(0,0)`)
          uyoungsvod.transition().attr("transform", `translate(0,0)`)
          Other.transition().attr("transform", `translate(0,0)`)

          trendText.transition().style('fill','#17CAE2').duration(10);
          trendText2.transition().style('fill','white').duration(10);
          //small circle returns to normal size
          d3.select(this).transition()
            .duration(10)
            .attr("r", 5);

            
            myNumTotalText
            .transition()
            .duration(10)
            .attr("opacity", "0")


            myMonthTotalText
            .transition()
            .duration(10)
            .attr("opacity", "0")

            myMonthTextU.transition()
            .attr("opacity", "0")
            .attr("transform", `translate(0,-10)`)
            .duration(10)

            myValMonthTextU.transition()
            .attr("opacity", "0")
            .attr("transform", `translate(0,-10)`)
            .duration(10)

            trendCount.transition().attr('opacity',0).style('fill','#17CAE2').duration(10);
            myBoxLine.transition().style('fill','#17CAE2').duration(10);
            trendCount2.transition().attr('opacity',0).style('fill','#17CAE2').duration(10);
            myBoxLine.transition().style('fill','#17CAE2').duration(10);
            trendCount3.transition().attr('opacity',0).style('fill','#17CAE2').duration(10);
            myBoxLine.transition().style('fill','#17CAE2').duration(10);
            trendCount4.transition().attr('opacity',0).style('fill','#17CAE2').duration(10);
            myBoxLine.transition().style('fill','#17CAE2').duration(10);
            trendCount5.transition().attr('opacity',0).style('fill','#17CAE2').duration(10);
            myBoxLine.transition().style('fill','#17CAE2').duration(10);
            trendCount6.transition().attr('opacity',0).style('fill','#17CAE2').duration(10);
            myBoxLine.transition().style('fill','#17CAE2').duration(10);


          if (d3.select(this).attr("stroke")==="#F29025") var circle=myCirclePointsProj
          else {
            circle=myCirclePoints
          }

          //the bars reset 
          //checks to see if percentage is positive or negative then grows accordingly
          var theMonthlyVal=d3.select(this).data()[0][1];
          var prevMonthVal=findPreviousMonth(theMonthlyVal,circle);//an array of the money made the two last months

          if(prevMonthVal[0]===undefined) {
            prevMonthVal[1]=myCirclePoints[10];
            prevMonthVal[0]=myCirclePoints[11];
          }
          if(prevMonthVal[1]===undefined && prevMonthVal[0]!=undefined) {
            prevMonthVal[1]=myCirclePoints[11];
          }

          //resets bar
          var thePerc= generateBar(prevMonthVal,theMonthlyVal);
          var tempPerc;
          
          //if the percentage was positve
          if (thePerc>0){

            myMonthText.transition()
            .attr("opacity", "0")
            .attr("transform", `translate(0,10)`)
            .duration(10)
        
            myValMonthText.transition()
            .attr("opacity", "0")
            .attr("transform", `translate(0,10)`)
            .duration(10)

            if(thePerc>100) {tempPerc=100}
            else {tempPerc=thePerc}
            d3.selectAll("#firstU").transition()
              .attr("transform", `translate(0,${0})`).duration(10);
            d3.selectAll("#firstUtext").transition()
            .attr("transform", `translate(0,${0})`).duration(10);
            
            d3.selectAll("#firstUtext").transition().attr('opacity',0)
            .tween("text", function() {
                  var selection = d3.select(this);    // selection of node being transitioned
                  var start = thePerc; // start value prior to transition
                  var end = 0;                     // specified end value
                  var interpolator = d3.interpolateNumber(start,end); // d3 interpolator
            
                return function(t) { selection.text(`${Math.round(interpolator(t))}%`); };  // return value         
              })
            .attr("transform", `translate(0,${0})`)
            .duration(10);
          
            upArrow.transition()
            .style("fill","#17CAE2")
            .duration(10)
            .attr("transform", `translate(0,${0})`)
          }
          //if the percentage was negative
          else{
            if(thePerc>100) tempPerc=100;
            else {tempPerc=thePerc};
            d3.selectAll("#firstD").transition()
              .attr("transform", `translate(0,${0})`).duration(10);
              d3.selectAll("#firstDtext").transition().attr('opacity',0)
              .attr("transform", `translate(0,${0})`).duration(10)
              .tween("text", function() {
                var selection = d3.select(this);    // selection of node being transitioned
                var start = thePerc; // start value prior to transition
                var end = 0;                     // specified end value
                var interpolator = d3.interpolateNumber(start,end); // d3 interpolator
          
              return function(t) { selection.text(`${Math.round(interpolator(t))}%`); };  // return value         
            })
          .attr("transform", `translate(0,${0})`)
          .duration(10);

          //retrn arrows to normal state
          upArrow.transition()
          .style("fill","#17CAE2")
          .duration(10)
          .attr('points', `${aU[0]} ${aU[1]}, ${aU[2]} ${aU[3]+10}, ${aU[4]} ${aU[5]}`)
              
          downArrow.transition()
          .style("fill","#17CAE2")
          .duration(10)
          .attr("transform", `translate(0,${0})`)
          .attr('points', `${aD[0]} ${aD[1]}, ${aD[2]} ${aD[3]-30}, ${aD[4]} ${aD[5]}`)
          };

          middleBar.transition().style("fill","#17CAE2").duration(10)                        
        };

        //************************************************************************
        //CHART 2
        //************************************************************************

        //sets up the second chart 2
        var graphAdjust2=10;
        var svg2 = d3
        .select("#chart1")
        .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 790 100");

        //set the graph group
        var chartGroup2 = svg2.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

        //create the scale of the graph
        var xScale2 = d3.scaleLinear().domain([0,24000]).range([0, width]);


        //Set the axis
        var bottomAxis2 = d3.axisBottom(xScale2).tickSizeInner([-width]).tickFormat(d=>numFormatter(d));
        var xAxis2 = chartGroup2.append("g")
        .classed("x-axis", true)
        .attr("transform", `translate(0, ${graphAdjust2+50})`)
        .call(bottomAxis2).selectAll("text")	
        .style("text-anchor", "end")
        .attr("dx", "-.0em")
        .attr("dy", ".85em")
        .attr("font-size", "13px")
      

        //box to make grid lighter
        chartGroup2.append("rect").attr("width", width+2).attr("height", 80).attr('y',-20).attr('x',-1)
          .attr('fill','black').attr('opacity',.2);

        //top bar
        chartGroup2.append("rect").attr("width", width+10).attr("height", 1).attr('y',-19).attr('x',-10)
        .attr('fill','black').attr('opacity',.2);  

        var UYoung=chartGroup2.append("rect").attr("width", 600).attr("height", 15)
        .attr("x", -599).attr("y", -20+graphAdjust2).style("fill","#a2e9f3");
        
        var uyoungsvod=chartGroup2.append("rect").attr("width", 600).attr("height", 15)
        .attr("x", -599).attr("y", 0+graphAdjust2).style("fill","#17cae2");

        var Other=chartGroup2.append("rect").attr("width", 600).attr("height", 15)
        .attr("x", -599).attr("y", 20+graphAdjust2).style("fill","#108c9d");

        var whitecrop=chartGroup2.append("rect").attr("width", 300).attr("height", 80)
        .attr("x", -300).attr("y", -35+graphAdjust2).style("fill","#2b3e4e");

        //SVG TRENDS
        var chart2Header=svg.append("text").attr("id","header").text("Science Fiction Views")
        .attr("x", 94).attr("y",390).style("fill","white")
        .attr('font-size','22px').attr('opacity',1)

        var trendText2=svg.append("text").attr("id","header").text("GIRL | BOY")
        .attr("x", 674).attr("y",400).style("fill","white").style('text-decoration',"underline")
        .attr('font-size','14px').attr('opacity',1)

        var trendCount=svg2.append("text").attr("id","header").text("0")
        .attr("x", 715).attr("y",19).style("fill","#12a1b4")
        .attr('font-size','16px').attr('opacity',0).attr("font-weight","bold");

        var trendCount2=svg2.append("text").attr("id","header").text("0")
        .attr("x", 715).attr("y",44).style("fill","#12a1b4")
        .attr('font-size','16px').attr('opacity',0).attr("font-weight","bold");

        var trendCount3=svg2.append("text").attr("id","header").text("0")
        .attr("x", 715).attr("y",69).style("fill","#12a1b4")
        .attr('font-size','16px').attr('opacity',0).attr("font-weight","bold");

        var trendCount4=svg2.append("text").attr("id","header").text("0")
        .attr("x", 674).attr("y",19).style("fill","#12a1b4")
        .attr('font-size','16px').attr('opacity',0).attr("font-weight","bold");

        var trendCount5=svg2.append("text").attr("id","header").text("0")
        .attr("x", 674).attr("y",44).style("fill","#12a1b4")
        .attr('font-size','16px').attr('opacity',0).attr("font-weight","bold");

        var trendCount6=svg2.append("text").attr("id","header").text("0")
        .attr("x", 674).attr("y",69).style("fill","#12a1b4")
        .attr('font-size','16px').attr('opacity',0).attr("font-weight","bold");

        svg2.append("text").text('Developed')
        .attr("x", 36).attr("y", 11+graphAdjust2)
        .attr("font-size", "12px").style('fill', 'white')

        svg2.append("text").text('Acquisition')
        .attr("x", 34).attr("y", 31+graphAdjust2)
        .attr("font-size", "12px").style('fill', 'white')

        svg2.append("text").text('Other')
        .attr("x", 61).attr("y", 51+graphAdjust2)
        .attr("font-size", "12px").style('fill', 'white')


        //Function to animate catagories
        function categoryAnim(catSum,category,isOrange){
          if(category==='UYoung'){
            if (isOrange){
              UYoung.transition().style("fill","#f5a955").attr("transform", `translate(${xScale2(catSum)},0)`)
              .duration(1500)  
            }
            else{
              UYoung.transition().style("fill","#a2e9f3").attr("transform", `translate(${xScale2(catSum)},0)`)
              .duration(1500) 
            }
          }
          else if (category==='Acquisition'){
            if (isOrange){
              uyoungsvod.transition().style("fill","#ef840e")
              .duration(1500).attr("transform", `translate(${xScale2(catSum)},0)`).duration(1500)   
            }
            else{
              uyoungsvod.transition().style("fill","#17cae2")
              .duration(1500).attr("transform", `translate(${xScale2(catSum)},0)`).duration(1500)  
            }
          }
          else if (category==='Other'){
            if (isOrange){
              Other.transition().style("fill","#bf690b").attr("transform",
              `translate(${xScale2(catSum)},0)`).duration(1500)
            }
            else
            Other.transition().style("fill","#108c9d").attr("transform",
            `translate(${xScale2(catSum)},0)`).duration(1500)
          }
          else;
        };
      });
    });
  });
};

//************************************************************************
//MAIN FUNCTIONS
//************************************************************************

//function to find the value of the month previous
function findPreviousMonth(theVal,monthData){

  for (t=0;t<monthData.length;t++){
    if (monthData[t].includes(theVal)) {

      return [monthData[t-1],monthData[t-2]]

    }
  }
}

function generateBar(prevMonth,currMonth){

  var growthOld=prevMonth[0][1];
  var growthNew=currMonth;

  var percChange=(growthNew/growthOld-1)*100
  return percChange
}

function generateBarDiff(prevMonth,currMonth){

  var growthOld=prevMonth[0][1];
  var growthNew=currMonth;

  var diffChange=growthNew-growthOld
  return diffChange
}


//function to normalize dates and data
function fillInDates(date,views){
  var monthsLen={'01':31,'02':28,'03':31,'04':30,'05':31,'06':30,'07':31,'08':31,'09':30,'10':31,'11':30,'12':31};
  var newviews=[];
  var newDates=[];
  var tempValue=0;
  var tempNextValue=0;
  var currMonth;
  var nextMonth;
  var currMonthLen;
  var isNewMonth=true;
  var isFinalEntry=false;
  var currYear=2020;
  var currviews=0;
  var nextviews=0;
    
  //iterate through all the dates, find the missing ones and fill in accordingly
  for (i=0;i<date.length;i++){
    //on the last run-through it just runs this one
    if (i===date.length-1){  
        if (isNewMonth===true){
            for (p=1;p<tempNextValue;p++){
                newDates.push(buildDate(p,nextMonth,currYear))
            }
        }
        newDates.push(buildDate(tempNextValue,nextMonth,currYear));
        newviews.push(nextviews);
    }

    //if it isn't the last run-through, run this
    else{
        //set temporary values
        tempValue=parseInt(date[i].split("/")[0]);//the day of the month
        tempNextValue=parseInt(date[i+1].split("/")[0]);//the day of the month in the next string
        currMonth=date[i].split("/")[1];//the current month
        currMonthLen=monthsLen[currMonth];//the number of calendar days in the current month
        nextMonth=date[i+1].split("/")[1];//the month in the next string (which may or may not be the same as the current)
        currYear=date[i].split("/")[2];
        currviews=views[i];
        nextviews=views[i+1];
        var count=0;//count the number of days that are filled in
        var tempviews=[];

        //if this is the first entry in the month but it isn't the 1st, fill in the missing days.
        if (isNewMonth && tempValue!=1 && i!=0){
            for (p=1;p<tempValue;p++){
                newDates.push(buildDate(p,currMonth,currYear))
            }
        }
            
        isNewMonth=false;

        //filling in the missing dates between this entry and the next entry
        if (currMonth===nextMonth){
            for (j=tempValue;j<tempNextValue;j++){
                newDates.push(buildDate(j,currMonth,currYear))
                count=count+1
            }

            newviews.push(currviews);
            if(count>0){
                tempviews=fillInviews(count,currviews,nextviews);
                tempviews.map(val=>newviews.push(val))
            }
            count=0;               
        }

        //if the final entry of the month isn't the last day of the month, fill these in
        else {
            count=0;
            newDates.push(buildDate(tempValue,currMonth,currYear));
            for (k=tempValue+1;k<=currMonthLen;k++){
                newDates.push(buildDate(k,currMonth,currYear))
                count=count+1;
            }
            newviews.push(currviews);
            
            //adds to the count
            count=count+tempNextValue

            if(count>0){
                tempviews=fillInviews(count,currviews,nextviews);
                tempviews.map(val=>newviews.push(val))
            }

            count=0;
            isNewMonth=true;
        }
      }     
        
    }
    return [newDates,newviews];    
}


//for the filInDates function -- to build dates in mm/dd/yyyy format
function buildDate(day,month,year){
    if (day<10){
        day=`${month}/0${day}/${year}`;
    }
    else {
        day=`${month}/${day}/${year}`;
    }
    return day;
}

//for the filInDates function -- interpolates the views to fill in missing dates
function fillInviews(count,viewsA,viewsZ){
    let difference=(viewsZ-viewsA)/count;
    let newNum=viewsA;
    let tempviews=[];

    for (g=1;g<count;g++){
        newNum=newNum+difference;
        tempviews.push(newNum);
    }
    return tempviews;
}

function numFormatter(num) {
  if(num > 999 && num < 1000000){
      return (num/1000).toFixed(0) + 'K'; // convert to K for number from > 1000 < 1 million 
  }else if(num > 1000000){
      return (num/1000000).toFixed(0) + 'M'; // convert to M for number from > 1 million 
  }else if(num < 900){
      return num; // if value < 1000, nothing to do
  }
}


//function to return month
function returnMonth(num){
    var monthsAbr={'364':'Views','395':'Views','423':'Views','454':'Views','90':'Views','120':'Views',
    '151':'Views','181':'Views','212':'Views','243':'Views','273':'Views','304':'Views','334':'Views'};
    var monthsSpelled={'364':'December','395':'January','423':'February','454':'March','90':'March','120':'April',
    '151':'May','181':'June','212':'July','243':'August','273':'September','304':'October','334':'November'};

    return [monthsAbr[num],monthsSpelled[num]]
}

function returnLabelMonth(num){
  var monthsAbr={'01':'Dec','02':'Jan','03':'Feb','04':'Mar','05':'Apr',
  '06':'May','07':'June','08':'July','09':'Aug','10':'Sep','11':'Oct','12':'Nov'};

  return monthsAbr[num];
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

//INITIATE ON FIRST RUN
optionChanged()
