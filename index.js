"use strict";

var nodeIds, shadowState, nodesArray, nodes, edgesArray, edges, network;

let resultToolBox = [
	{id:0,label: "四角形"},{id:1, label: "正三角形"},{id:2,label: "直角二等辺三角形"},{id:3,label: "二等辺三角形"},{id:4,label: "直角三角形"},{id:5,label: "三角形"},
	{id:6,label: "正方形"},{id:7,label: "ひし形"},{id:8,label: "長方形"},{id:9,label: "平行四辺形"},{id:10,label: "台形"}
];

let conditionToolBox = [
	{id:0,label:"1組の平行な辺があるか"},{id:1,label: "頂点は三つか"},{id:2 ,label:"3辺の長さは等しいか"},{id:3,label:"2辺の長さが等しいか"},{id:4,label:"4辺の長さが等しいか"},
	{id:5,label:"直角があるか"},{id:6,label:"2組の平行な辺があるか"}
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

var projectId;

var selectedSidePanelTab = 0;

firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
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

function showLeftSideMenu(selected) {
	$("#leftSidePanelList").empty();
	selectedSidePanelTab = selected;
	var data;
	if(selectedSidePanelTab == 0)
	{
		$("#selectorContainer .selectorButton:first").addClass("selectorButton-selected");
		$("#selectorContainer .selectorButton:nth-child(2)").removeClass("selectorButton-selected");
		data = conditionToolBox;
	}
	else {
		$("#selectorContainer .selectorButton:nth-child(2)").addClass("selectorButton-selected");
		$("#selectorContainer .selectorButton:first").removeClass("selectorButton-selected");
		data = resultToolBox;
	}

	for (var item in data) {
		$("#leftSidePanelList").append('<li class="leftSidePanelListItem"  onclick="addObject('+data[item].id+');">'+ data[item].label +'</li>')
	}
}

function addObject(item) {
	if(selectedSidePanelTab == 0)
	{
		nodes.add({id:(Math.random() * 1e7).toString(32),label:conditionToolBox[item].label});
	}
	else {
		nodes.add({id:(Math.random() * 1e7).toString(32),label:resultToolBox[item].label, shape: 'box'});
	}
	
}

$(function() {

	showLeftSideMenu(0);

	 // create an array with nodes
	nodes = new vis.DataSet(conditionToolBox);
	 
// create an array with edges
	edges = new vis.DataSet([
		{from: 1, to: 3},
		{from: 1, to: 2},
		{from: 2, to: 4},
		{from: 2, to: 5}
	]);

	// provide the data in the vis format
	var data = {
			nodes: nodes,
			edges: edges
	};
	var options = {
		layout:{
			hierarchical: {
				sortMethod: "directed"
			}
		},
		edges: {
			arrows: {to: true}
		},
		manipulation: {
			enabled: true
		}
	};

	// initialize your network!
	network = new vis.Network(document.getElementById('network'), data, options);
});