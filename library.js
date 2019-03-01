/// ViewObject Prototype
class ViewObject {
	constructor(_x, _y, _height, _width) {
		this.x = _x;
		this.y = _y;
		this.height = _height;
		this.width = _width;
		this.isEliminatable = false;
	}
}
/// TreeInterface Prototype
class TreeInterface {
	constructor(_x, _y, _width, _height) {
		this.x = _x;
		this.y = _y;
		this.height = _height;
		this.width = _width;
	}
	static checkCover(interface1,interface2)
	{
		return Math.abs((interface1.x + interface1.width / 2)-(interface2.x + interface2.width / 2)) < interface1.width / 2 + interface2.width / 2 && Math.abs((interface1.y + interface1.height / 2)-(interface2.y + interface2.height / 2)) < interface1.height / 2 + interface2.height / 2
	}
}
///Connector Prototype
class Connector extends ViewObject{
	constructor(_parent, _parentInterface) {
		super(_parent.x + _parentInterface.x, _parent.y + _parentInterface.y, 36, 36);
		this.isDragging = false;
		this.gripPosition = {x:0,y:0};
		this.parentInterface = _parentInterface;
		this.parent = _parent;
	}
	show(){
		this.x = this.parent.x + this.parentInterface.x;
		this.y = this.parent.y + this.parentInterface.y;
		fill(200, 0, 0);
		ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width, this.height);
		if(this.outputInterface)
		{
			if(this.child)
			{
				this.outputInterface.x = this.child.inputInterface.x + this.child.x;
				this.outputInterface.y = this.child.inputInterface.y + this.child.y;
			}
			
			ellipse(this.outputInterface.x + this.outputInterface.width / 2, this.outputInterface.y + this.outputInterface.height / 2, this.outputInterface.width, this.outputInterface.height);
		}
		
	}
	startDrag(_x, _y) {
		let gripPosition = this.getGripPosition(_x, _y);
		this.gripPosition.x = gripPosition.x;
		this.gripPosition.y = gripPosition.y;
		this.isDragging = true;
	}
	dragging(_x, _y) {
		if (this.isDragging && this.outputInterface) {
			let absolutePosition = this.getAbsolutePosition(_x, _y);
			this.outputInterface.x = absolutePosition.x;
			this.outputInterface.y = absolutePosition.y;
		}
	}
	getAbsolutePosition(_x, _y) {
		return { x: _x - this.gripPosition.x, y: _y - this.gripPosition.y };
	}
	getGripPosition(_x, _y) {
		return { x: _x - this.x, y: _y - this.y };
	}
	isInside(_x, _y) {
		if(this.outputInterface)
		{
			return this.outputInterface.x <= _x && _x <= this.outputInterface.x + this.outputInterface.width && this.outputInterface.y <= _y && _y <= this.outputInterface.y + this.outputInterface.height;
		}
		else {
			return this.x<= _x && _x <= this.x + this.width && this.y <= _y && _y <= this.y + this.height;
		}
		
	}
	mousePressed(_x,_y){
		if(this.isInside(_x,_y))
		{
			if(this.outputInterface)
			{
				if(this.child)
				{
					this.child.parent = null;
					this.child = null;
				}
				this.startDrag(_x,_y);
			}
			else{
				this.outputInterface = new TreeInterface(_x,_y,this.width,this.height);
				this.startDrag(_x,_y);
			}
		}
	}
	mouseDragged(_x,_y){
		this.dragging(_x,_y);
	}
	mouseReleased(_x,_y)
	{
		if(this.outputInterface && !this.child)
		{
			this.outputInterface = null;
		}
		this.isDragging = false;
	}
}
/// TreePart Prototype
class TreePart extends ViewObject {
	constructor(_x, _y, _height, _width, _backgroundImage, _title, _titleTopMargin, _isEliminatable, _inputInterface, _outputInterface1, _outputInterface2) {
		super(_x, _y, _height, _width);
		this.isDragging = false;
		this.gripPosition = {x:0,y:0};
		this.titleTopMargin = _titleTopMargin;
		this.inputInterface = _inputInterface;
		this.isEliminatable = _isEliminatable;
		this.parent = null;
		this.backgroundImage = _backgroundImage;
		if (_outputInterface2 != null) {
			this.yes = _outputInterface1;
			this.no = _outputInterface2;
			this.children = {yes: null,no:null};
		}
		else {
			this.outputInterface = _outputInterface1;
			this.child = null;
		}
	}
	startDrag(_x, _y) {
		let gripPosition = this.getGripPosition(_x, _y);
		this.gripPosition.x = gripPosition.x;
		this.gripPosition.y = gripPosition.y;
		this.isDragging = true;
	}
	dragging(_x, _y) {
		if (this.isDragging) {
			let absolutePosition = this.getAbsolutePosition(_x, _y);
			this.x = absolutePosition.x;
			this.y = absolutePosition.y;
		}
	}
	getAbsoluteInterfacePosition(targetInterface) {
		return new TreeInterface(targetInterface.x + this.x, this.y + targetInterface.y, targetInterface.width, targetInterface.height);
	}
	getAbsolutePosition(_x, _y) {
		return { x: _x - this.gripPosition.x, y: _y - this.gripPosition.y };
	}
	getGripPosition(_x, _y) {
		return { x: _x - this.x, y: _y - this.y };
	}
	isInside(_x, _y) {
		return this.x <= _x && _x <= this.x + this.width && this.y <= _y && _y <= this.y + this.height;
	}
	show() {
		if(this.child)
		{
			this.child.x = this.x + this.outputInterface.x - this.child.inputInterface.x;
			this.child.y = this.y + this.outputInterface.y - this.child.inputInterface.y;
		}
		image(this.backgroundImage,this.x,this.y,this.width,this.height);
	}
	mousePressed(_x,_y){
		if(this.isInside(_x,_y))
		{
			this.startDrag(_x,_y);
		}
	}
	mouseDragged(_x,_y){
		this.dragging(_x,_y);
	}
	mouseReleased(_x,_y){
		this.isDragging = false;
	}
}
class EntryPoint extends TreePart {
	constructor(_x, _y, _backgroundImage) {
		super(_x, _y, 63.5, 277, _backgroundImage, "エントリポイント", -15, false, null, new TreeInterface(122.5, 24.5, 36, 21), null);
	}
}
class Condition extends TreePart {
	constructor(_x, _y, _backgroundImage, _title, _conditionId) {
		super(_x, _y, 81, 277, _backgroundImage, _title, 15, true, new TreeInterface(122.5, -18, 36, 36), new TreeInterface(58, 63, 36, 36), new TreeInterface(183, 63, 36, 36));
		this.conditionId = _conditionId;
	}
}
class Result extends TreePart {
	constructor(_x, _y, _backgroundImage, _resultId) {
		super(_x, _y, 96, 92.5, _backgroundImage, null, null, true, new TreeInterface(30.5, -18, 36, 36), null, null);
		this.resultId = _resultId;
	}
}

class MagneticManager{
	static checkCover(data,_handler)
	{
		for (var part of data) {
			if(part.isDragging){
				if(part.inputInterface)
				{
					for(var part2 of data)
					{
						if(part2.child == null && part2.outputInterface && MagneticManager.isOverlap(part.getAbsoluteInterfacePosition(part.inputInterface),part2.getAbsoluteInterfacePosition(part2.outputInterface)))
						{
							MagneticManager.connect(part2,part);
						}
					}
				}
				if(part.outputInterface && Connector.prototype.isPrototypeOf(part))
				{
					for (var part2 of data)
					{
						if (part2.parent == null && !TreeInterface.prototype.isPrototypeOf(part2) && part2.inputInterface && MagneticManager.isOverlap(part2.getAbsoluteInterfacePosition(part2.inputInterface),part.outputInterface))
						{
							MagneticManager.connect(part,part2);
						}
					}
				}
			}
		}
		_handler();
	}
	static isOverlap(interface1,interface2)
	{
		return Math.abs((interface1.x + interface1.width / 2)-(interface2.x + interface2.width / 2)) < interface1.width / 2 + interface2.width / 2 && Math.abs((interface1.y + interface1.height / 2)-(interface2.y + interface2.height / 2)) < interface1.height / 2 + interface2.height / 2
	}
	static connect(parent,child)
	{
		parent.child = child;
		child.parent = parent;
	}
}
//Data Model
class TemplateData {
	constructor(_jsonData) {
		this.data = _jsonData;
	}
	getResultTitleForId(_id) {
		return this.data.results[_id].title;
	}
	getConditionTitleForId(_id) {
		return this.data.condition[_id].title;
	}
	isCorrect(_resultId, _conditionId) {
		return this.data.answerTable[_resultId][_conditionId];
	}
}
class ImageManager {
	constructor(_folderPath) {
		this.folderPath = _folderPath;
		this.images = {};
	}
	getResultImageForId(_id) {
		if (this.images["result" + _id] == null) {
			this.images["result" + _id] = loadImage(this.folderPath + "/resultbg" + _id + ".png");
		}
		return this.images["result" + _id];
	}
	getImageForName(_name) {
		if (this.images[_name] == null) {
			this.images[_name] = loadImage(this.folderPath + "/" + _name);
		}
		return this.images[_name];
	}
}
