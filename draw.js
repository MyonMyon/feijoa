var infoVersion = "v1.6.5";
var infoDate = "May 4, 2013"

var sketcher, canvas, context, sendForm,
	buttonsBarDiv, toolsSpan, debugDiv,
	paletteElem, cElem; //main elements

var sliders = [];

var x = -5, y = -5,
	pX = -5, pY = -5,
	globalOffset = 0.5, //pixel offset
	globalOffs_1 = globalOffset - 0.01;

var activeDrawing = false;

/*==============================================================================
                                    History
==============================================================================*/

function History(storage) {
	this.storage = storage;
	this.array = new Array(this.storage);
	this.position = 0;
	this.positionMax = 0;
	this.lastAutoSave = new Date().getTime(),
	this.enableAutoSave = true;
}

History.prototype.refresh = function() {
	if (this.position < this.storage - 1) {
		this.position ++;
		this.positionMax = this.position;
	}
	else
		for(i = 0; i < this.storage - 1; i ++)
			this.array[i] = this.array[i + 1];
	this.array[this.position] = context.getImageData(0, 0, canvasWidth, canvasHeight);
	if (this.enableAutoSave) {
		var dt = new Date().getTime();
		if (dt - this.lastAutoSave > 60000) {
			history.backupPic(true);
			this.lastAutoSave = dt;
		}
	}
	updateDebugScreen();
	updateButtons();
};

History.prototype.backward = function() {
	if (this.position > 0) {
		this.position --;
	}
	context.putImageData(this.array[this.position], 0, 0);
	updateDebugScreen();
	updateButtons();
};

History.prototype.forward = function() {
	if (this.position < this.storage - 1 && this.position < this.positionMax) {
		this.position ++;
	}
	context.putImageData(this.array[this.position], 0, 0);
	updateDebugScreen();
	updateButtons();
};

History.prototype.backupPic = function(auto) {
	auto = auto || false
	if (auto || confirm("Вы уверены, что хотите сохранить данные в Local Storage?")) {
		var jpgData = canvas.toDataURL("image/jpeg");
		var pngData = canvas.toDataURL();
		if(!!window.localStorage)
			window.localStorage.recovery = (jpgData.length < pngData.length ? jpgData : pngData);
		else if (!auto)
			alert("Local Storage не поддерживается.");
	}
};

History.prototype.loadPic = function(auto) {
	auto = auto || false
	var image = new Image();
	if(!!window.localStorage)
		image.src = window.localStorage.recovery;
	else if (!auto)
		alert("Local Storage не поддерживается.");
	context.drawImage(image, 0, 0);
	history.refresh();
};

var history = new History(32);

var canvasWidth = 600,
	canvasHeight = 360;

var tools = [
	{"opacity" : 1.00, "width" :  4, "shadow" : 0, "turnLimit" : 360, "color" : "0, 0, 0"      } //Fore
,	{"opacity" : 1.00, "width" : 20, "shadow" : 0, "turnLimit" : 360, "color" : "255, 255, 255"} //Back
,	{"opacity" : 1.00, "width" : 20, "shadow" : 0, "turnLimit" : 360, "color" : "255, 255, 255"} //Eraser
], tool = tools[0];

var toolLimits = {"opacity": [0.05, 1, 0.05], "width": [1, 128, 1], "shadow": [0, 20, 1], "turnLimit": [0, 180, 1]};

var debugMode = false,
	fps = 0,
	ticks = 0;

var flushCursor = false,
	neverFlushCursor = true;
var lowQMode = false,
	precisePreview = false,
	antiAliasing = true;
	smoothMode = false;

var paletteDesc = {"combo" : "Комбинированная", "safe" : "Web 216", "feijoa" : "Feijoa", "touhou" : "Тошки", "history" : "История"};
var palette = new Array(); //"@b" breaks the line, "@r" gives name to a new row
	palette["combo"] = [
		        "@r", "Классическая", "#000000", "#000080", "#008000", "#008080", "#800000", "#800080", "#808000", "#c0c0c0"
		, "@b", "@r", "", "#808080", "#0000ff", "#00ff00", "#00ffff", "#ff0000", "#ff00ff", "#ffff00", "#ffffff"

		, "@b", "@r", "CGA", "#000", "#00a", "#0a0", "#0aa", "#a00", "#a0a", "#aa0", "#aaa"
		, "@b", "@r", "", "#555", "#55f", "#5f5", "#5ff", "#f55", "#f5f", "#ff5", "#fff"

		, "@b", "@r", "ЧБ", "#fff", "#eee", "#ddd", "#ccc", "#bbb", "#aaa", "#999", "#888",
		, "@b", "@r", "", "#777", "#666", "#555", "#444", "#333", "#222", "#111", "#000"

		, "@b", "@r", "Windows 7", "#000000", "#7f7f7f", "#880015", "#ed1c24", "#ff7f27", "#fff200", "#22b14c", "#00a2e8", "#3f48cc", "#a349a4"
		, "@b", "@r", "", "#ffffff", "#c3c3c3", "#b97a57", "#ffaec9", "#ffc90e", "#efe4b0", "#b5e61d", "#99d9ea", "#7092be", "#c8bfe7"
		];
	palette["feijoa"] = [];
	generatePalette("feijoa", 85, 0);
	palette["safe"] = [];
	generatePalette("safe", 51, 6);
var sana = ["е", "э", "я", "ѣ"];
	palette["touhou"] = ["@c", "основной цвет", "вторичный цвет", "волосы", "глаза/аксессуары", "аксессуары"
	    , "@b", "@r", "Общее", "#fcefe2", "#000000"

		, "@b", "@r", "Рейму", "#fa5946", "#ffffff", "#000000", "#e5ff41"
		, "@b", "@r", "Мариса", "#000000", "#ffffff", "#fff87d", "#a864a8"

		, "@b", "@r", "Сырно", "#1760f3", "#ffffff", "#97ddfd", "#fd3727", "#00d4ae"
		, "@b", "@r", "Китай", "#a39942", "#ffffff", "#f37e75", "#82a6b6", "#4a4b4d"
		, "@b", "@r", "Пачули", "#ffffff", "#af69B9", "#7f4787", "#f36470", "#fdff7b", "#807ffe"
		, "@b", "@r", "Сакуя", "#ffffff", "#59428b", "#bcbccc", "#fe3030", "#00c2c6", "#585456"
		, "@b", "@r", "Ремилия", "#ffffff", "#cf052f", "#cbc9fd", "#f22c42", "#f2dcc6", "#464646"
		, "@b", "@r", "Фланя", "#ffffff", "#f52525", "#fff869", "#211930", "#56292c", "#6adc62", "#60d2d2", "#2f4dd6"

		, "@b", "@r", "Алиса", "#ffffff", "#8787f7", "#fafab0", "#fabad2", "#888888"
		, "@b", "@r", "Ёму", "#2c8e7d", "#382d3a", "#ffffff", "#004457"
		, "@b", "@r", "Ююко", "#9eb2dc", "#ffffff", "#fba7b8", "#10009a", "#f60000"
		, "@b", "@r", "Чен", "#fa5946", "#ffffff", "#6b473b", "#339886", "#464646", "#ffdb4f"
		, "@b", "@r", "Ран", "#393c90", "#ffffff", "#ffff6e", "#c096c0"
		, "@b", "@r", "Юкари", "#c096c0", "#ffffff", "#ffff6e", "#fa0000", "#464646"

		, "@b", "@r", "Суйка", "#ffffff", "#6421a5", "#f3c183", "#90403d", "#eb3740", "#d9c39a"

		, "@b", "@r", "Рейсен", "#000000", "#ffffff", "#dcc3ff", "#2e228c", "#e94b6d"
		, "@b", "@r", "Эйрин", "#e12710", "#4c336a", "#ffffff"
		, "@b", "@r", "Кагуя", "#fcabba", "#ed453c", "#2d2926", "#ffffff"
		, "@b", "@r", "Моко", "#ffffff", "#da003a"

		, "@b", "@r", "Ая", "#ffffff", "#f33f45", "#1b1b1b"
		, "@b", "@r", "Юка", "#ec2c29", "#ffffff", "#64ad53", "#fff05f", "#ffe3e2"
		, "@b", "@r", "Комачи", "#ffffff", "#257ed4", "#ed145b", "#4f352e", "#e7962d"
		, "@b", "@r", "Шикиеки", "#ffffff", "#3a2430", "#26655a", "#432e71", "#a32139", "#ffe059"

		, "@b", "@r", "Нитори", "#257dd3", "#0cb473", "#7ec8f9", "#312f83", "#ffffff", "#f1f62e", "#ad2032"
		, "@b", "@r", "Сана" + sana[Math.floor(Math.random() * sana.length)], "#16168a", "#ffffff", "#13f356", "#9476f5", "#31cacc", "#e7962d"
		, "@b", "@r", "Канако", "#fa5041", "#43334d", "#7360dd", "#ffffff", "#cda277"
		, "@b", "@r", "Сувако", "#623fbd", "#ffffff", "#f6f3ac", "#bcb67a", "#ea0001", "#fbe4a1", "#000000"

		, "@b", "@r", "Ику", "#000000", "#ffffff", "#5940c0", "#ee0501"
		, "@b", "@r", "Тенши", "#ffffff", "#6dcef6", "#0073c1", "#f90b0b", "#405231", "#000000", "#f5d498", "#7cc074"

		];

	palette["history"] = (!!window.localStorage && !!window.localStorage.historyPalette) ? JSON.parse(window.localStorage.historyPalette) : [];

var currentPalette = (!!window.localStorage && !!window.localStorage.lastPalette) ? window.localStorage.lastPalette : "classic";

var hki = 0; //Hotkey interval for Opera
var hkPressed = false;

//KEY MODIFIERS
var CTRL  = 0x0100,
	SHIFT = 0x0200,
	ALT   = 0x0400,
	META  = 0x0800,
	ENTER = 13,
	F1 = 112, F2 = 113, F3 = 114, F4 = 115,  F5 = 116,  F6 = 117,
	F7 = 118, F8 = 119, F9 = 120, F10 = 121, F11 = 122, F12 = 123;

var kbLayout = { 
	  "history-undo" :				"Z".charCodeAt(0)
	, "history-redo" :				"X".charCodeAt(0)
	, "history-store" :				F8
	, "history-extract" :			F9

	, "canva-fill" :				"F".charCodeAt(0)
	, "canva-delete" :				"B".charCodeAt(0)		// FBI lol
	, "canva-invert" :				"I".charCodeAt(0)
	, "canva-jpeg" :				CTRL + "J".charCodeAt(0)
	, "canva-png" :					CTRL + "P".charCodeAt(0)
	, "canva-send" :				CTRL + ENTER

	, "tool-antialiasing" :			"O".charCodeAt(0)
	, "tool-smooth" :				"K".charCodeAt(0)
	, "tool-lowquality" :			"L".charCodeAt(0)
	, "tool-preview" :				"P".charCodeAt(0)
	, "tool-colorpick" :			"C".charCodeAt(0)
	, "tool-swap" :					"S".charCodeAt(0)
	, "tool-eraser" :				"E".charCodeAt(0)
	, "tool-width-" :				"Q".charCodeAt(0)
	, "tool-width+" :				"W".charCodeAt(0)
	, "tool-opacity-" :				CTRL + "Q".charCodeAt(0)
	, "tool-opacity+" :				CTRL + "W".charCodeAt(0)
	, "tool-shadow-" :				SHIFT + "Q".charCodeAt(0)
	, "tool-shadow+" :				SHIFT + "W".charCodeAt(0)
	, "tool-turn-" :				CTRL + SHIFT + "Q".charCodeAt(0)
	, "tool-turn+" :				CTRL + SHIFT + "W".charCodeAt(0)

	, "app-help" :					F1

	, "debug-mode" :				12 //SEECRET KEY !
};

	kbLayout = (!!window.localStorage && !!window.localStorage.layout) ? JSON.parse(window.localStorage.layout) : kbLayout;

for (i = 1; i <= 10; i ++) {
	kbLayout["tool-opacity." + i] = (i == 10 ? 0 : i) + 48 + CTRL; 
	kbLayout["tool-width." + i] = (i == 10 ? 0 : i) + 48; 
}

var actLayout = { 
	  "history-undo" :				{"Operation" :	"history.backward()",	"Title" : "&#x2190;",	"Description" : "Назад"}
	, "history-redo" :				{"Operation" :	"history.forward()",	"Title" : "&#x2192;",	"Description" : "Вперёд"}
	, "history-store" :				{"Operation" :	"history.backupPic()",	"Title" : "&#x22C1;",	"Description" : "Сделать back-up",	"Once" : true}
	, "history-extract" :			{"Operation" :	"history.loadPic()",	"Title" : "&#x22C0;",	"Description" : "Извлечь back-up",	"Once" : true}

	, "canva-fill" :				{"Operation" :	"clearScreen(0)",		"Title" : "F",			"Description" : "Закрасить полотно основным цветом",	"Once" : true}
	, "canva-delete" :				{"Operation" :	"clearScreen(1)",		"Title" : "B",			"Description" : "Закрасить полотно фоновым цветом",		"Once" : true}
	, "canva-invert" :				{"Operation" :	"invertColors()",		"Title" : "&#x25D0;",	"Description" : "Инверсия полотна",		"Once" : true}
	, "canva-jpeg" :				{"Operation" :	"savePic(false)",		"Title" : "J",			"Description" : "Сохранить в JPEG",		"Once" : true}
	, "canva-png" :					{"Operation" :	"savePic(true)",		"Title" : "P",			"Description" : "Сохранить в PNG",		"Once" : true}
	, "canva-send" :				{"Operation" :	"sendPic()",			"Title" : "&#x21B5;",	"Description" : "Отправить на сервер",	"Once" : true}

	, "tool-antialiasing" :			{"Operation" :	"switchMode(2)",		"Title" : "AA",			"Description" : "Anti-Aliasing",			"Once" : true}
	, "tool-preview" :				{"Operation" :	"switchMode(1)",		"Title" : "&#x25CF;",	"Description" : "Предпросмотр кисти",		"Once" : true}
	, "tool-lowquality" :			{"Operation" :	"switchMode(0)",		"Title" : "&#x25A0;",	"Description" : "Режим низкого качества",	"Once" : true}
	, "tool-smooth" :				{"Operation" :	"switchMode(3)",		"Title" : "Ω",			"Description" : "Режим сглаживания линии",	"Once" : true}
	, "tool-colorpick" :			{"Operation" :	"cCopyColor()"}
	, "tool-swap" :					{"Operation" :	"swapTools(0)",			"Title" : "&#x2194;",	"Description" : "Поменять инструменты местами",					"Once" : true}
	, "tool-eraser" :				{"Operation" :	"swapTools(1)",			"Title" : "&#x25A1;",	"Description" : "Заменить инструмент на стандартный ластик",	"Once" : true}
	, "tool-width-" :				{"Operation" :	"toolModify(0, 1, -1)"}
	, "tool-width+" :				{"Operation" :	"toolModify(0, 1, +1)"}
	, "tool-opacity-" :				{"Operation" :	"toolModify(0, 0, -0.05)"}
	, "tool-opacity+" :				{"Operation" :	"toolModify(0, 0, +0.05)"}
	, "tool-shadow-" :				{"Operation" :	"toolModify(0, 2, -1)"}
	, "tool-shadow+" :				{"Operation" :	"toolModify(0, 2, +1)"}
	, "tool-turn-" :				{"Operation" :	"toolModify(0, 3, -1)"}
	, "tool-turn+" :				{"Operation" :	"toolModify(0, 3, +1)"}

	, "tool-width" : 				{"Title" : "Толщина"}
	, "tool-opacity" : 				{"Title" : "Непрозрачность"}
	, "tool-shadow" : 				{"Title" : "Тень"}
	, "tool-color" : 				{"Title" : "Код цвета"}
	, "tool-palette" : 				{"Title" : "Палитра"}

	, "app-help" :					{"Operation" :	"showHelp()",			"Title" : "?",			"Description" : "Помощь",	"Once" : true}

	, "debug-mode" :				{"Operation" :	"switchMode(-1)"}
};

//List of buttons to display
var guiButtons = ["history-undo", "history-redo", "|", "canva-fill", "tool-swap", "canva-delete", "tool-eraser", "canva-invert", "|",
					"tool-antialiasing", "tool-preview", "tool-smooth", "tool-lowquality", "|",
					"history-store", "history-extract", "canva-jpeg", "canva-png", "canva-send", "|", "app-help"];

for (i = 1; i <= 10; i ++) {
	actLayout["tool-opacity." + i] = {"Operation" : "toolModify(0, 0, 0, " + (i / 10) + ")"}; 
	actLayout["tool-width." + i] = {"Operation" : "toolModify(0, 1, 0, " + Math.ceil(Math.pow(1.7, i-1)) + ")"}; 
}

var kbDesc = {
	  8 : "Backspace"
	, 9 : "Tab"
	, 12 : "Secret Key"
	, 13 : "Enter"
	, 45 : "Insert"
	, 46 : "Delete"
	, 186 : ";"
	, 187 : "Plus"
	, 189 : "Minus"
	, 190 : "."
	, 222 : "'"
}

for (i = 1; i <= 15; i ++) {
	kbDesc[111 + i] = "F" + i;
}

document.addEventListener("DOMContentLoaded", init, false);

function init()
{
	sketcher = document.getElementById("sketcher");

	sendForm = document.createElement("form");
	sendForm.method = "post";
	sendForm.action = "";
	sketcher.appendChild(sendForm);

	canvas = document.createElement("canvas");	
	sketcher.appendChild(canvas);

	canvas.addEventListener("mousedown", cDrawStart, false);
	canvas.addEventListener("mousemove", cDraw, false);
	document.addEventListener("mouseup", cDrawEnd, false);
	canvas.addEventListener("mouseout", cDraw, false);
	canvas.addEventListener("mouseover", cDrawRestore, false);
	document.addEventListener("mousemove", updatePosition, false);
	document.addEventListener("keydown", cHotkeysStart, false);
	document.addEventListener("keyup", cHotkeysEnd, false);

	canvas.setAttribute("oncontextmenu", "return false;");
	canvas.setAttribute("onscroll", "return false;");

	canvas.addEventListener("wheel", cLWChange, false);
	canvas.width = canvasWidth;
	canvas.height = canvasHeight;

	context = canvas.getContext("2d");

	context.fillStyle = "white";
	context.fillRect(0, 0, canvasWidth, canvasHeight);
	history.array[0] = context.getImageData(0, 0, canvasWidth, canvasHeight);

	toolsSpan = document.createElement("span");
	toolsSpan.id = "tools";
	sketcher.appendChild(toolsSpan);

	var e = document.createElement("input"),
		a = ["shadow", "opacity", "width"], 
		i = a.length;
	while (i--) { 
		var et;
		var uLetter = a[i];
		if ((e.type = "range") == e.type) {
			et = document.createElement("input");
			et.id = "tool-" + a[i];
			et.type = "range";
			et.value = eval("tool." + uLetter);
			et.min = toolLimits[uLetter][0];
			et.max = toolLimits[uLetter][1];
			et.step = toolLimits[uLetter][2];
			et.setAttribute("onchange", "updateSliders(1);");
			toolsSpan.appendChild(et);
			sliders[et.id] = et;
		}
		et = document.createElement("input");
		et.id = "tool-" + a[i] + "-text";
		et.value = eval("tool." + uLetter);
		et.type = "text";
		et.setAttribute("onchange", "updateSliders(2);");
		toolsSpan.appendChild(et);
		sliders[et.id] = et;

		et = document.createElement("span");
		et.innerHTML = " " + actLayout["tool-" + a[i]].Title;
		toolsSpan.appendChild(et);

		toolsSpan.appendChild(document.createElement("br"));
	};

	e = document.createElement("span");
	e.innerHTML = actLayout["tool-palette"].Title + ": ";
	toolsSpan.appendChild(e);

	paletteSelect = document.createElement("select");
	paletteSelect.id = "palette-select";
	paletteSelect.setAttribute("onchange", "updatePalette();");
	toolsSpan.appendChild(paletteSelect);

	paletteElem = document.createElement("div");
	paletteElem.id = "palette";
	toolsSpan.appendChild(paletteElem);

	for (tPalette in paletteDesc) {
		paletteSelect.options[paletteSelect.options.length] = new Option(paletteDesc[tPalette], tPalette);
		if (tPalette == currentPalette)
			paletteSelect.options[paletteSelect.options.length - 1].selected = true;
	}

	e = document.createElement("span");
	e.innerHTML = actLayout["tool-color"].Title + ": ";
	toolsSpan.appendChild(e);

	cElem = document.createElement("input");
	cElem.type = "color";
	cElem.id = "color"
	cElem.setAttribute("onchange", "updateColor()");
	toolsSpan.appendChild(cElem);

	buttonsBarDiv = document.createElement("div");	
	sketcher.appendChild(buttonsBarDiv);

	for(i in guiButtons) {
		var tElem = document.createElement("span");	
		if(guiButtons[i] != "|") {
			tElem.id = guiButtons[i];
			tElem.className = (guiButtons[i] =="tool-antialiasing" && antiAliasing) ? "button-active" : "button";
			tElem.innerHTML = actLayout[guiButtons[i]].Title;
			tElem.setAttribute("onclick", actLayout[guiButtons[i]].Operation);
			buttonsBarDiv.appendChild(tElem);	
			setElemDesc(guiButtons[i]);
		} else {
			tElem.className = "vertical";	
			tElem.innerHTML = "&nbsp;";
			buttonsBarDiv.appendChild(tElem);	
		}
	}

	for (i in tools)
		updateColor(tools[i].color, i);

	debugDiv = document.createElement("div");	
	sketcher.appendChild(debugDiv);

	updateDebugScreen();
	updatePalette();
	updateButtons();
	updateSliders();
}

function setElemDesc(elem, desc) {
	desc = desc || actLayout[elem].Description;
	var k = kbLayout[elem];
	document.getElementById(elem).title = desc + (elem ?  (" (" + 
		descKeyCode(k) + ")") : "");
}

function generatePalette(name, step, slice) { //safe palette constructor, step recomended to be: 1, 3, 5, 15, 17, 51, 85, 255
	var letters = [0, 0, 0];
	while (letters[0]<=255 ) {
		var l = palette[name].length;
		palette[name][l] = "#";
		for (var i = 0; i < 3; i++)	{
			var s = letters[i].toString(16);
			if (s.length == 1)
				s = "0" + s;
			palette[name][l] += s;
		}
		letters[2] += step;
		if (letters[2] > 255) {
			letters[2] = 0;
			letters[1] += step;
		}
		if (letters[1] > 255) {
			letters[1] = 0;
			letters[0] += step;
		}
		if (((letters[1] == step * slice) || letters[1] == 0) && letters[2] == 0)
			palette[name][l+1] = "@b";
	}
}

function updatePalette() {
	currentPalette = paletteSelect.value;
	if(!!window.localStorage) //ie-ie
		window.localStorage.lastPalette = currentPalette;

	while (paletteElem.childNodes.length) {
		paletteElem.removeChild(paletteElem.childNodes[0])
	}

	var colCount = 0,
		rowCount = 0;
	var colDesc = new Array();

	var paletteTable = document.createElement("table");
	paletteElem.appendChild(paletteTable);
	var paletteRow = document.createElement("tr");
	var colorDesc = "";

	for (tColor in palette[currentPalette]) {
		var c = palette[currentPalette][tColor];
		var paletteCell;
		if (c == "@r") {
			paletteCell = document.createElement("td");
			paletteCell.innerHTML = palette[currentPalette][parseInt(tColor) + 1] + "&nbsp;";
			paletteRow.appendChild(paletteCell);
			colCount = -2;
			if(palette[currentPalette][parseInt(tColor) + 1] != "")
				colorDesc = palette[currentPalette][parseInt(tColor) + 1];
		}
		if (c == "@c") {
			rowCount = -1;
			colCount = -1;
		}
		if (c == "@b") {
			paletteTable.appendChild(paletteRow);
			paletteRow = document.createElement("tr");
			colCount = -1;
			rowCount ++;
		}
		if (currentPalette == "history" && colCount == 16) {
			paletteTable.appendChild(paletteRow);
			paletteRow = document.createElement("tr");
			colCount = 0;
		}
		if (rowCount == -1) {
			if(colCount >= 0) {
				colDesc[colCount] = c;
			}
		}
		if (colCount >= 0 && rowCount >= 0) {
			paletteCell = document.createElement("td");
			var palettine = document.createElement("div");
			palettine.className = "palettine";
			palettine.title = palette[currentPalette][parseInt(tColor)] + (colorDesc != "" ? (" (" + colorDesc + (colDesc[colCount] ? (", " + colDesc[colCount]) : "" ) + ")") : "");
			palettine.style.background = c;
			palettine.setAttribute("onclick", "updateColor('" + c + "',0);");
			palettine.setAttribute("oncontextmenu", "updateColor('" + c + "',1); return false;");
			paletteCell.appendChild(palettine);
			paletteRow.appendChild(paletteCell);
		}
		colCount ++;
	}
	paletteTable.appendChild(paletteRow);
}

function updatePosition(event) {
	x = event.pageX;
	y = event.pageY;
	x -= canvas.offsetLeft;
	y -= canvas.offsetTop;
}

function drawCursor () {
	if (x >= 0 && x < canvasWidth && y >= 0 && y < canvasHeight) {
		context.beginPath();
		context.lineWidth = 1;
		if (precisePreview) {
			context.fillStyle = "rgba(" + tool.color + ", " + tool.opacity + ")";
			context.shadowBlur = tool.shadow;
			context.shadowColor = "rgb(" + tool.color + ")";
		}
		else {
			context.strokeStyle = "rgb(" + tool.color + ")";
			context.shadowBlur = 0;
		}
		context.arc(x, y, tool.width / 2, 0, Math.PI*2, false);
		context.closePath();
		precisePreview ? context.fill() : context.stroke();
		if (!neverFlushCursor)
			flushCursor = true;
	}
}

function cDraw(event) {

	updatePosition(event);

	updateDebugScreen();

	if ((flushCursor || neverFlushCursor) && !(lowQMode && activeDrawing)) {
		context.putImageData(history.array[history.position], 0, 0);
	}

	if (activeDrawing) {
		var tX = pX, tY = pY;
		pX = smoothMode ? parseInt(x * 0.08 + pX * 0.92) : x;
		pY = smoothMode ? parseInt(y * 0.08 + pY * 0.92) : y;
		if(!antiAliasing) { //This probably would require massive optimization. Blame W3C.
			while(1) {
				for (i = 0; i < tool.width; i++) {
					var rC = Math.sqrt(1 - Math.pow(-1 + (i + 0.5) / tool.width * 2, 2));
					context.moveTo(parseInt(tX - tool.width * rC / 2) + globalOffs_1, tY + globalOffset - parseInt(tool.width / 2) + i);
					context.lineTo(parseInt(tX + tool.width * rC / 2) - globalOffset, tY + globalOffset - parseInt(tool.width / 2) + i);
				}
				tX = parseInt((pX + tX) / 2);
				tY = parseInt((pY + tY) / 2);
				//if(tX == pX && tY == pY) //Uncomment this and your system will suddenly crash.
					break;
			}
		}
		else
			context.lineTo(pX + globalOffset, pY + globalOffset);
		context.stroke();
	} else
		if (neverFlushCursor && !lowQMode)
			drawCursor();
}

function cDrawStart(event) {
	pX = x;
	pY = y;

	updatePosition(event);
	//canvas.focus();
	event.preventDefault();
	event.returnValue = false;
	if (event.which == 2) {
		cCopyColor();
	} else
	if (event.which == 1 || event.which == 3) {
		event.stopPropagation();
		event.cancelBubble = true;

		var t = tools[(event.which == 1) ? 0 : 1];
		context.putImageData(history.array[history.position], 0, 0);
		activeDrawing = true;
		context.lineWidth = antiAliasing ? t.width : 1;
		context.shadowBlur = t.shadow;
		context.strokeStyle = "rgba(" + t.color + ", " + t.opacity + ")";
		context.shadowColor = "rgb(" + t.color + ")";
		context.lineJoin = "round";
		context.lineCap = "round";
		context.beginPath();
		if(antiAliasing) {
			context.moveTo(x + globalOffset, y + globalOffset);
			context.lineTo(x + globalOffs_1, y + globalOffs_1);
			context.stroke();
		}
		else
			cDraw(event);
		vX = x;
		vY = y;
	}
	return false;
}

function cDrawEnd(event) {
	//Saving in history:
	if (activeDrawing) {
		context.putImageData(history.array[history.position], 0, 0);
		context.stroke();
		context.closePath();
		history.refresh();
	}
	activeDrawing=false;
	updateDebugScreen();
}

function cDrawRestore(event) {
	if (activeDrawing)
		context.moveTo(x + globalOffset, y + globalOffset);
	updatePosition(event);
	pX = x;
	pY = y;
}

function cDrawCancel() {
	if (activeDrawing) {
		history.backward();
		history.forward();
	}
	activeDrawing=false;
	updateDebugScreen();
}

function cCopyColor() {
	var rgba = history.array[history.position].data, i = (x+y*canvasWidth)*4;
	var hex = (rgba[i] * 65536 + rgba[i+1] * 256 + rgba[i+2]).toString(16);
	while (hex.length < 6) {
		hex = "0" + hex;
	}
	updateColor("#" + hex);
}

function cLWChange(event) {
	var delta = event.deltaY || event.detail || event.wheelDelta;
	event.preventDefault();	
	event.returnValue = false;
	if (delta > 0) {
		if (event.ctrlKey)
			tool.opacity = (parseFloat(tool.opacity) - 0.05).toFixed(2);
		else if (event.shiftKey)
			tool.shadow --;
		else
			tool.width --;
	}
	if (delta < 0) {
		if (event.ctrlKey)
			tool.opacity = (parseFloat(tool.opacity) + 0.05).toFixed(2);
		else if (event.shiftKey)
			tool.shadow ++;
		else
			tool.width ++;
	}

	updateDebugScreen();
	updateSliders();
}

function updateDebugScreen() {
	if (debugMode) {
		debugDiv.innerHTML = "Cursor @" + x + ":" + y + "<br />Diff: " + (x - pX) + ":" + (y - pY) + "<br />FPS: " + fps;
		ticks ++;
	}
}

function clearScreen(toolIndex) {
	context.fillStyle = "rgb(" + tools[toolIndex].color + ")";
	context.fillRect(0, 0, canvasWidth, canvasHeight);
	history.refresh();
}

function invertColors() {
	var buffer = history.array[history.position];
	for (var i = 0; i < buffer.data.length; i += 4)
		for (var j = 0; j < 3; j++)
			buffer.data[i + j] = 255 - buffer.data[i + j];
	context.putImageData(buffer, 0, 0);
	history.refresh();
}

function updateSliders(initiator) {
	var m = initiator || 0;

	if (m > 0) {
		var s = (m == 2 ? "-text" : "");
		tool.shadow	= document.getElementById("tool-shadow" + s).value;
		tool.width	= document.getElementById("tool-width" + s).value;
		tool.opacity	= document.getElementById("tool-opacity" + s).value;
		//tool.turnLimit	= document.getElementById("tool-turnlimit" + s).value;
	}

	if (tool.opacity <= toolLimits.opacity[0]) tool.opacity = toolLimits.opacity[0].toFixed(2); else
	if (tool.opacity >= toolLimits.opacity[1]) tool.opacity = toolLimits.opacity[1].toFixed(2);

	if (tool.width <= toolLimits.width[0]) tool.width = toolLimits.width[0]; else
	if (tool.width >= toolLimits.width[1]) tool.width = toolLimits.width[1];

	if (tool.shadow <= toolLimits.shadow[0]) tool.shadow = toolLimits.shadow[0]; else
	if (tool.shadow >= toolLimits.shadow[1]) tool.shadow = toolLimits.shadow[1];

	if (tool.turnLimit <=   0) tool.turnLimit = 0; else
	if (tool.turnLimit >= 360) tool.turnLimit = 360;

	document.getElementById("tool-shadow-text").value = tool.shadow;
	document.getElementById("tool-width-text").value = tool.width;
	document.getElementById("tool-opacity-text").value = tool.opacity;
	//document.getElementById("rangeT").value = tool.turnLimit;

	if (document.getElementById("tool-width")) {
		document.getElementById("tool-shadow").value = tool.shadow;
		document.getElementById("tool-width").value = tool.width;
		document.getElementById("tool-opacity").value = tool.opacity;
		//document.getElementById("rangeTS").value = tool.turnLimit;
	}

	cDrawEnd();
	var w = Math.max(tool.width, tools[1].width) + Math.max(tool.shadow, tools[1].shadow) * 2.5 + 7;
	context.putImageData(history.array[history.position], 0, 0,
		parseInt(x) - w / 2, parseInt(y) - w / 2, w, w);
	drawCursor();
}

function swapTools(eraser) {
	if(eraser) {
		for (key in tool)
			tool[key] = tools[2][key];
	}
	else {
		var back = tools[0];
		tool = tools[0] = tools[1];
		tools[1] = back;
		updateColor(0,1);
	}
	updateColor(tool.color);
	updateSliders();
}

function updateColor(value, toolIndex) {
	var t = tools[toolIndex || 0];
	var c = cElem;
	var v = value || c.value;
	var regShort = /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/i;
	var regLong = /^#[0-9a-fA-F]{6}$/i;
	var regRGB = /^([0-9]{1,3}),\s*([0-9]{1,3}),\s*([0-9]{1,3})/;
	if (regRGB.test(v))
	{
		var a = (t.color = v).split(new RegExp(",\s*"));
		v = "#";
		for (i in a) {
			a[i] = Math.max(Math.min(parseInt(a[i]), 255), 0);
			v += ((a[i] = parseInt(a[i]).toString(16)).length == 1) ? "0" + a[i] : a[i];
		}
	} else {
		if (regShort.test(v))
			v = v.replace(regShort, "#$1$1$2$2$3$3");
		if (!regLong.test(v))
			return;
		if (value != "") {
			t.color = parseInt(v.substr(1,2), 16) + ", "
				+ parseInt(v.substr(3,2), 16) + ", "
				+ parseInt(v.substr(5,2), 16);
		}
	}
	if (t == tool) {
		c.value = v;
	}
	document.getElementById((t == tool) ? "canva-fill" : "canva-delete").style.background = "rgb(" + t.color + ")";

	//inverted color
	var m = parseInt(v.substr(1), 16);
	var b = parseInt(m / 65536) + parseInt(m / 256) % 256 + parseInt(m % 256);
	document.getElementById((t == tool) ? "canva-fill" : "canva-delete").style.color = b > 380 ? "black" : "white";

	//adding to history palette:
	var found = palette["history"].length;
	for (i = 0; i < found; i ++)
		if (palette["history"][i] == v)
			found = i;

	for (i = Math.min(found, 64 - 1); i > 0; i --) //stores only limited count of specimens
		palette["history"][i] = palette["history"][i - 1];
	palette["history"][0] = v;

	if (currentPalette == "history")
		updatePalette();

	if (!!window.localStorage)
		window.localStorage.historyPalette = JSON.stringify(palette["history"]);
}

function updateButtons() {
	setElemDesc("canva-jpeg", actLayout["canva-jpeg"].Description + " (≈" + (canvas.toDataURL("image/jpeg").length / 1300).toFixed(0) + " kb)", "canva.jpeg");
	setElemDesc("canva-png", actLayout["canva-png"].Description + " (≈" + (canvas.toDataURL().length / 1300).toFixed(0) + " kb)", "canva.png");

	document.getElementById("history-redo").className = (history.position == history.positionMax ? "button-disabled" : "button");
	document.getElementById("history-undo").className = (history.position == 0 ? "button-disabled" : "button");

}

function cHotkeys(k) {
	//if (hki != 0)
		for (kbk in kbLayout) {			
			if (kbLayout[kbk] == k) {
				eval(actLayout[kbk].Operation);
				if(!(actLayout[kbk].Once || false)) {
					hkPressed = true;
					return true;
				}
			}
		}
	clearInterval(hki);
	return false;
}

function cHotkeysStart(event) {
	if (!hkPressed) {		
		var k = Math.min(event.keyCode, 255) //preventing from some bad things, that can happen
			+ (event.ctrlKey ? CTRL : 0)
			+ (event.shiftKey ? SHIFT : 0)
			+ (event.altKey ? ALT : 0)
			+ (event.metaKey ? META : 0)
		if (x >= 0 && x < canvasWidth && y >= 0 && y < canvasHeight) {
			event.preventDefault();
			event.returnValue = false;
			if (cHotkeys(k)) {				
				hki = setInterval('cHotkeys(' + k +')', 100);
			}
		}
	}
	else {
		event.preventDefault();
		event.returnValue = false;
	}
}

function cHotkeysEnd(event) {
	clearInterval(hki);
	hkPressed = false;
	event.preventDefault();
	event.returnValue = false;
}

function toolModify(id, param, inc, value) {
	switch (param) {
		case 0: tools[id].opacity = (inc == 0 ? value : (tools[id].opacity + inc)).toFixed(2); break;
		case 1: tools[id].width = (inc == 0 ? value : (tools[id].width + inc)); break;
		case 2: tools[id].shadow = (inc == 0 ? value : (tools[id].shadow + inc)); break;
		case 3: tools[id].turnLimit = (inc == 0 ? value : (tools[id].turnLimit + inc)); break;
	}
	updateSliders();
}

function switchMode(id) {
	switch (id) {
		case -1: debugMode =! debugMode; debugDiv.innerHTML=""; break;
		case 0: document.getElementById("tool-lowquality").className = (lowQMode = !lowQMode) ? "button-active" : "button"; break;
		case 1: document.getElementById("tool-preview").className = (precisePreview = !precisePreview) ? "button-active" : "button"; break;
		case 2: document.getElementById("tool-antialiasing").className = (antiAliasing = !antiAliasing) ? "button-active" : "button"; break;
		case 3: document.getElementById("tool-smooth").className = (smoothMode = !smoothMode) ? "button-active" : "button"; break;
	}
}

function sendPic(auto) {
	auto = auto || false
	if (auto || confirm("Вы уверены, что хотите загрузить изображение на сервер?")) {
		var imageToSend = document.createElement("input");
		var jpgData = canvas.toDataURL("image/jpeg");
		var pngData = canvas.toDataURL();
		imageToSend.value = (jpgData.length < pngData.length ? jpgData : pngData);
		imageToSend.name = "content";
		imageToSend.type = "hidden";
		sendForm.appendChild(imageToSend);
		sendForm.submit();
	}
}

function savePic(isPNG) {
	window.open(canvas.toDataURL(isPNG ? "" : "image/jpeg"), "_blank");
}

function fpsCount() {
	fps = ticks;
	ticks = 0;
}

function descKeyCode(keyCode) {
	return (keyCode & CTRL ? "Ctrl + ":"") + 
		(keyCode & ALT ? "Alt + ":"") + 
		(keyCode & META ? "Meta + ":"") + 
		(keyCode & SHIFT ? "Shift + ":"") + 
		(kbDesc[keyCode % 256] ? kbDesc[keyCode % 256] : String.fromCharCode(keyCode % 256));
}

function showHelp() {
	alert("Управление:\n\
Левая кнопка мыши — рисовать основным инструментом.\nПравая кнопка мыши — рисовать вторичным инструментом.\n\
Средняя кнопка мыши (или клавиша " + descKeyCode(kbLayout["tool-colorpick"]) + ") — выбор цвета из холста\n\
Колёсико / " + descKeyCode(kbLayout["tool-width-"]) + " / " + 
descKeyCode(kbLayout["tool-width+"]) + " / " + 
descKeyCode(kbLayout["tool-width.10"]) + "—" + descKeyCode(kbLayout["tool-width.9"]) + " — изменение толщины.\n\
Если зажать Ctrl или Shift, будет происхотить изменение прозрачности или тени соответственно.\n\
Остальные хоткеи можно подсмотреть, прочитав всплывающие подсказки к соответствующим кнопкам.\n\
Курсор обязательно должен находиться над холстом!\n\n\
В поле код можно вводить цвета в трёх видах: «#xxxxxx», «#xxx», «d,d,d», где x  — любая шестнадцатиречная цифра (0—f), d — десятеричное число в диапазоне от 0 до 255. Всё это в формате RGB.\n\n\
Feijoa Sketch " + infoVersion + " by Genius,  " + infoDate);
}
