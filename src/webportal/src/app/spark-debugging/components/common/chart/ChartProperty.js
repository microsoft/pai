export default class ChartProperty {
    /**
     * The constructor function of chartProperty
     * @param {*} dataset {datasets: {}, labels: []} Properties of data in char.js
     * @param {*} axisArguments {xMax, yMax, xUnitName, yUnitName} the parameters of the axis
     * @param {*} chartType This is the type of the specified chart
     * @param {*} hoverText Mouse hover displays text
     * @param {*} chartWidth 
     * @param {*} chartHeight 
     * @param {*} myChartId 
     * @param {*} zoom Set chart scaling
     * @param {*} pan Set chart drag
       */
      constructor(
        dataset, 
        axisArguments, 
        chartType, 
        hoverText, 
        chartWidth,  
        chartHeight,  
        myChartId = 'myChart',
        zoom = {zoomEnabled: true, drag: false, zoomMode: 'xy', speed: 0.05}, 
        pan = {panEnabled: true, panMode: 'xy'},
      ) {
        this.dataset = dataset;
        this.axisArguments = axisArguments;
        this.chartType = chartType;
        this.hoverText = hoverText;
        this.chartWidth = chartWidth;
        this.chartHeight = chartHeight;
        this.myChartId = myChartId;
        this.zoom = zoom;
        this.pan = pan;
    }
}