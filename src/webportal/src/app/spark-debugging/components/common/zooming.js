import $ from 'jquery';

function scroll(id, isCanvas) {
    const element = document.querySelector('#' + id)
    const canvas = $('#' + id);
    const canvasW = canvas.width()
    const canvasH = canvas.height()
    let size = 1.0;
    let w = 2002
    function zoomout() {
        size = size + 0.1;
        const text = Math.floor(size * 100);
        $('.zoom').show().text(text + '%');
        $('.zoom').fadeOut(1500);
        set();
    }
    function zoomin() {
        size = size - 0.1;
        const text = Math.floor(size*100);
        $('.zoom').show().text(text + '%');
        $('.zoom').fadeOut(1500);
        set();
    }
    function set() {
        if(isCanvas) {
            canvas.css({'width': canvasW + (canvasW * size), 'height': canvasH + (canvasH * size)})
        }else {
            element.style.zoom = size;
            element.style.cssText += '; -moz-transform: scale(' + size + ');-moz-transform-origin: 0 0; ';
        }
        
    }
    element.addEventListener('mousewheel',function(event){
        const jw = $('#' + id).width();
        const dir = event.deltaY > 0 ? 'Up' : 'Down';
            if (dir == 'Up') {
                zoomout();
            } else if(w > jw){
                zoomin();
            } 
        event.preventDefault()
        return false;
    }, false)
} 

export default scroll