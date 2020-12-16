import $ from 'jquery';

function scroll() {
    let size = 1.0;
    function zoomout() {
        size = size + 0.02;
        set();
        $("#jobs #job").width($("#jobs #job").width() + (size + size/0.4));
    }
    function zoomin() {
        size = size - 0.02;
        set();
        $("#jobs #job").width($("#jobs #job").width() - (size + size/0.4));
    }
    function set(distance) {
        $("#jobs .tachyons-flex--2m9FY").css("-webkit-transform","scale(" + size + ")");
        $('.spark .job-graph-scrll').css("-webkit-transform","scale(" + size + ")");
        $("#jobs .tachyons-flex--2m9FY").css("transform-origin","0% 0%");
        $('.spark .job-graph-scrll').css("transform-origin","0% 0%");
    }
    $('#jobs').bind('mousewheel', function(event) {
        const dir = window.event.deltaY > 0 ? 'Up' : 'Down';
        if (!event) event = window.event;
        this.scrollTop = this.scrollTop - (event.wheelDelta ? event.wheelDelta : -event.detail * 10);
        if (dir == 'Up') {
            if (size == 1) return;
            zoomout();
        } else {
            if(size < 0.12) return; 
            zoomin();
        } 
        return false;
      });
} 

export default scroll;