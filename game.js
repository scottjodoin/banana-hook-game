
var _c = document.getElementById("game");
var _ctx = _c.getContext("2d");
var _stepSpeed = 20;

var _gameObjects = [];
var _stepInterval;
var _keyPresses = {};
var _difficulty = "easy";
var _bananaCount = 0;
var _grabbedBanana = null;
// sounds
var aBackground = new Audio('aBackground.mp3');
aBackground.loop = true;

var aWin = new Audio('aWin.mp3');
var aGrab = new Audio('aGrab.mp3');
var aMiss = new Audio('aMiss.mp3');

// images
const img_banana1  = document.getElementById("img-banana1");
const img_banana2  = document.getElementById("img-banana2");
const img_hook  = document.getElementById("img-hook");


class GameObject{
  constructor({id, objectType, ctx, img, coord, imgCoord, boundingBox}){
    this.startCoord = coord.clone();
    this.id = id;
    this.objectType = objectType;
    this.ctx = ctx;
    this.img = img;
    this.coord = coord;
    this.imgCoord = imgCoord;
    this.boundingBox = boundingBox;

    this.goto = false;
  }

  addGotoPoint = function(p){
    if (this.gotoPoints == null) this.gotoPoints = [];
    this.gotoPoints.push(p);
    this.goto = true;
  }

  get absoluteBoundingBox(){
    let bb = this.boundingBox;
    let {x,y} = this.coord;
    let ic = this.imgCoord;
    let trueBoundingBox = new Rectangle(
      x-ic.x + bb.x,y-ic.y+bb.y,bb.width,bb.height
    );
    return trueBoundingBox;
  }

  pointInside = function(p){
    return this.absoluteBoundingBox.pointInside(p);
  }

  step = function(){
    if (!!this.gotoPoints && this.goto) this.gotoPointsStep();
  }

  gotoPointsStep = function(){
    if (this.gotoPoints.length ==  0){
      this.goto = false;
      return;
    }

    let dp = this.gotoPoints[0]; // dest point

    if (this.coord.distanceTo(dp) < 3){
      this.coord = dp;
      this.gotoPoints.shift(1);
      return;
    }

    let {x,y} = this.coord;
    let ratio = 0.3;
    this.move(
      new Point(
      (dp.x - x) *ratio,
      (dp.y - y) * ratio)
    );
  }

  move = function(delta){
    this.coord = new Point(
      this.coord.x + delta.x,
      this.coord.y + delta.y,
    );
  }

  paint = function(){
    let drawCoord = new Point(this.coord.x - this.imgCoord.x, this.coord.y - this.imgCoord.y);
    let ctx = this.ctx;

    if (this.objectType == "hook"){
      // draw stroke

      let lineEndPoint = new Point(this.coord.x+6,this.coord.y-100);
      ctx.beginPath();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#16161E";
      ctx.moveTo(lineEndPoint.x,0);
      ctx.lineTo(lineEndPoint.x,lineEndPoint.y);
      ctx.stroke();
    }
    // draw image
    ctx.drawImage(this.img, drawCoord.x, drawCoord.y);
  }
}

// get relative mouse coords
function relMouseCoords(event){
  var totalOffsetX = 0;
  var totalOffsetY = 0;
  var canvasX = 0;
  var canvasY = 0;
  var currentElement = this;

  do{
      totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
      totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
  }
  while(currentElement = currentElement.offsetParent)

  canvasX = event.pageX - totalOffsetX;
  canvasY = event.pageY - totalOffsetY;

  return new Point(canvasX, canvasY);
}
HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;

class Rectangle{
  constructor(x, y, height, width){
    this.x = x;
    this.y = y;
    this.height = height;
    this.width = width;
  }

  centerPoint = function(){
    return new Point(
      this.x + (this.width / 2),
      this.y + (this.height / 2 )
    );
  }

  pointInside(p){
    return p.x>=this.x && p.y>=this.y
      &&p.x <this.x+this.width
      &&p.y <this.y+this.height;
  }

  shrink(v){
    // additive
    return new Rectangle(this.x+v,this.y+v,this.width-v*2,this.height-v*2);
  }

  scale(r){
    return new Rectangle(this.x*r,this.y*r,this.width*r,this.height*r);
  }
  get right(){
    return this.x + this.width;
  }

  get bottom(){
    return this.y + this.height;
  }
}
class Point {
  constructor(x, y){
    this.x = x;
    this.y = y;
  }

  distanceTo(p){
    return Math.sqrt(Math.pow(this.x - p.x,2) + Math.pow(this.y - p.y,2));
  }
  
  scale(ratio){
    return new Point(this.x * ratio, this.y * ratio);
  }

  add(point){
    return new Point(this.x + point.x, this.y + point.y);
  }
  clone(){
    return new Point(this.x,this.y);
  }

  onTopOf(p){
    return Math.abs(this.x-p.x) < 1 && Math.abs(this.y-p.y) < 1;
  }
}

document.getElementById('start-game').onclick = async function() {
  
  // clear the game canvas
  _ctx.clearRect(0, 0, _c.width, _c.height);
  _gameObjects = [];

  _c.focus();

  // background sounds
  aBackground.play();

  // banana count
  _bananaCount = document.getElementById("banana-count").value;

  for (let i = 0; i < _bananaCount; i++){
    let img = (Math.random()<0.5) ? img_banana1:img_banana2;
    let coord = getRandomPoint();
    let banana = new GameObject({
      id:`banana${i}`,
      objectType:"banana",
      ctx:_ctx,
      imgCoord: new Point(60,55),
      img,
      coord,
      boundingBox: new Rectangle(32,34,50,31)
    });
    _gameObjects[banana.id] = banana;
  }
  
  // Make GameObjects
  let hookOptions = {
    id: "hook",
    objectType: "hook",
    ctx:_ctx,
    img:img_hook,
    coord:new Point(100,300),
    imgCoord: new Point(13,110),
    boundingBox: new Rectangle(2,95,25,25)
  };
  let hook = new GameObject(hookOptions);
  hook.speed = 5;

  _gameObjects[hook.id] = hook;


  // mouse events
  _c.onmousemove = mouseMove;
  _c.onmousedown = mouseDown;
  _c.onmouseup = mouseUp;
  _c.onkeydown = keyDown;
  _c.onkeyup = keyUp;

  // step
  if (_stepInterval) clearInterval(_stepInterval);
  _stepInterval = setInterval(step,_stepSpeed);


}
function getRandomPoint(){
  let p;
  let a = new Rectangle(0,0,_c.width,_c.height).shrink(40);

  p = new Point(
    randomInt(a.x, a.right),
    randomInt(a.y, a.bottom)
    );

  return p; 
}

function randomInt(min,max)
{
  return Math.floor(min + Math.random() * (max-min));
}


function step(){
  paint();

  // move hook
  let hook = _gameObjects["hook"];

  if (!hook.goto){
    let hookDelta = {
      KeyA:new Point(-1,0),
      KeyW: new Point(0,-1),
      KeyD: new Point(1,0),
      KeyS: new Point(0,1),
    }

    for (key in hookDelta){
      if (_keyPresses[key] == "on"){
        let delta = hookDelta[key];
        hook.move(delta.scale(hook.speed));
      }
    }

    if (_keyPresses["KeyB"] == "on"){
      _keyPresses["KeyB"] = "off";

      let bananas = getObjectsByType("banana");
      
      if (bananas.length > 0) {
        bb = bananas[0].absoluteBoundingBox;
        console.log(bb, bb.centerPoint());
        hook.addGotoPoint(bb.centerPoint())
      };
    }

    if (_keyPresses["Space"] == "on"){
      _keyPresses["Space"] = "off";

      hook.addGotoPoint(new Point(hook.coord.x,-100))
      hook.addGotoPoint(new Point(hook.coord.x, 100));

      let bananas = getObjectsByType("banana");
      let candidate = bananas.find((o)=>{
        console.log(o.boundingBox,hook.coord, o.absoluteBoundingBox);
        return o.pointInside(hook.coord)
      });
      console.log(candidate);
      if (candidate){
        _grabbedBanana = candidate;
        aGrab.play();
      } else {
        aMiss.play();
      }
    }

    if (_keyPresses["KeyR"] == "on"){
      _keyPresses["KeyR"] = "off";

      hook.addGotoPoint(hook.startCoord);
    }
  }

  if (hook.goto && _grabbedBanana != null){
    _grabbedBanana.coord = hook.coord;
    if (_grabbedBanana.coord.y < 0){

      // delete the banana
      delete _gameObjects[_grabbedBanana.id];
      _grabbedBanana = null;
      let remainingBananas = getObjectsByType("banana");
      console.log(remainingBananas);
      if (remainingBananas.length == 0){
        aBackground.pause();
        aWin.play();
        for (let i = 0; i < 11; i++)
          hook.addGotoPoint(getRandomPoint());
        setTimeout(()=>{document.getElementById("start-game").click()},3500);
      }
    }
  }

  hook.step();
}

function paint(){
  _ctx.clearRect(0, 0, _c.width, _c.height);
  for(id in _gameObjects){
    let gameObject = _gameObjects[id];
    gameObject.paint();
  }
}

function getObjectsByType(objectType){
  return Object.values(_gameObjects).filter(o=>o.objectType == objectType);
}

function drawLine(p1, p2, c){
  _ctx.strokeStyle= c;
  _ctx.beginPath();
  _ctx.moveTo(p1.x,p1.y);
  _ctx.lineTo(p2.x,p2.y);
  _ctx.stroke();
}

function mouseMove(e){
  let p = new Point(e.offsetX, e.offsetY);
 
  paint();
}

function mouseDown(e){
  let p = new Point(e.offsetX, e.offsetY);

  paint();
}

function mouseUp(e){
  let p = new Point(e.offsetX, e.offsetY);
}

function keyDown(e){
  let key = e.code;
  //console.log(key);
  _keyPresses[key] = "on";
}
function keyUp(e){
  let key = e.code;
  _keyPresses[key] = "off";
}