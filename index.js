"use strict";

var nodeIds, shadowState, nodesArray, nodes, edgesArray, edges, network;

let ObjectKind = {
	Target: "TARGET",
	Condition: "CONDITION",
	EntryPoint: "ENTRY POINT"
}

let EdgeType = {
	Yes: "YES",
	No: "NO",
	Entry: "ENTRY"
}

var addEdgeTmp;

let consitions = [
	{id:0,text:"1組の平行な辺があるか"},
	{id:1,text: "頂点は三つか"},
	{id:2,text:"3辺の長さは等しいか"},
	{id:3,text:"2辺の長さが等しいか"},
	{id:4,text:"4辺の長さが等しいか"},
	{id:5,text:"直角があるか"},
	{id:6,text:"2組の平行な辺があるか"}
];

let targets = [
	{id:1,name: "正三角形",
		condition: {
			0: false,
			1: true,
			2: true,
			3: true,
			4: false,
			5: false,
			6: false
	}},
	{id:0,name: "四角形",
		condition:{
			0: false,
			1: false,
			2: false,
			3: false,
			4: false,
			5: false,
			6: false
		}},
	{id:2,name: "直角二等辺三角形",
		condition: {
			0: false,
			1: true,
			2: false,
			3: true,
			4: false,
			5: true,
			6: false
		}},
	{id:3,name: "二等辺三角形",
		condition: {
			0: false,
			1: true,
			2: false,
			3: true,
			4: false,
			5: false,
			6: false
		}},
	{id:4,name: "直角三角形",
		condition: {
			0: false,
			1: true,
			2: false,
			3: false,
			4: false,
			5: true,
			6: false
		}},
	{id:5,name: "三角形",
		condition: {
			0: false,
			1: true,
			2: false,
			3: false,
			4: false,
			5: false,
			6: false
		}},
	{id:6,name: "正方形",
		condition: {
			0: true,
			1: false,
			2: true,
			3: true,
			4: true,
			5: true,
			6: true
		}},
	{id:7,name: "ひし形",
		condition: {
			0: true,
			1: false,
			2: true,
			3: true,
			4: true,
			5: false,
			6: true
		}},
	{id:8,name: "長方形",
		condition: {
			0: true,
			1: false,
			2: false,
			3: true,
			4: false,
			5: true,
			6: true
		}},
	{id:9,name: "平行四辺形",
		condition: {
			0: true,
			1: false,
			2: false,
			3: true,
			4: false,
			5: false,
			6: true
		}},
	{id:10,name: "台形",
		condition: {
			0: true,
			1: false,
			2: false,
			3: false,
			4: false,
			5: false,
			6: false
		}}
];

let targetToolBox = [
	{id:0,label: "四角形"},{id:1, label: "正三角形"},{id:2,label: "直角二等辺三角形"},{id:3,label: "二等辺三角形"},{id:4,label: "直角三角形"},{id:5,label: "三角形"},
	{id:6,label: "正方形"},{id:7,label: "ひし形"},{id:8,label: "長方形"},{id:9,label: "平行四辺形"},{id:10,label: "台形"}
];

let conditionToolBox = [
	{id:0,label:"1組の平行な辺があるか"},{id:1,label: "頂点は三つか"},{id:2 ,label:"3辺の長さは等しいか"},{id:3,label:"2辺の長さが等しいか"},{id:4,label:"4辺の長さが等しいか"},
	{id:5,label:"直角があるか"},{id:6,label:"2組の平行な辺があるか"}
];

let targetAndCondition = [
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
			projectId = getParam("id",window.location.href);
			load();
    } else {
      // User is signed out.
      // ...
      window.location.href = '../login.html';
    }
});

function load() {
	firebase.database().ref('projects/' + projectId).once('value').then(function(snapshot) {
		if(snapshot.val().code && snapshot.val().code != "{}") {
			let data = JSON.parse(snapshot.val().code);
			let entryPointId = nodes.get()[0].id;
			addToNodes(data,entryPointId);
		}
	});
	
	
}

function addToNodes(node,parent) {
	let newId = addObject(node.link,node.isCondition);
	nodes._data[parent].edgeIds.push(addToEdges(parent,newId,EdgeType.Entry));
	if(node.yes) addToNodes(node.yes,newId);
	if(node.no) addToNodes(node.no,newId);
}

function addToEdges(from, to, type) {
	let edgeId = (Math.random() * 1e7).toString(32);
	edges.add({
		from: from,
		to: to,
		type: type,
		id: edgeId,
		label: type,
	});
	return edgeId;
}

function save() {
	let entryPointId = nodes.get().find(node=> node.type == ObjectKind.EntryPoint).id;
	let json = translateToServerData(entryPointId);
	firebase.database().ref("projects/"+projectId).update({
		code:JSON.stringify(json)
	});
	console.log(json);
}

function translateToServerData(id) {
	let node = nodes._data[id];

	if(node.type == ObjectKind.EntryPoint) {
		if(node.edgeIds && node.edgeIds.length != 0) {
			return translateToServerData(edges._data[node.edgeIds[0]].to);
		}
		else {
			return {};
		}
	}

	var returnValue = {
		link: node.link,
		isCondition: node.isCondition
	}

	if(node[EdgeType.Yes]) {
		returnValue.yes = translateToServerData(edges._data[node[EdgeType.Yes]].to);
	}

	if(node[EdgeType.No]) {
		returnValue.no = translateToServerData(edges._data[node[EdgeType.No]].to);
	}

	return returnValue;
}

function getParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        targets = regex.exec(url);
    if (!targets) return null;
    if (!targets[2]) return '';
    return decodeURIComponent(targets[2].replace(/\+/g, " "));
}

function tappedJudgeButton()
{
	if(hantei == null)
	{

		let outputData = $.extend([], data);
		let entryPointData =  outputData.filter(e => e.type == "entryPoint")[0];

		let simpleStruct = getSimpleStructData(entryPointData)
		let usedtargetIds = JSON.stringify(usingAlltargets(simpleStruct).sort());
		let targetIds = JSON.stringify(targetToolBox.map(function(e){return e.id}).sort());

		hantei = (isAllCorrect(simpleStruct,[],[]) && isUsingAllBranch(simpleStruct) && usedtargetIds == targetIds);
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
	if(obj.type == "target")
	{
		for(var falseQ = 0; falseQ < falseQuestions.length; falseQ++)
		{
			if(targetAndCondition[obj.id][falseQuestions[falseQ]])
			{
				return false;
			}
		}
		for(var trueQ = 0; trueQ < trueQuestions.length; trueQ++)
		{
			if(!targetAndCondition[obj.id][trueQuestions[trueQ]])
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
	else if(!obj.yes && !obj.no) //targetの場合
	{
		return true;
	}
	else //yesとnoどちらかしか無い場合
	{
		return false;
	}
}

function usingAlltargets(obj)
{
	var targets = []
	if(obj.yes || obj.no)
	{
		if(obj.yes)
		{
			targets = targets.concat(usingAlltargets(obj.yes));
		}
		if(obj.no)
		{
			targets = targets.concat(usingAlltargets(obj.no))
		}
	}
	else if(obj.child)
	{
		targets = targets.concat(usingAlltargets(obj.child));
	}
	else if(obj.type == "target")
	{
		return [obj.id]
	}
	return targets

}

function getSimpleStructData(obj)
{
	var target = {};
	if(obj.id != null)
	{
		target.id = obj.id
	}
	if(obj.title)
	{
		target.title = obj.title;
	}
	if(obj.type)
	{
		target.type = obj.type;
	}
	if(obj.child)
	{
		target.child = getSimpleStructData(obj.child);
	}
	if(obj.yes && obj.yes.child)
	{
		target.yes = getSimpleStructData(obj.yes.child);
	}
	if(obj.no && obj.no.child)
	{
		target.no = getSimpleStructData(obj.no.child);
	}
	
	return target;
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
		data = targetToolBox;
	}

	for (var item in data) {
		$("#leftSidePanelList").append('<li class="leftSidePanelListItem"  onclick="tapToolbox('+data[item].id+');">'+ data[item].label +'</li>')
	}
}

function tapToolbox(item) {
	addObject(item,selectedSidePanelTab == 0);
	save();
}

function addObject(item,isCondition){
	let id = (Math.random() * 1e7).toString(32)
	if(isCondition)
	{
		nodes.add({
		id: id,
		label:conditionToolBox[item].label,
		color: "#ED9A5D",
		type: ObjectKind.Condition,
		link: conditionToolBox[item].id,
		isCondition: true,
		edgeIds: []
		});
		return id;
	}else {
		nodes.add({
		id: id,
		label:targetToolBox[item].label, shape: 'box',
		color:"#4A90E2",
		type: ObjectKind.Target,
		link: conditionToolBox[item].id,
		isCondition: false,
		edgeIds: []
		});
		return id;
	}
}

function closePopup() {
	$("#popup").css("display","none");
	$("#popupBackGround").css("display","none");
}

function addEdgeMode(from,edgeType) {
	addEdgeTmp = {
		from: from,
		type: edgeType
	};
	closePopup();
}

function deleteNode(node) {
	let toNode = nodes.get().find(function(elem){return elem.id == node});
	nodes.remove({id:node});
	for(var i in toNode.edgeIds) {
		edges.remove({id: toNode.edgeIds[i]});
	}
	save();
	closePopup();
}

function deleteEdge(nodeId,type) {
	let node = nodes.get().find(i => i.id == nodeId);
	let id = node[type];
	nodes._data[nodeId][type] = null;
	node.edgeIds = node.edgeIds.filter(i => i != id);
	let toId = edges._data[id].to;
	nodes._data[toId].edgeIds = 	nodes._data[toId].edgeIds.filter(i => i != id);
	edges.remove({id: id});
	save();
	closePopup();
}

function addEdge(to) {
	let toNode = nodes.get().find(function(elem){return elem.id == to});
	if(addEdgeTmp && 
		addEdgeTmp.from != to && 
		toNode.type != ObjectKind.EntryPoint &&
		!edges.get().find(function(elem){return elem.to == to})
		) {
			let fromNode = nodes.get().find(function(elem){return elem.id == addEdgeTmp.from});
			let edgeId = (Math.random() * 1e7).toString(32);
		edges.add({
			from: addEdgeTmp.from,
			to: to,
			type: addEdgeTmp.type,
			id: edgeId,
			label: addEdgeTmp.type,
		});
		nodes._data[addEdgeTmp.from][addEdgeTmp.type] = edgeId;
		toNode.edgeIds.push(edgeId);
		fromNode.edgeIds.push(edgeId);
	}
	addEdgeTmp = null;
	save();
	closePopup();
}

$(function() {

	showLeftSideMenu(0);

	nodes = new vis.DataSet([
		{id:(Math.random() * 1e7).toString(32),
		color:"#9013FE",
		label:"ENTRY POINT",
		type: ObjectKind.EntryPoint,
		edgeIds: []
		}]);
	edges = new vis.DataSet([]);

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
		}
	};

	// initialize your network!
	network = new vis.Network(document.getElementById('network'), data, options);

	network.on("select",function(param) {
		if (param.nodes.length != 0) {
			let node = nodes.get().find(function(elem){return elem.id == param.nodes[0]});
			$("#popupButtons").empty();
			if(addEdgeTmp) {
				addEdge(node.id);
				return;
			}
			else if(node.type == ObjectKind.Condition) {
				if(node[EdgeType.Yes]) {
					$("#popupButtons").append("<li onclick='deleteEdge(\""+node.id+"\",\""+EdgeType.Yes+"\");'>Yesの接続を解除</li>");
				}else {
					$("#popupButtons").append("<li onclick='addEdgeMode(\""+node.id+"\",\""+EdgeType.Yes+"\");'>Yesのときを選ぶ</li>");
				}
				if(node[EdgeType.No]) {
					$("#popupButtons").append("<li onclick='deleteEdge(\""+node.id+"\",\""+EdgeType.No+"\");'>Noの接続を解除</li>");
				}else {
					$("#popupButtons").append("<li onclick='addEdgeMode(\""+node.id+"\",\""+EdgeType.No+"\");'>Noのときを選ぶ</li>");
				}
				
				$("#popupButtons").append("<li onclick='deleteNode(\""+node.id+"\");'>削除</li>");		
			} else if(node.type == ObjectKind.EntryPoint) {
				if(node[EdgeType.Entry]) {
					$("#popupButtons").append("<li onclick='deleteEdge(\""+node.id+"\",\""+EdgeType.Entry+"\");'>接続を解除</li>");
				}else {
					$("#popupButtons").append("<li onclick='addEdgeMode(\""+node.id+"\",\""+EdgeType.Entry+"\");'>接続</li>");
				}
			} else if(node.type == ObjectKind.Target) {
				$("#popupButtons").append("<li onclick='deleteNode(\""+node.id+"\");'>削除</li>");		
			}
			$("#popupTitle").text(node.type);
			$("#popupText").text(node.label);
			$("#popup").css("top",param.pointer.DOM.y - 270).css("left",param.pointer.DOM.x - 276 / 2).css("display","block");
			$("#popupBackGround").css("display","block");
		}
	});
});