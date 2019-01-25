"use strict";

let data = [
 {x:500, y: 50, w:277, h:63.5, active:false, type:"entryPoint",
 outputInterface:{x:122.5,y:24.5,width:36,height:21},title:"エントリポイント",
 titleAdjust:-15, replaceable: false, isEliminatable: false}
];

let template = {
 "condition":{w:277,h:81, active:false, type:"condition",
  replaceable: false, isEliminatable: true,
  inputInterface:{x:122.5,y:-18,width:36,height:36},
  outputInterface:{yes:{x:58,y:63,width:36,height:3},no:{x:183,y:63,width:36,height:36}},titleAdjust:15},
 "result":{w:96,h:92.5, type:"result", active:false,  replaceable: false, isEliminatable: true,
  inputInterface:{x:30.5,y:-18,width:36,height:36},titleAdjust:15}
};

let toolBoxButtons = [];

let resultToolBox = [
	{id:0,title: "四角形"},{id:1, title: "正三角形"},{id:2,title: "直角二等辺三角形"},{id:3,title: "二等辺三角形"},{id:4,title: "直角三角形"},{id:5,title: "三角形"},
	{id:6,title: "正方形"},{id:7,title: "ひし形"},{id:8,title: "長方形"},{id:9,title: "平行四辺形"},{id:10,title: "台形"}
];

let conditionToolBox = [
	{id:0,title:"1組の平行な辺があるか"},{id:1,title: "頂点は三つか"},{id:2 ,title:"3辺の長さは等しいか"},{id:3,title:"2辺の長さが等しいか"},{id:4,title:"4辺の長さが等しいか"},
	{id:5,title:"直角があるか"},{id:6,title:"2組の平行な辺があるか"}
];

let resultAndCondition = [
	[false,false,false,false,false,false,false],//0
	[false,true,true,true,false,false,false],//1
	[false,true,false,true,false,true,false],//2
	[false,true,false,true,false,false,false],//3
	[false,true,false,false,false,true,false],//4
	[false,true,false,false,false,false,false],//5
	[true,false,true,true,true,true,true],//6
	[true,false,true,true,true,false,true],//7ひしがた
	[true,false,false,true,false,true,true],//8
	[true,false,false,true,false,false,true],//9平行四辺形
	[true,false,false,false,false,false,false]//10台形
];

var conditionIcon;
var blueCircleIcon;
var conditionBg;
var entryPointBg;
var blueCircle;
let assets;
var resultImages = [];
var trash = {};
var trashIcon;
var trashOpenIcon;
var hantei = null;

var projectId;

firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in.
      var displayName = user.displayName;
      var email = user.email;
      var emailVerified = user.emailVerified;
      var photoURL = user.photoURL;
      var isAnonymous = user.isAnonymous;
      var uid = user.uid;
      var providerData = user.providerData;
      // ...
      
    } else {
      // User is signed out.
      // ...
      window.location.href = '../login.html';
    }
  });

function getParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

// init
function setup(){

	projectId = getParam("id");
	if(!projectId || projectId == "")
	{
		//プロジェクトidが無い場合
		return
	}

	firebase.database().ref("projects/"+projectId).once("value")
        .then(function(snapshot) {
		   console.log(JSON.parse(snapshot.child("code").val()));
		   
        });

	createCanvas(document.documentElement.clientWidth, document.documentElement.clientHeight);
	textAlign(CENTER, CENTER);
	  
	let rowHeight = 30;
	let rowSeparate = 5;
	
	for(var r = 0; r < conditionToolBox.length; r++)
	{
		toolBoxButtons.push({x:0,y:(r + 1) * (rowHeight + rowSeparate),w:200,h:rowHeight,title:conditionToolBox[r].title,id:conditionToolBox[r].id,type:"condition"});
	}
	for(var r = 0; r < resultToolBox.length; r++)
	{
		toolBoxButtons.push({x:0,y: (r + 2 + conditionToolBox.length) * (rowHeight + rowSeparate),w:200,h:rowHeight,id:resultToolBox[r].id,title:resultToolBox[r].title,type:"result"});
	}
	toolBoxButtons.push({x: 0 ,y: document.documentElement.clientHeight - rowHeight - 100,w: 200,h: rowHeight,title: "判定" , type:"judge"})
	

	for(let obj in data)
	{

		if(data[obj].type == "condition")
		{
			makeConditionBranch(data[obj])
		}
		
	}
	conditionBg = loadImage("../asset/orangeRect.png");
	entryPointBg = loadImage("../asset/purpleRect.png");
	blueCircle = loadImage("../asset/blueCircle.png");
	conditionIcon = loadImage("../asset/smallRect.png");
	blueCircleIcon = loadImage("../asset/smallCircle.png");
	trashIcon = loadImage("../asset/trash.png");
	trashOpenIcon = loadImage("../asset/trashOpen.png");
	assets = {"condition":conditionBg,"entryPoint":entryPointBg,"result":blueCircle,"conditionIcon":conditionIcon,"resultIcon":blueCircleIcon};
	resultImages = [loadImage("../asset/resultbg0.png"),loadImage("../asset/resultbg1.png"),loadImage("../asset/resultbg2.png"),loadImage("../asset/resultbg3.png"),loadImage("../asset/resultbg4.png"),loadImage("../asset/resultbg5.png"),loadImage("../asset/resultbg6.png"),loadImage("../asset/resultbg7.png"),loadImage("../asset/resultbg8.png"),loadImage("../asset/resultbg9.png"),loadImage("../asset/resultbg10.png")];
	trash.isOpen = false;
	trash.open = {x:220,y:5,w:98,h:141};
	trash.default = {x:220,y:5,w:88.5,h:117};

}

// drawing graphics
function draw(){
	clear();

	drawTrash();
	drawToolBox();
	data = data.sort(compareTypes);
	data.forEach(function(obj){showObject(obj)});

	textSize(50);
	if (hantei != null)
	{
		if(hantei)
		{
			fill(100,200,50);
			text("正解", document.documentElement.clientWidth - 100, document.documentElement.clientHeight - 100);
		}
		else
		{
			fill(200,100,100);
			text("不正解", document.documentElement.clientWidth - 100, document.documentElement.clientHeight - 100);
		}
	}
	
}

function drawTrash()
{
	if(trash.isOpen)
	{
		image(trashOpenIcon,trash.open.x,trash.open.y,trash.open.w,trash.open.h);
	}
	else {
		image(trashIcon,trash.default.x,trash.default.y,trash.default.w,trash.default.h);
	}
}

function makeConditionBranch(obj)
{
	let conditionYes = {x:0, y:0,w:35, h:35,active:false,
		inputInterface: {x:0,y:0,width:35,height:35},type:"yes"};
	let conditionNo = {x:0, y:0, w:35, h:35,active:false,
		inputInterface: {x:0,y:0,width:35,height:35},type:"no"};

	obj.yes = conditionYes;
	obj.no = conditionNo;
	conditionYes.parent = obj;
	conditionNo.parent = obj;

	data.push(conditionNo);
	data.push(conditionYes);
	
}

function drawToolBox()
{
	fill(200, 200, 200, 255);
	rect(0, 0, 200, document.documentElement.clientHeight);
	let rowHeight = 40;
	let rowSeparate = 5;
	textSize(13);
	fill(255, 255, 255, 255);
	let conditionTextPos = getRectCenter(0,0,200,40);
	text("condition",conditionTextPos.x,conditionTextPos.y);
	let resultTextPos = getRectCenter(0,(conditionToolBox.length + 1) * (rowHeight + rowSeparate),200,40);
	text("result",resultTextPos.x,resultTextPos.y);

	toolBoxButtons.forEach(function(obj){
		if(obj.hover)
		{
			fill(255,221,128);
		}
		else {
			fill(255, 255, 255, 255);
		}
		
		rect(obj.x, obj.y, obj.w, obj.h);
		fill(0);
		var pos;
		if(obj.type == "judge")
		{
			pos = getRectCenter(0, obj.y, obj.w, obj.h);
		}
		else {
			pos = getRectCenter(30, obj.y, obj.w - 30, obj.h);
			image(assets[obj.type + "Icon"],5, obj.y + 5,20,20);
		}
		text(obj.title,pos.x,pos.y);
		
	});

}

function getRectCenter(x,y,w,h)
{
	return {x:x+(w/2),y:y+(h/2)};
}

function showObject(obj)
{
	if(obj.parent)
	{
		if(obj.type == "yes")
		{
			obj.inputInterface.x = obj.parent.outputInterface.yes.x + obj.parent.x;
			obj.inputInterface.y = obj.parent.outputInterface.yes.y + obj.parent.y;
		}
		else if(obj.type == "no")
		{
			obj.inputInterface.x = obj.parent.outputInterface.no.x + obj.parent.x;
			obj.inputInterface.y = obj.parent.outputInterface.no.y + obj.parent.y;
		}
		else if(obj.parent.type == "yes" || obj.parent.type == "no")
		{
			obj.parent.outputInterface.x = obj.x + obj.inputInterface.x;
			obj.parent.outputInterface.y = obj.y + obj.inputInterface.y;

		}
		else{
			obj.x = obj.parent.outputInterface.x + obj.parent.x - obj.inputInterface.x;
			obj.y = obj.parent.outputInterface.y + obj.parent.y - obj.inputInterface.y;
		}
		
	}

	if(obj.type == "result")
	{
		image(resultImages[obj.id], obj.x, obj.y, obj.w,obj.h);
	}
	else if(assets[obj.type])
	{
		image(assets[obj.type], obj.x, obj.y, obj.w,obj.h);
	}

	if(obj.type == "yes" || obj.type == "no")
	{
		if(obj.type == "yes")
		{
			fill(0, 200, 0);
		}
		else if(obj.type == "no"){
			fill(200, 0, 0);
		}
		
		ellipse(obj.inputInterface.x + 18, obj.inputInterface.y + 18, obj.inputInterface.width, obj.inputInterface.height);

		if(!obj.child && !obj.active)
		{
			obj.outputInterface = null;
		}

		if(obj.outputInterface)
		{
			ellipse(obj.outputInterface.x + 18, obj.outputInterface.y + 18, obj.outputInterface.width, obj.outputInterface.height);
			if(obj.type == "yes")
		{
			stroke(0, 200, 0);
		}
		else if(obj.type == "no"){
			stroke(200, 0, 0);
		}
		line(obj.inputInterface.x + 18, obj.inputInterface.y + 18, obj.outputInterface.x + 18, obj.outputInterface.y + 18);
		noStroke();
		
		}
		
	}

	if(obj.title && obj.type != "result")
	{
		fill(255);
		textSize(15);
		let pos = getRectCenter(obj.x,obj.y,obj.w,obj.h + obj.titleAdjust);
		text(obj.title,pos.x,pos.y);
	}
	
}

function tappedJudgeButton()
{
	if(hantei == null)
	{

		let outputData = $.extend([], data);
		let entryPointData =  outputData.filter(e => e.type == "entryPoint")[0];

		let simpleStruct = getSimpleStructData(entryPointData)
		let usedResultIds = JSON.stringify(usingAllResults(simpleStruct).sort());
		let resultIds = JSON.stringify(resultToolBox.map(function(e){return e.id}).sort());

		hantei = (isAllCorrect(simpleStruct,[],[]) && isUsingAllBranch(simpleStruct) && usedResultIds == resultIds);
		firebase.database().ref("projects/"+projectId).update({
			code:JSON.stringify(simpleStruct)
		});
		var yattokoDataRef = firebase.database().ref("projects/"+projectId+"/yattoko").push()
		yattokoDataRef.set({
			user:firebase.auth().currentUser.uid,
			json:JSON.stringify(simpleStruct),
			hantei:hantei
		});
		document.getElementById("defaultCanvas0").toBlob(function(blob){
			firebase.storage().ref().child("yattoko/" + projectId + "/"+ yattokoDataRef.key + ".png").put(blob);
		});

	}
}

function isAllCorrect(obj,falseQuestions,trueQuestions)
{
	if(obj.yes)
	{
		if(!isAllCorrect(obj.yes, falseQuestions, trueQuestions.concat(obj.id)))
		{
			return false;
		}
	}
	if(obj.no)
	{
		if(!isAllCorrect(obj.no, falseQuestions.concat(obj.id), trueQuestions))
		{
			return false;
		}
	}
	if(obj.child || obj.type == "entryPoint")
	{
		if(!isAllCorrect(obj.child,falseQuestions,trueQuestions))
		{
			return false;
		}
	}
	if(obj.type == "result")
	{
		for(var falseQ = 0; falseQ < falseQuestions.length; falseQ++)
		{
			if(resultAndCondition[obj.id][falseQuestions[falseQ]])
			{
				return false;
			}
		}
		for(var trueQ = 0; trueQ < trueQuestions.length; trueQ++)
		{
			if(!resultAndCondition[obj.id][trueQuestions[trueQ]])
			{
				return false;
			}
		}
	}
	return true;
}

function isUsingAllBranch(obj)
{
	if(obj.yes && obj.no)
	{
		return (isUsingAllBranch(obj.yes) && isUsingAllBranch(obj.no));
	}
	else if(obj.child)
	{
		return isUsingAllBranch(obj.child);
	}
	else if(!obj.yes && !obj.no) //resultの場合
	{
		return true;
	}
	else //yesとnoどちらかしか無い場合
	{
		return false;
	}
}

function usingAllResults(obj)
{
	var results = []
	if(obj.yes || obj.no)
	{
		if(obj.yes)
		{
			results = results.concat(usingAllResults(obj.yes));
		}
		if(obj.no)
		{
			results = results.concat(usingAllResults(obj.no))
		}
	}
	else if(obj.child)
	{
		results = results.concat(usingAllResults(obj.child));
	}
	else if(obj.type == "result")
	{
		return [obj.id]
	}
	return results

}

function getSimpleStructData(obj)
{
	var result = {};
	if(obj.id != null)
	{
		result.id = obj.id
	}
	if(obj.title)
	{
		result.title = obj.title;
	}
	if(obj.type)
	{
		result.type = obj.type;
	}
	if(obj.child)
	{
		result.child = getSimpleStructData(obj.child);
	}
	if(obj.yes && obj.yes.child)
	{
		result.yes = getSimpleStructData(obj.yes.child);
	}
	if(obj.no && obj.no.child)
	{
		result.no = getSimpleStructData(obj.no.child);
	}
	
	return result;
}

// when mouse is pressed
function mousePressed(){

	data.forEach(function(obj){
		if(!obj.fixed)
		{
			if(obj.type=="yes" || obj.type == "no")
			{
				if(obj.outputInterface)
				{
					obj.active = checkTouch(obj.outputInterface.x,obj.outputInterface.y,obj.outputInterface.width,obj.outputInterface.height,mouseX,mouseY);
				}
				else {
					obj.active = checkTouch(obj.inputInterface.x,obj.inputInterface.y,obj.inputInterface.width,obj.inputInterface.height,mouseX,mouseY);
				}
				if(obj.active)
				{
					console.log("active!!");
				}
				
			}
			else {
				obj.active = checkTouch(obj.x,obj.y,obj.w,obj.h,mouseX,mouseY);
			}
			
			if(obj.active)
			{
				data.filter(n =>n !== obj).forEach(function(n){n.active = false});
			}

			if(obj.type=="yes" || obj.type == "no")
			{
				if(obj.outputInterface)
				{
					obj.touchPosition = getTouchPosition(obj.outputInterface.x,obj.outputInterface.y,mouseX,mouseY);
				}
				else{
					obj.touchPosition = getTouchPosition(obj.inputInterface.x,obj.inputInterface.y,mouseX,mouseY);
				}
				
			}
			else {
				obj.touchPosition = getTouchPosition(obj.x,obj.y,mouseX,mouseY);
			}
			
		}
	});

	data.forEach(function(obj){
		if(!obj.fixed)
		{	
			if(obj.active && obj.parent && !(obj.type == "yes" || obj.type == "no" || obj.parent.type == "yes" || obj.parent.type == "no"))
			{
				obj.parent.child = null;
				obj.parent = null;
				console.log("released");
			}
			
		}
	});

	toolBoxButtons.forEach(function(obj){
		if(checkTouch(obj.x,obj.y,obj.w,obj.h,mouseX,mouseY))
		{
			if(obj.type == "judge")
			{
				tappedJudgeButton();
			}
			else {
				let newElem;
				newElem = jQuery.extend(true, {}, template[obj.type]);
				newElem.title = obj.title;
				newElem.id = obj.id;
				newElem.x = mouseX - newElem.w / 2;
				newElem.y = mouseY - newElem.h / 2;
				newElem.touchPosition = {x:newElem.w/2,y:newElem.h/2};
				newElem.active = true;
				if(newElem.type == "condition")
				{
					makeConditionBranch(newElem);
				}
				data.push(newElem);
			}
			
			
		}
	});
}


// when mouse is dragged
function mouseDragged(){

	data.forEach(function(obj){
		if(obj.active)
		{
			if(obj.type=="yes" || obj.type == "no")
			{
				obj.outputInterface = {width:36,height:36};
				obj.outputInterface.x = mouseX - obj.touchPosition.x;
				obj.outputInterface.y = mouseY - obj.touchPosition.y;
				
			}
			else {
				obj.x = mouseX - obj.touchPosition.x;
				obj.y = mouseY - obj.touchPosition.y;
			}
			
			if(obj.parent && (obj.parent.type == "yes" || obj.parent.type == "no"))
			{
				obj.parent.outputInterface = {width:36,height:36};
				obj.parent.outputInterface.x = obj.x + obj.inputInterface.x;
				obj.parent.outputInterface.y = obj.y + obj.inputInterface.y;
			}

			if(trash.isOpen)
			{
				trash.isOpen = checkTouch(trash.open.x,trash.open.y,trash.open.w,trash.open.h,mouseX,mouseY);
			}
			else
			{
				trash.isOpen = checkTouch(trash.default.x,trash.default.y,trash.default.w,trash.default.h,mouseX,mouseY);
			}
			
		}
	});

	mouseMoved();
	return false;
}


// when mouseclick is released
function mouseReleased(){

	data.forEach(function(obj){
		if(obj.active && (trash.isOpen || checkTouch(0,0,200,1800,mouseX,mouseY)))
		{
			del(obj);
		}
		if(obj.active && obj.inputInterface && !(obj.type=="yes"||obj.type=="no"))
		{
			data.forEach(
				function(obj2){
					if(!obj2.active && obj2.outputInterface && !obj2.outputInterface.yes && obj.parent != obj2)
					{
						if(isOverlap(obj.inputInterface.x + obj.x,obj.inputInterface.y + obj.y,obj.inputInterface.width,obj.inputInterface.height,obj2.outputInterface.x + obj2.x, obj2.outputInterface.y + obj2.y,obj2.outputInterface.width,obj2.outputInterface.height))
						{
							hantei = null;
							obj.parent = obj2;
							if(obj2.child)
							{
								obj2.child.parent = null;
								obj2.child.x += 100;
								obj2.child.y += 100;
							}
							obj2.child = obj;
							
						}
					}
				}
			)
		}
		else if((obj.type == "yes" || obj.type == "no") && obj.outputInterface)
		{
			data.forEach(
				function(obj2){
					if(!obj2.active && obj2.inputInterface && obj2.type != "yes" && obj2.type != "no" && obj != obj2 && obj.child != obj2)
					{
						if(isOverlap(obj.outputInterface.x,obj.outputInterface.y,obj.outputInterface.width,obj.outputInterface.height,obj2.inputInterface.x + obj2.x,obj2.inputInterface.y + obj2.y,obj2.inputInterface.width,obj2.inputInterface.height))
						{
							hantei = null;
							obj.child = obj2;
							if(obj2.parent)
							{
								obj2.parent.child = null;
								obj2.parent.x += 100;
								obj2.parent.y += 100;
							}
							obj2.parent = obj;
							
						}
					}
				}
			)
			if(!obj.child)
			{
				hantei = null;
				obj.outputInterface = null;
			}
		}
	});

	data.forEach(function(obj){
		obj.active = false;
	});

	trash.isOpen = false;

	
}

function mouseMoved()
{
	toolBoxButtons.forEach(function(obj){
		if(checkTouch(obj.x,obj.y,obj.w,obj.h,mouseX,mouseY))
		{
			obj.hover = true;	
		}
		else{
			obj.hover = false;
		}
	});
}

function isOverlap(x1,y1,w1,h1,x2,y2,w2,h2)
{
	if(Math.abs((x1 + w1 / 2)-(x2 + w2 / 2)) < w1 / 2 + w2 / 2 && Math.abs((y1 + h1 / 2)-(y2 + h2 / 2)) < h1 / 2 + h2 / 2)
	{
		return true;
	}
	else {
		return false;
	}
}

function checkTouch(x1,y1,w1,h1,mouseX,mouseY)
{
	return (x1 < mouseX && mouseX < (x1 + w1) && y1 < mouseY && mouseY < (y1 + h1));
}

function getTouchPosition(x,y,mouseX,mouseY)
{
	return {x:mouseX-x,y:mouseY-y};
}

function del(obj)
{
	if(obj.isEliminatable == false)
	{
		return;
	}

	 if(obj.child)
	{
		del(obj.child)
	}
	if(obj.yes)
	{
		del(data.filter(n=> n === obj.yes)[0])
	}
	if(obj.no)
	{
		del(data.filter(n=> n === obj.no)[0])
	}
	if(obj.parent)
	{
		obj.parent.child = null;
	}
	
	data = data.filter(n => n != obj);
}

function compareTypes(a,b)
{
	let typeDic = {result:2,entryPoint:2,condition:2,yes:3,no:4}
	return typeDic[a.type] - typeDic[b.type]
}