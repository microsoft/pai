export default class HighChartsProperty {
    /**
     * The constructor function of highchartsProperty
     * @param {*} char {}
     * @param {*} xAxis {}
     * @param {*} series [{}, {}]
     * @param {*} yAxis {}
     * @param {*} tooltip {}
     * @param {*} chartSubtitle {} 
       */
      constructor(
        chart,
        xAxis,
        series,
        yAxis,
        tooltip,
        chartSubtitle = {text: ''},
      ) {
        this.chart = chart;
        this.xAxis = xAxis;
        this.series = series;
        this.yAxis = yAxis;
        this.tooltip = tooltip;
        this.chartSubtitle = chartSubtitle;
    }
}