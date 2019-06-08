"use strict";

var nodes, edges, network, addEdgeTmp, projectId, selectedSidePanelTab = 0;

let ObjectKind = {
	Target: "TARGET",
	Condition: "CONDITION",
	EntryPoint: "ENTRY POINT"
}

let startTime = new Date();

let EdgeType = {
	Yes: "YES",
	No: "NO",
	Entry: "ENTRY"
}

let conditions = [
	{id:0,text:"1組の平行な辺があるか"},
	{id:1,text: "頂点は三つか"},
	{id:2,text:"3辺の長さは等しいか"},
	{id:3,text:"2辺の長さが等しいか"},
	{id:4,text:"4辺の長さが等しいか"},
	{id:5,text:"直角があるか"},
	{id:6,text:"2組の平行な辺があるか"}
];

let targets = [
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
			addToNodes(data,entryPointId,EdgeType.Entry);
		}
		$("#loading").hide();
	});
}

function addToNodes(node,parent,edgeType) {
	let newId = addObject(node.link,node.isCondition);
	let edgeToParentId = addToEdges(parent,newId,edgeType);
	nodes._data[parent].edgeIds.push(edgeToParentId);
	if(node.yes) nodes._data[newId][EdgeType.Yes] = addToNodes(node.yes,newId,EdgeType.Yes);
	if(node.no) nodes._data[newId][EdgeType.No] = addToNodes(node.no,newId,EdgeType.No);
	return edgeToParentId;
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
	nodes._data[to].edgeIds.push(edgeId);
	return edgeId;
}

function getSavedData() {
	let entryPointId = nodes.get().find(node=> node.type == ObjectKind.EntryPoint).id;
	let json = translateToServerData(entryPointId);
	return json;
}

function save(isValidate) {
	unValidated();
	let json = getSavedData();
	let stop = new Date();
	firebase.database().ref("projects/"+projectId).update({
		code:JSON.stringify(json),
		datetime: firebase.database.ServerValue.TIMESTAMP
	});
	firebase.database().ref("projects/"+projectId + "/yattoko/log").push({
		code:JSON.stringify(json),
		datetime: firebase.database.ServerValue.TIMESTAMP,
		time:  (stop.getTime() - startTime.getTime()) / 1000,
		isValidate: isValidate,
		hantei: hantei(getSavedData())

	});
	console.log("saved");
}

function translateToServerData(id) {
	let node = nodes._data[id];

	if(!node) {
		return null;
	}

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

function showLeftSideMenu(selected) {
	$("#leftSidePanelList").empty();
	selectedSidePanelTab = selected;
	var data;
	if(selectedSidePanelTab == 0)
	{
		$("#selectorContainer .selectorButton:first").addClass("selectorButton-selected");
		$("#selectorContainer .selectorButton:nth-child(2)").removeClass("selectorButton-selected");
		data = conditions;
	}
	else {
		$("#selectorContainer .selectorButton:nth-child(2)").addClass("selectorButton-selected");
		$("#selectorContainer .selectorButton:first").removeClass("selectorButton-selected");
		data = targets;
	}

	for (var item in data) {
		$("#leftSidePanelList").append('<li class="leftSidePanelListItem"  onclick="tapToolbox('+data[item].id+');">'+ (selectedSidePanelTab == 0 ? data[item].text : "<img class='targetItemImage' src='asset/"+ data[item].id +".png'>") +'</li>')
	}
}

function tapToolbox(item) {
	addObject(item,selectedSidePanelTab == 0);
	save(false);
}

function hantei(savedData) {
	function isUsingAllTargets(data) {
		function getChildTargetIds(data) {
			var result = [];
			if(data.isCondition) {
				if(data.yes) {
					result = result.concat(getChildTargetIds(data.yes));
				}
				if(data.no) {
					result = result.concat(getChildTargetIds(data.no));
				}
			}else {
				result = [data.link];
			}
			return result;
		}
		let usingTargets = getChildTargetIds(data).sort();
		var templateTargets = targets.map(n => n.id).sort();
		return JSON.stringify(usingTargets) == JSON.stringify(templateTargets);
	}
	function hasYesNo(data) {
		if(data.isCondition) {
			if(data.yes && data.no) {
				return hasYesNo(data.yes) && hasYesNo(data.no);
			} else {
				return false
			}
		}else {
			return true
		}
	}

	function noContradiction(data,parentConditionsListYes,parentConditionsListNo) {
		if(data.isCondition) {
			var result = true;
			if(data.yes && !noContradiction(data.yes,parentConditionsListYes.concat([data.link]),parentConditionsListNo)) result = false;
			if(data.no && !noContradiction(data.no, parentConditionsListYes, parentConditionsListNo.concat([data.link]))) result = false;
			return result;
		}else {
			var result = true
			for(var i in parentConditionsListYes) {
				if(!targets[data.link].condition[parentConditionsListYes[i]]) result = false;
			}
			for(var i in parentConditionsListNo) {
				if(targets[data.link].condition[parentConditionsListNo[i]]) result = false;
			}
			return result;
		}
	}
	
	var result = true;

	if(!isUsingAllTargets(savedData)) result = false;
	if(!hasYesNo(savedData)) result = false;
	if(!noContradiction(savedData,[],[])) result = false;

	return result;
}

function validate() {
	
	let result = hantei(getSavedData());
	save(true);

	$("#startButton").animate({"top":-$("#startButton").height(),"opacity":0},{duration: "normal",easing: "swing"});
	$("#validateButtonRope").animate({"top":-$("#startButton").height(),"opacity":0}, "normal","swing" ,function() {
		if(result) {
			$("#validateResult").attr("src","asset/succeeded.png");
		}
		else {
			$("#validateResult").attr("src","asset/failed.png");
		}
		$("#validateResult").css({"top":-$("#validateResult").height()});
		$("#validateResult").fadeIn("normal").animate({"top":70},{duration: "normal",easing: "swing"});
		$("#validateButtonRope").animate({"top":0,"opacity":100},{duration: "normal",easing: "swing"});
	});
	
}

function unValidated() {
	$("#startButton").css({"top":70,opacity:1});
	$("#validateResult").hide();
}

function addObject(item,isCondition){
	let id = (Math.random() * 1e7).toString(32)
	if(isCondition)
	{
		nodes.add({
		id: id,
		label:conditions[item].text,
		color: "#ED9A5D",
		type: ObjectKind.Condition,
		link: conditions[item].id,
		isCondition: true,
		edgeIds: []
		});
		return id;
	}else {
		nodes.add({
		id: id,
		shape: 'image',
		image: "asset/" + targets[item].id + ".png",
		color:"#4A90E2",
		type: ObjectKind.Target,
		link: targets[item].id,
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
	for(var i in toNode.edgeIds) {
		deleteEdgeByEdgeId(toNode.edgeIds[i]);
	}
	nodes.remove({id:node});
	save(false);
	closePopup();
}

function deleteEdgeByEdgeId(edgeId) {
	let edge = edges._data[edgeId];
	let fromNode = nodes._data[edge.from];
	let toNode = nodes._data[edge.to];
	
	if(fromNode) {
		fromNode.edgeIds = fromNode.edgeIds.filter(id => id != edgeId);
		fromNode[edge.type] = null;
	}
	if(toNode) {
		toNode.edgeIds = toNode.edgeIds.filter(id => id != edgeId);
	}
	edges.remove({id:edgeId});
}

function deleteEdge(nodeId,type) {
	deleteEdgeByEdgeId(nodes._data[nodeId][type]);
	save(false);
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
	save(false);
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
			$("#popupText").text( node.type == ObjectKind.Target ? "オブジェクト": node.label);
			$("#popup").css("top",param.pointer.DOM.y - 270).css("left",param.pointer.DOM.x - 276 / 2).css("display","block");
			$("#popupBackGround").css("display","block");
		}
	});

	$(window).on("beforeunload",function(e){
		let stop = new Date();
		let json = getSavedData();
		firebase.database().ref("projects/"+projectId + "/yattoko/sessions/").push({
			code:JSON.stringify(json),
			datetime: firebase.database.ServerValue.TIMESTAMP,
			hantei: hantei(getSavedData()),
			time: (stop.getTime() - startTime.getTime()) / 1000
		});
	});

});