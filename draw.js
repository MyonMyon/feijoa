var infoVersion = "v1.6.5";
var infoDate = "May 4, 2013"

var rootDiv, canvas, context, sendForm,
	buttonsBarDiv, toolsSpan, debugDiv,
	paletteDiv, colorInput; //main elements

var sliders = [];

var globalOffset = 0.5, //pixel offset
	globalOffs_1 = globalOffset - 0.01;

var activeDrawing = false;

var history = new History(32);
var mousePosition = new Point(-5, -5);
var previousMousePosition = new Point(-5, -5);

var CANVAS_WIDTH = 600,
	CANVAS_HEIGHT = 360;

var toolPresets = [
	{"opacity" : 1.00, "width" :  4, "shadow" : 0, "turnLimit" : 360, "color" : "0, 0, 0"      } //Fore
,	{"opacity" : 1.00, "width" : 20, "shadow" : 0, "turnLimit" : 360, "color" : "255, 255, 255"} //Back
,	{"opacity" : 1.00, "width" : 20, "shadow" : 0, "turnLimit" : 360, "color" : "255, 255, 255"} //Eraser
], tool = toolPresets[0];

var toolLimits = {
	"opacity":   {min: 0.05, max: 1,   step: 0.05},
	"width":     {min: 1,    max: 128, step: 1   },
	"shadow":    {min: 0,    max: 20,  step: 1   },
	"turnLimit": {min: 0,    max: 180, step: 1   }
};

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
		, "@b", "@r", "Сана" + "еэяѣ"[Math.floor(Math.random() * 4)], "#16168a", "#ffffff", "#13f356", "#9476f5", "#31cacc", "#e7962d"
		, "@b", "@r", "Канако", "#fa5041", "#43334d", "#7360dd", "#ffffff", "#cda277"
		, "@b", "@r", "Сувако", "#623fbd", "#ffffff", "#f6f3ac", "#bcb67a", "#ea0001", "#fbe4a1", "#000000"

		, "@b", "@r", "Ику", "#000000", "#ffffff", "#5940c0", "#ee0501"
		, "@b", "@r", "Тенши", "#ffffff", "#6dcef6", "#0073c1", "#f90b0b", "#405231", "#000000", "#f5d498", "#7cc074"

		];

	palette["history"] = (!!window.localStorage && !!window.localStorage.historyPalette) ? JSON.parse(window.localStorage.historyPalette) : [];

var currentPalette = (!!window.localStorage && !!window.localStorage.lastPalette) ? window.localStorage.lastPalette : "classic";

var hki = 0; //Hotkey interval for Opera
var hotkeyPressed = false;

//KEY MODIFIERS

var CTRL = 0x0100, SHIFT = 0x0200, ALT = 0x0400, META  = 0x0800, ENTER = 13,
    BACKSPACE = 8, TAB = 9, SECRET = 12, ENTER = 13, INSERT = 45, DELETE = 46,
    F1 = 112, F2 = 113, F3 = 114, F4  = 115, F5  = 116, F6 = 117,
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

	, "debug-mode" :				SECRET //SEECRET KEY !
};

	kbLayout = (!!window.localStorage && !!window.localStorage.layout) ? JSON.parse(window.localStorage.layout) : kbLayout;

for (i = 1; i <= 10; i++) {
	kbLayout["tool-opacity." + i] = (i == 10 ? 0 : i) + 48 + CTRL; 
	kbLayout["tool-width." + i] = (i == 10 ? 0 : i) + 48; 
}

var actLayout = { 
	  "history-undo" :				{"operation" :	"history.undo()",	"title" : "&#x2190;",	"description" : "Назад"}
	, "history-redo" :				{"operation" :	"history.redo()",	"title" : "&#x2192;",	"description" : "Вперёд"}
	, "history-store" :				{"operation" :	"history.storePic()",	"title" : "&#x22C1;",	"description" : "Сделать back-up",	"once" : true}
	, "history-extract" :			{"operation" :	"history.extractPic()",	"title" : "&#x22C0;",	"description" : "Извлечь back-up",	"once" : true}

	, "canva-fill" :				{"operation" :	"clearScreen(0)",		"title" : "F",			"description" : "Закрасить полотно основным цветом",	"once" : true}
	, "canva-delete" :				{"operation" :	"clearScreen(1)",		"title" : "B",			"description" : "Закрасить полотно фоновым цветом",		"once" : true}
	, "canva-invert" :				{"operation" :	"invertColors()",		"title" : "&#x25D0;",	"description" : "Инверсия полотна",		"once" : true}
	, "canva-jpeg" :				{"operation" :	"savePic(false)",		"title" : "J",			"description" : "Сохранить в JPEG",		"once" : true}
	, "canva-png" :					{"operation" :	"savePic(true)",		"title" : "P",			"description" : "Сохранить в PNG",		"once" : true}
	, "canva-send" :				{"operation" :	"sendPic()",			"title" : "&#x21B5;",	"description" : "Отправить на сервер",	"once" : true}

	, "tool-antialiasing" :			{"operation" :	"switchMode(2)",		"title" : "AA",			"description" : "Anti-Aliasing",			"once" : true}
	, "tool-preview" :				{"operation" :	"switchMode(1)",		"title" : "&#x25CF;",	"description" : "Предпросмотр кисти",		"once" : true}
	, "tool-lowquality" :			{"operation" :	"switchMode(0)",		"title" : "&#x25A0;",	"description" : "Режим низкого качества",	"once" : true}
	, "tool-smooth" :				{"operation" :	"switchMode(3)",		"title" : "Ω",			"description" : "Режим сглаживания линии",	"once" : true}
	, "tool-colorpick" :			{"operation" :	"cCopyColor()"}
	, "tool-swap" :					{"operation" :	"swapTools(false)",			"title" : "&#x2194;",	"description" : "Поменять инструменты местами",					"once" : true}
	, "tool-eraser" :				{"operation" :	"swapTools(true)",			"title" : "&#x25A1;",	"description" : "Заменить инструмент на стандартный ластик",	"once" : true}
	, "tool-width-" :				{"operation" :	"toolModify(0, 'width', -1)"}
	, "tool-width+" :				{"operation" :	"toolModify(0, 'width', +1)"}
	, "tool-opacity-" :				{"operation" :	"toolModify(0, 'opacity', -0.05)"}
	, "tool-opacity+" :				{"operation" :	"toolModify(0, 'opacity', +0.05)"}
	, "tool-shadow-" :				{"operation" :	"toolModify(0, 'shadow', -1)"}
	, "tool-shadow+" :				{"operation" :	"toolModify(0, 'shadow', +1)"}
	, "tool-turn-" :				{"operation" :	"toolModify(0, 'turnLimit', -1)"}
	, "tool-turn+" :				{"operation" :	"toolModify(0, 'turnLimit', +1)"}

	, "tool-width" : 				{"title" : "Толщина"}
	, "tool-opacity" : 				{"title" : "Непрозрачность"}
	, "tool-shadow" : 				{"title" : "Тень"}
	, "tool-color" : 				{"title" : "Код цвета"}
	, "tool-palette" : 				{"title" : "Палитра"}

	, "app-help" :					{"operation" :	"showHelp()",			"title" : "?",			"description" : "Помощь",	"once" : true}

	, "debug-mode" :				{"operation" :	"switchMode(-1)"}
};

//List of buttons to display
var guiButtons = ["history-undo", "history-redo", "|", "canva-fill", "tool-swap", "canva-delete", "tool-eraser", "canva-invert", "|",
					"tool-antialiasing", "tool-preview", "tool-smooth", "tool-lowquality", "|",
					"history-store", "history-extract", "canva-jpeg", "canva-png", "canva-send", "|", "app-help"];

for (i = 1; i <= 10; i++) {
	actLayout["tool-opacity." + i] = {"operation" : "toolModify(0, 'opacity', 0, " + (i / 10) + ")"}; 
	actLayout["tool-width." + i] = {"operation" : "toolModify(0, 'width', 0, " + Math.ceil(Math.pow(1.7, i-1)) + ")"}; 
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

for (i = 1; i <= 15; i++) {
	kbDesc[111 + i] = "F" + i;
}

document.addEventListener("DOMContentLoaded", init, false);

function init()
{
	rootDiv = document.getElementById("sketcher");

	sendForm = document.createElement("form");
	sendForm.method = "post";
	sendForm.action = "";
	rootDiv.appendChild(sendForm);

	canvas = document.createElement("canvas");	
	canvas.width = CANVAS_WIDTH;
	canvas.height = CANVAS_HEIGHT;
	rootDiv.appendChild(canvas);

	canvas.addEventListener("mousedown", cDrawStart, false);
	document.addEventListener("mousemove", cDraw, false);
	document.addEventListener("mouseup", cDrawEnd, false);
	document.addEventListener("keydown", cHotkeysStart, false);
	document.addEventListener("keyup", cHotkeysEnd, false);

	canvas.setAttribute("oncontextmenu", "return false;");
	canvas.setAttribute("onscroll", "return false;");

	canvas.addEventListener("wheel", cLWChange, false);

	context = canvas.getContext("2d");

	context.fillStyle = "white";
	context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
	history.array[0] = context.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

	toolsSpan = document.createElement("span");
	toolsSpan.id = "tools";
	rootDiv.appendChild(toolsSpan);

	function input(propertyName, isSlider) {
		var input = document.createElement("input");
		input.id = "tool-" + propertyName + (isSlider ? "" : "-text");
		input.type = isSlider ? "range" : "text";
		input.value = tool[propertyName];
		if (isSlider) {
			input.min = toolLimits[propertyName].min;
			input.max = toolLimits[propertyName].max;
			input.step = toolLimits[propertyName].step;
		}
		input.setAttribute("onchange", isSlider ? "updateSliders(1);" : "updateSliders(2);");
		toolsSpan.appendChild(input);
		sliders[input.id] = input;
	}

	var element = document.createElement("input"),
		properties = ["shadow", "opacity", "width"], 
		i = properties.length,
		supportsSliders = (element.type = "range") == element.type;

	while (i--) { 
		if (supportsSliders) {
			input(properties[i], true);
		}
		input(properties[i], false);

		element = document.createElement("span");
		element.innerHTML = " " + actLayout["tool-" + properties[i]].title;
		toolsSpan.appendChild(element);
		toolsSpan.appendChild(document.createElement("br"));
	};

	element = document.createElement("span");
	element.innerHTML = actLayout["tool-palette"].title + ": ";
	toolsSpan.appendChild(element);

	paletteSelect = document.createElement("select");
	paletteSelect.id = "palette-select";
	paletteSelect.setAttribute("onchange", "updatePalette();");
	toolsSpan.appendChild(paletteSelect);

	paletteDiv = document.createElement("div");
	paletteDiv.id = "palette";
	toolsSpan.appendChild(paletteDiv);

	for (tPalette in paletteDesc) {
		paletteSelect.options[paletteSelect.options.length] = new Option(paletteDesc[tPalette], tPalette);
		if (tPalette == currentPalette)
			paletteSelect.options[paletteSelect.options.length - 1].selected = true;
	}

	element = document.createElement("span");
	element.innerHTML = actLayout["tool-color"].title + ": ";
	toolsSpan.appendChild(element);

	colorInput = document.createElement("input");
	colorInput.type = "color";
	colorInput.id = "color"
	colorInput.setAttribute("onchange", "updateColor()");
	toolsSpan.appendChild(colorInput);

	buttonsBarDiv = document.createElement("div");	
	rootDiv.appendChild(buttonsBarDiv);

	for (var i = 0; i < guiButtons.length; i++) {
		var button = document.createElement("span");
		if(guiButtons[i] != "|") {
			button.id = guiButtons[i];
			button.className = (guiButtons[i] =="tool-antialiasing" && antiAliasing) ? "button-active" : "button";
			button.innerHTML = actLayout[guiButtons[i]].title;
			button.setAttribute("onclick", actLayout[guiButtons[i]].operation);
			buttonsBarDiv.appendChild(button);
			setElemDesc(guiButtons[i]);
		} else {
			button.className = "vertical";
			button.innerHTML = "&nbsp;";
			buttonsBarDiv.appendChild(button);
		}
	};

	for (var i = 0; i < toolPresets.length; i++) {
		updateColor(toolPresets[i].color, i);
	};

	debugDiv = document.createElement("div");	
	rootDiv.appendChild(debugDiv);

	updateDebugScreen();
	updatePalette();
	updateButtons();
	updateSliders();
}

function setElemDesc(elem, desc) {
	desc = desc || actLayout[elem].description;
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

	while (paletteDiv.childNodes.length) {
		paletteDiv.removeChild(paletteDiv.childNodes[0])
	}

	var colCount = 0,
		rowCount = 0;
	var colDesc = new Array();

	var paletteTable = document.createElement("table");
	paletteDiv.appendChild(paletteTable);
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
			rowCount++;
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
		colCount++;
	}
	paletteTable.appendChild(paletteRow);
}

function updatePosition(event) {
	mousePosition.x = event.pageX - canvas.offsetLeft;
	mousePosition.y = event.pageY - canvas.offsetTop;
}

function drawCursor () {
	if (mousePosition.x < 0 || mousePosition.x > CANVAS_WIDTH || mousePosition.y < 0 || mousePosition.y > CANVAS_HEIGHT) {
		return;
	}
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
	context.arc(mousePosition.x, mousePosition.y, tool.width / 2, 0, Math.PI*2, false);
	context.closePath();
	precisePreview ? context.fill() : context.stroke();
	if (!neverFlushCursor)
		flushCursor = true;
}

function cDraw(event) {
	updatePosition(event);
	updateDebugScreen();

	if ((flushCursor || neverFlushCursor) && !(lowQMode && activeDrawing)) {
		context.putImageData(history.current(), 0, 0);
	}

	if (activeDrawing) {
		if (smoothMode) {
			// Плохая реализация, линия едет только пока мышь двигается.
			previousMousePosition.x = Math.floor(mousePosition.x * 0.08 + previousMousePosition.x * 0.92);
			previousMousePosition.y = Math.floor(mousePosition.y * 0.08 + previousMousePosition.y * 0.92);
		} else {
			previousMousePosition.copyFrom(mousePosition);
		}

		if (antiAliasing) {
			context.lineTo(previousMousePosition.x + globalOffset, previousMousePosition.y + globalOffset);
		} else {
			// Все равно тот код придется преписать с нуля.
		}
		context.stroke();
	} else if (neverFlushCursor && !lowQMode) {
		drawCursor();
	}
}

function cDrawStart(event) {
	previousMousePosition.copyFrom(mousePosition);
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

		var t = toolPresets[(event.which == 1) ? 0 : 1];
		context.putImageData(history.current(), 0, 0);
		activeDrawing = true;
		context.lineWidth = antiAliasing ? t.width : 1;
		context.shadowBlur = t.shadow;
		context.strokeStyle = "rgba(" + t.color + ", " + t.opacity + ")";
		context.shadowColor = "rgb(" + t.color + ")";
		context.lineJoin = "round";
		context.lineCap = "round";
		context.beginPath();
		if(antiAliasing) {
			context.moveTo(mousePosition.x + globalOffset, mousePosition.y + globalOffset);
			context.lineTo(mousePosition.x + globalOffs_1, mousePosition.y + globalOffs_1);
			context.stroke();
		}
		else
			cDraw(event);
	}
	return false;
}

function cDrawEnd(event) {
	//Saving in history:
	if (activeDrawing) {
		context.putImageData(history.current(), 0, 0);
		context.stroke();
		context.closePath();
		history.refresh();
	}
	activeDrawing=false;
	updateDebugScreen();
}

function cDrawCancel() {
	if (activeDrawing) {
		history.undo();
		history.redo();
	}
	activeDrawing=false;
	updateDebugScreen();
}

function cCopyColor() {
	var rgba = history.current().data,
	i = (mousePosition.x+mousePosition.y*CANVAS_WIDTH)*4;
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
			tool.shadow--;
		else
			tool.width--;
	}
	if (delta < 0) {
		if (event.ctrlKey)
			tool.opacity = (parseFloat(tool.opacity) + 0.05).toFixed(2);
		else if (event.shiftKey)
			tool.shadow++;
		else
			tool.width++;
	}

	updateDebugScreen();
	updateSliders();
}

function updateDebugScreen() {
	if (debugMode) {
		debugDiv.innerHTML = "Cursor @" + mousePosition.x + ":" + mousePosition.y + "<br />Diff: " + (mousePosition.x - previousMousePosition.x) + ":" + (mousePosition.y - previousMousePosition.y) + "<br />FPS: " + fps;
		ticks++;
	}
}

function clearScreen(toolIndex) {
	context.fillStyle = "rgb(" + toolPresets[toolIndex].color + ")";
	context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
	history.refresh();
}

function invertColors() {
	var buffer = history.current();
	for (var i = 0; i < buffer.data.length; i += 4)
		for (var j = 0; j < 3; j++)
			buffer.data[i + j] = 255 - buffer.data[i + j];
	context.putImageData(buffer, 0, 0);
	history.refresh();
}

function updateSliders(initiator) {
	initiator = initiator || 0;

	if (initiator > 0) {
		var s = (initiator == 2 ? "-text" : "");
		tool.shadow	= document.getElementById("tool-shadow" + s).value;
		tool.width	= document.getElementById("tool-width" + s).value;
		tool.opacity	= document.getElementById("tool-opacity" + s).value;
		//tool.turnLimit	= document.getElementById("tool-turnlimit" + s).value;
	}

	function fitInRange(val, limit) {
		if(val < limit.min) {
			return limit.min;
		} else if(val > limit.max) {
			return limit.max;
		}
		return val;
	}

	fitInRange(tool.opacity, toolLimits.opacity);
	fitInRange(tool.width, toolLimits.width);
	fitInRange(tool.shadow, toolLimits.shadow);
	fitInRange(tool.turnLimit, toolLimits.turnLimit);

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
	var w = Math.max(tool.width, toolPresets[1].width) + Math.max(tool.shadow, toolPresets[1].shadow) * 2.5 + 7;
	context.putImageData(history.current(), 0, 0,
		Math.floor(mousePosition.x) - w / 2, Math.floor(mousePosition.y) - w / 2, w, w);
	drawCursor();
}

function swapTools(eraser) {
	if(eraser) {
		for (key in tool)
			tool[key] = toolPresets[2][key];
	}
	else {
		var back = toolPresets[0];
		tool = toolPresets[0] = toolPresets[1];
		toolPresets[1] = back;
		updateColor(0,1);
	}
	updateColor(tool.color);
	updateSliders();
}

function updateColor(value, toolIndex) {
	var t = toolPresets[toolIndex || 0];
	value = value || colorInput.value;
	var regShort = /^#([0-9A-F])([0-9A-F])([0-9A-F])$/i;
	var regLong = /^#[0-9A-F]{6}$/i;
	var regRGB = /^(\d{1,3})[^\d]*?(\d{1,3})[^\d]*?(\d{1,3})/;
	if (regRGB.test(value)) {
		var a = regRGB.exec(value);
		value = "#"
		for (var i = 1; i < a.length; i++) {
			a[i] = Math.max(Math.min(parseInt(a[i]), 255), 0);
			value += ((a[i] < 10) ? "0" : "") + a[i].toString(16);
		};
	} else {
		if (regShort.test(value))
			value = value.replace(regShort, "#$1$1$2$2$3$3");
		if (!regLong.test(value))
			return;
	}
	if (value != "") {
		t.color = parseInt(value.substr(1,2), 16) + ", "
			+ parseInt(value.substr(3,2), 16) + ", "
			+ parseInt(value.substr(5,2), 16);
	}
	if (t == tool) {
		colorInput.value = value;
	}
	document.getElementById((t == tool) ? "canva-fill" : "canva-delete").style.background = "rgb(" + t.color + ")";

	function getContrastColor(color) {
		return (color >> 16) + ((color >> 8) & 0xFF) + (color & 0xFF) > 380 ? "black" : "white"
	}

	//inverted color
	document.getElementById((t == tool) ? "canva-fill" : "canva-delete").style.color = getContrastColor(parseInt(value.substr(1), 16));

	//adding to history palette:
	var found = palette["history"].length;
	for (i = 0; i < found; i++)
		if (palette["history"][i] == value)
			found = i;

	for (i = Math.min(found, 64 - 1); i > 0; i--) //stores only limited count of specimens
		palette["history"][i] = palette["history"][i - 1];
	palette["history"][0] = value;

	if (currentPalette == "history")
		updatePalette();

	if (!!window.localStorage)
		window.localStorage.historyPalette = JSON.stringify(palette["history"]);
}

function updateButtons() {
	setElemDesc("canva-jpeg", actLayout["canva-jpeg"].description + " (≈" + (canvas.toDataURL("image/jpeg").length / 1300).toFixed(0) + " kb)", "canva.jpeg");
	setElemDesc("canva-png", actLayout["canva-png"].description + " (≈" + (canvas.toDataURL().length / 1300).toFixed(0) + " kb)", "canva.png");

	document.getElementById("history-redo").className = (history.position == history.positionMax ? "button-disabled" : "button");
	document.getElementById("history-undo").className = (history.position == 0 ? "button-disabled" : "button");
}

function cHotkeys(k) {
	//if (hki != 0)
		for (kbk in kbLayout) {			
			if (kbLayout[kbk] == k) {
				eval(actLayout[kbk].operation);
				if(!(actLayout[kbk].once || false)) {
					hotkeyPressed = true;
					return true;
				}
			}
		}
	clearInterval(hki);
	return false;
}

function cHotkeysStart(event) {
	if (!hotkeyPressed) {		
		var k = Math.min(event.keyCode, 255) //preventing from some bad things, that can happen
			+ (event.ctrlKey ? CTRL : 0)
			+ (event.shiftKey ? SHIFT : 0)
			+ (event.altKey ? ALT : 0)
			+ (event.metaKey ? META : 0)
		if (mousePosition.x >= 0 && mousePosition.x < CANVAS_WIDTH && mousePosition.y >= 0 && mousePosition.y < CANVAS_HEIGHT) {
			event.preventDefault();
			event.returnValue = false;
			if (cHotkeys(k)) {				
				hki = setInterval('cHotkeys(' + k +')', 100);
			}
		}
	} else {
		event.preventDefault();
		event.returnValue = false;
	}
}

function cHotkeysEnd(event) {
	clearInterval(hki);
	hotkeyPressed = false;
	event.preventDefault();
	event.returnValue = false;
}

function toolModify(index, param, inc, value) {
	toolPresets[index][param] = (inc == 0 ? value : (toolPresets[index][param] + inc)).toFixed(2); 
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

/*==============================================================================
                                    History
==============================================================================*/

function History(storage) {
	this.storage = storage;
	this.array = new Array(this.storage);
	this.position = 0;
	this.positionMax = 0;
	this.lastAutoSaveTime = new Date().getTime(),
	this.autoSaveEnabled = true;
	this.autoSaveInterval = 60000;
}

History.prototype.refresh = function() {
	if (this.position < this.storage - 1) {
		this.position++;
		this.positionMax = this.position;
	} else {
		this.array.splice(0, this.array.length - this.storage);
	}
	this.array[this.position] = context.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
	if (this.autoSaveEnabled) {
		var currentTime = new Date().getTime();
		if (currentTime - this.lastAutoSaveTime > this.autoSaveInterval) {
			this.storePic(true);
			this.lastAutoSaveTime = currentTime;
		}
	}
	updateDebugScreen();
	updateButtons();
};

History.prototype.undo = function() {
	if (this.position > 0) {
		this.position--;
	}
	context.putImageData(this.array[this.position], 0, 0);
	updateDebugScreen();
	updateButtons();
};

History.prototype.redo = function() {
	if (this.position < this.storage - 1 && this.position < this.positionMax) {
		this.position++;
	}
	context.putImageData(this.array[this.position], 0, 0);
	updateDebugScreen();
	updateButtons();
};

History.prototype.storePic = function(auto) {
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

History.prototype.extractPic = function(auto) {
	auto = auto || false
	var image = new Image();
	if(!!window.localStorage)
		image.src = window.localStorage.recovery;
	else if (!auto)
		alert("Local Storage не поддерживается.");
	context.drawImage(image, 0, 0);
	this.refresh();
};

History.prototype.current = function() {
	return this.array[this.position];
};

/*==============================================================================
                                    Point
==============================================================================*/

/*http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/flash/geom/Point.html*/
function Point(x, y){
	this.x = x || 0;
	this.y = y || 0;
};

Point.prototype.length = function(){
	return Math.sqrt(this.x * this.x + this.y * this.y);
};

Point.prototype.add = function(v){
	return new Point(this.x + v.x, this.y + v.y);
};

Point.prototype.clone = function(){
	return new Point(this.x, this.y);
};

Point.prototype.copyFrom = function(sourcePoint) {
	this.x = sourcePoint.x;
	this.y = sourcePoint.y;
};

Point.prototype.equals = function(toCompare){
	return this.x == toCompare.x && this.y == toCompare.y;
};

Point.prototype.normalize = function(thickness){
	var l = this.length();
	this.x = this.x / l * thickness;
	this.y = this.y / l * thickness;
};

Point.prototype.offset = function(dx, dy){
	this.x += dx;
	this.y += dy;
};

Point.prototype.setTo = function(x, y) {
	this.x = x;
	this.y = y;
};

Point.prototype.subtract = function(v){
	return new Point(this.x - v.x, this.y - v.y);
};

Point.prototype.toString = function(){
	return "(x=" + this.x + ", y=" + this.y + ")";
};

Point.distance = function(pt1, pt2){
	var x = pt1.x - pt2.x;
	var y = pt1.y - pt2.y;
	return Math.sqrt(x * x + y * y);
};

Point.interpolate = function(pt1, pt2, f){
	return new Point((pt1.x + pt2.x) * f, (pt1.y + pt2.y) * f);
};

Point.polar = function(len, angle){
	return new Point(len * Math.sin(angle), len * Math.cos(angle));
};