
var svgData = {};
let dropdown = document.getElementById('path');
var saved = {};

let newCount = 0;


class four {
  constructor(scale = 1, circles = 100) {
    this.makeCanvas();
    this.populateDropdown();
    this.numCircles = circles;
    this.circles = [];
    this.dt = {
      sample : 0.001,
      move : 0.001
    }
    this.loadSVG(svgData.note);
    this.scale = scale * Math.min(window.innerWidth, window.innerHeight) * 1/2;
    this.center = {
      x : window.innerWidth/2,
      y : window.innerHeight/2
    }
    this.drawSpeed = 10; // ms
    this.drawArrows = true;
    this.delTheta = 0;
    this.next = 1;
  }
  makeCanvas() {
    let arrowCanvas = document.createElement('canvas');
    arrowCanvas.width = window.innerWidth;
    arrowCanvas.height = window.innerHeight;
    let canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let canvasCtx = canvas.getContext('2d');
    let arrowCtx = arrowCanvas.getContext('2d');
    canvasCtx.strokeStyle = "#fff";
    arrowCtx.strokeStyle = "#fff";
    document.body.appendChild(arrowCanvas);
    document.body.appendChild(canvas);
    this.canvas = canvas;
    this.arrowCanvas = arrowCanvas;
    this.arrowCtx = arrowCtx;
    this.canvasCtx = canvasCtx;
  }
  start() {
    this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.arrowCtx.clearRect(0, 0, this.arrowCanvas.width, this.arrowCanvas.height);
    this.prevPoint = null;
    this.circles = [];
    this.compute();
    this.circles.sort((a,b) => toPolar(b.x, b.y).length - toPolar(a.x, a.y).length)
    this.running = true;
    this.draw();
  }
  changeCirclesDel (del) {
    this.changeCircles(this.numCircles + del);
  }
  changeCircles (circles) {
    if(circles <= 0) return;
    // if(circles %2 != 0) circles++;
    if(this.numCircles > circles) {
      let l = Math.floor((1-circles)/2);
      let r = Math.floor(circles/2);
      for(let i=0;i<this.circles.length;i++) {
        if(this.circles[i].freq < l || this.circles[i].freq > r) this.circles.splice(i--, 1);
      }
    }
    else {
      // error with theta it is not accurate enough
      let l = Math.floor((1-circles)/2);
      let r = Math.floor(circles/2);
      let ll = Math.floor((1-this.numCircles)/2);
      let rr = Math.floor(this.numCircles/2);
      while(l<ll) {
        this.insertCircle(l++, this.delTheta);
      }
      while(r>rr) {
        this.insertCircle(r--, this.delTheta);
      }
      // this.loadSVG(this.svg);
      // if(this.next) clearTimeout(this.next);
      // this.next = 0;
      // this.start();
    }
    // this.delTheta = 0;
    this.numCircles = circles;
    this.circles.sort((a,b) => toPolar(b.x, b.y).length - toPolar(a.x, a.y).length);
    document.getElementById("circles").innerText = this.numCircles
  }
  changeSpeed (e) {
    this.dt.move = e.value/500;
  }
  populateDropdown() {
    let paths = document.getElementsByTagName('path');
    dropdown.innerHTML = "";
    for(let i=0;i<paths.length-1;i++) {
      svgData[paths[i].id] = paths[i];
      dropdown.innerHTML += '<option value=\"' + paths[i].id + '\">' + paths[i].id + '</option>';
    }
  }
  reload () {
    this.setShape();
  }
  setShape(e) {
    if(e) this.loadSVG(svgData[e.value]);
    if(this.next) clearTimeout(this.next);
    this.next = 0;
    this.start();
  }
  savePath() {
    let path = document.getElementById("pathinput").value;
    if(path.length == 0) return;
    let start = 0, end=path.length-1;
    for(let i=0;i<path.length;i++) {
      if(path[i]=='M') {
        start = i;
        break;
      }
    }
    for(let i=path.length-1;i>=0;i--) {
      if(path[i]>='0' && path[i]<='9') {
        end = i;
        break;
      }
    }
    path = path.substring(start, end + 1);
    let e = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    e.setAttributeNS(null, "d", path);
    e.id = "new"+newCount++;
    document.getElementsByTagName('svg')[0].appendChild(e);
    this.populateDropdown();
    let i = Object.keys(svgData).length -1;
    dropdown.selectedIndex = i;
    this.setShape(dropdown);
  }
  loadSVG(svg) {
    if(!svg) return;
    this.running = false;
    this.svg = svg;
    if(!saved[svg.id]) saved[svg.id] = {};
    this.svgSize = { width : parseInt(this.svg.getBBox().width), height : parseInt(this.svg.getBBox().width)};
  }
  normalise (point) {
    point.x /= this.svgSize.width;
    point.y /= this.svgSize.height;
  }
  insertCircle (freq, theta=0) {
    // theta = Math.floor(theta*100000) / 100000;
    let x = 0, y = 0;
    for(let t = 0; t <= 1; t += this.dt.sample) {
      if(!saved[this.svg.id][t]) saved[this.svg.id][t] = this.svg.getPointAtLength(this.svg.getTotalLength() * t);
      let cartPoint = {x : saved[this.svg.id][t].x, y : saved[this.svg.id][t].y};
      this.normalise(cartPoint);
      let polar = toPolar(cartPoint.x, cartPoint.y);
      let e = 2 * Math.PI * freq * ( -t );
      polar.theta += e;
      let product = toCartesian(polar.length, polar.theta);
      x += product.x * this.dt.sample;
      y += product.y * this.dt.sample;
    }
    let p = toPolar(x, y);
    p.theta +=  2 * Math.PI * freq * theta;
    p = toCartesian(p.length, p.theta);
    this.circles.push({
      x : p.x,
      y : p.y,
      freq : freq,
    });
  }
  compute() {
    if(!this.svg) return;
    let l = Math.floor((1-this.numCircles)/2);
    let r = Math.floor(this.numCircles/2);
    for(let n = l; n <= r; n++) {
      this.insertCircle(n);
    }
    this.circles[r].x = this.circles[r].y = 0;
    this.delTheta = 0;
  }
  getCurrentPoint() {
    let x=0, y=0;
    for(let i=0;i<this.circles.length;i++) {
      let circle = this.circles[i];
      x += circle.x;
      y += circle.y;
    }
    return {x : this.scale*x + this.center.x, y : this.scale*y + this.center.y};
  }
  update() {
    let prevX = 0, prevY = 0;
    for(let i=0;i<this.circles.length-1;i++) {
      let circle = this.circles[i];
      let polar = toPolar(circle.x, circle.y);
      polar.theta += 2 * Math.PI * circle.freq * this.dt.move;
      let cart = toCartesian(polar.length, polar.theta);
      this.circles[i].x = cart.x;
      this.circles[i].y = cart.y;
      if(this.drawArrows) this.drawArrow(this.arrowCtx, prevX, prevY, prevX + cart.x, prevY + cart.y, 5);
      prevX += cart.x;
      prevY += cart.y;
    }
    this.delTheta += this.dt.move;
    if(this.delTheta >= 1) this.delTheta -= 1;
    // console.log(prevX, prevY);
  }
  drawArrow(context, fromx, fromy, tox, toy, headlen) {
    // console.log(headlen);
    context.beginPath();
    fromx *= this.scale; fromy *= this.scale;
    tox *= this.scale; toy *= this.scale;
    fromx += this.center.x; fromy += this.center.y;
    tox += this.center.x; toy += this.center.y;
    // var headlen = 10; // length of head in pixels
    var dx = tox - fromx;
    var dy = toy - fromy;
    var angle = Math.atan2(dy, dx);
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    context.moveTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    context.stroke();
    context.closePath();
  }
  debug() {
    for(var i in this.circles) {
      console.log(this.circles[i]);
    }
    console.log("");
  }
  draw() {
    this.next = 0;
    if(!this.running) return;
    if(!this.prevPoint) {
      this.prevPoint = this.getCurrentPoint();
    }
    if(this.drawArrows) {
      this.arrowCtx.clearRect(0, 0, this.arrowCanvas.width, this.arrowCanvas.height);
      // this.arrowCtx.stroke();
    }
    this.update();
    let curPoint = this.getCurrentPoint();
    // console.log(curPoint);
    this.canvasCtx.beginPath();
    this.canvasCtx.moveTo(this.prevPoint.x, this.prevPoint.y);
    this.canvasCtx.lineTo(curPoint.x, curPoint.y);
    this.canvasCtx.stroke();
    this.canvasCtx.closePath();
    this.prevPoint = curPoint;
    if(this.next) return;
    this.next = setTimeout(this.draw.bind(this), this.drawSpeed);
  }
}


function toPolar(x, y) {
  let length = Math.sqrt(x * x + y * y);
  let theta = Math.atan2(y, x);
  return {length: length, theta: theta}
}

function toCartesian(c, theta) {
  return {x: c * Math.cos(theta), y: c * Math.sin(theta)};
}

var f = new four();
f.start();

window.addEventListener('orientationchange', () => window.location.reload());

console.log("Inspired By %c3b%c1b", 'color:#74BDD8', 'color:#8A5E37');
console.log('^~^');


// Oh, oh-oh-oh-oh, I know the sun must set to rise
