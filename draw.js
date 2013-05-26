var infoVersion = "v1.6.20";
var infoDate = "May 26, 2013";

var sketcher, canvas, context, sendForm,
	bottomElem, sideElem, debugElem,
	paletteElem, colorCodeElem; //main elements

var sliders = [];

var	globalOffset = 0.5, //pixel offset
	globalOffs_1 = globalOffset - 0.01;

var activeDrawing = false;

var sendButton = sendButton || false;

//////////////////////////////////////////////////

var cursor;

function Cursor() {
	this.posX = 0;
	this.posY = 0;
	this.prevX = 0;
	this.prevY = 0;
	this.flushNext = false;
	this.neverFlush = true;
	this.visual = document.createElement("div");	
	sketcher.appendChild(this.visual);
	this.visual.id = "cursor";
}	

Cursor.prototype.update = function(event) {
	if(event) {
		this.posX = event.pageX - canvas.offsetLeft;
		this.posY = event.pageY - canvas.offsetTop;
	}
}

Cursor.prototype.draw = function(event) {	
	if (this.posX >= 0 && this.posX < cWidth &&
		this.posY >= 0 && this.posY < cHeight) {
		if(modes["app-compatible"]) {
			context.beginPath();
			context.lineWidth = 1;
			if (modes["tool-preview"]) {
				context.fillStyle = "rgba(" + tool.color + ", " + tool.opacity + ")";
				context.shadowBlur = tool.shadow;
				context.shadowColor = "rgb(" + tool.color + ")";
			}
			else {
				context.strokeStyle = "rgb(" + tool.color + ")";
				context.shadowBlur = 0;
			}

			context.arc(this.posX, this.posY, tool.width / 2, 0, Math.PI*2, false);
			context.closePath();
			modes["tool-preview"] ? context.fill() : context.stroke();
			if (!this.neverFlush)
				this.flushNext = true;
		} else {
			this.visual.style.display = "block";
			this.visual.style.left = (this.posX + canvas.offsetLeft - tool.width / 2) + "px";
			this.visual.style.top = (this.posY + canvas.offsetTop - tool.width / 2) + "px";
			this.visual.style.width = Math.max(tool.width - 2, 0)  + "px";
			this.visual.style.height = Math.max(tool.width - 2, 0) + "px";
			this.visual.style.borderRadius = Math.max(tool.width - 2, 0)  / 2 + "px";
			if(modes["tool-preview"]) {
				this.visual.style.backgroundColor = "rgba(" + tool.color + "," + tool.opacity + ")";
				this.visual.style.borderColor = "transparent";
				this.visual.style.boxShadow = "0 0 " + tool.shadow + "px rgba(" + tool.color + "," + tool.opacity + ")";
			} else {
				this.visual.style.backgroundColor = "transparent";
				this.visual.style.borderColor = "rgb(" + tool.color + ")";
				this.visual.style.boxShadow = "none";
			}
		}
	} else
		this.hide();
}

Cursor.prototype.hide = function() {
	this.visual.style.display = "none";
}

//////////////////////////////////////////////////

var history;

function History(size) {	
	this.size = size;
	this.container = new Array(this.size);
	this.position = 0;
	this.positionMax = 0;
	this.container[0] = context.getImageData(0, 0, cWidth, cHeight);
}

History.prototype.current = function() {
	return this.container[this.position];
}

History.prototype.undo = function() {
	if (this.position > 0) 
		this.position --;

	context.putImageData(this.container[this.position], 0, 0);
	updateButtons();
}

History.prototype.redo = function() {	
	if (this.position < this.size - 1 && this.position < this.positionMax)
		this.position ++;

	context.putImageData(this.container[this.position], 0, 0);
	updateButtons();
}

History.prototype.push = function() {
	if (this.position < this.size - 1) {
		this.position ++;
		this.positionMax = this.position;
	} else for(i = 0; i < this.size - 1; i ++)
		this.container[i] = this.container[i + 1];

	this.container[this.position] = context.getImageData(0, 0, cWidth, cHeight);

	if (enableAutoSave) {
		var dt = new Date().getTime();
		if (dt - lastAutoSave > 60000) {
			picTransfer('toLS',true);
			lastAutoSave = dt;
		}
	}
	updateButtons();
}

//////////////////////////////////////////////////

var lastAutoSave = new Date().getTime(),
	enableAutoSave = true;

var cWidth = 600,
	cHeight = 360; //may be not so constant in future

//////////////////////////////////////////////////

var toolPresets = [
	{"opacity" : 1.00, "width" :  4, "shadow" : 0, "color" : "0, 0, 0"		} //Fore Default
,	{"opacity" : 1.00, "width" : 20, "shadow" : 0, "color" : "255, 255, 255"} //Back Default
,	{"opacity" : 1.00, "width" : 20, "shadow" : 0, "color" : "255, 255, 255"} //Eraser
,	{"opacity" : 1.00, "width" :  1, "shadow" : 0, "color" : "0, 0, 0"		} //Pencil
];

var tools = [
	{"opacity" : 0, "width" :  0, "shadow" : 0, "color" : "0, 0, 0"},
	{"opacity" : 0, "width" :  0, "shadow" : 0, "color" : "0, 0, 0"}
], tool = tools[0];

var toolLimits = {"opacity": [0.05, 1, 0.05], "width": [1, 128, 1], "shadow": [0, 20, 1], "turnLimit": [0, 180, 1]};

//////////////////////////////////////////////////

var modes = {
	"tool-lowquality": false
,	"tool-preview": false
,	"tool-antialiasing": true
,	"tool-smooth": false
,	"tool-line": false
,	"app-help": false
,	"app-compatible": false
,	"debug-mode": false
	};

if (!!window.localStorage && !!window.localStorage.modes)
	modes = JSON.parse(window.localStorage.modes);

var fps = 0,
	ticks = 0,
	fpsi = 0;

//////////////////////////////////////////////////

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

var currentPalette = (!!window.localStorage && !!window.localStorage.lastPalette) ? window.localStorage.lastPalette : "combo";

//////////////////////////////////////////////////

var hki = 0; //Hotkey interval for Opera
var hkPressed = false;

//KEY MODIFIERS
var CTRL = 0x0100, 
	SHIFT = 0x0200,
	ALT = 0x0400;
	META = 0x0800;

var kbLayout = { 
	  "history-undo" :				"Z".charCodeAt(0)
	, "history-redo" :				"X".charCodeAt(0)
	, "history-redo" :				"X".charCodeAt(0)
	, "history-store" :				119 //F8
	, "history-extract" :			120 //F9

	, "canva-fill" :				"F".charCodeAt(0)
	, "canva-delete" :				"B".charCodeAt(0)
	, "canva-invert" :				"I".charCodeAt(0)
	, "canva-jpeg" :				CTRL + "J".charCodeAt(0)
	, "canva-png" :					CTRL + "P".charCodeAt(0)
	, "canva-send" :				CTRL + 13 //ENTER

	, "tool-antialiasing" :			CTRL + "A".charCodeAt(0)
	, "tool-smooth" :				CTRL + "K".charCodeAt(0)
	, "tool-lowquality" :			CTRL + "L".charCodeAt(0)
	, "tool-preview" :				"V".charCodeAt(0)
	, "tool-colorpick" :			"C".charCodeAt(0)
	, "tool-swap" :					"S".charCodeAt(0)
	, "tool-pencil" :				"P".charCodeAt(0)
	, "tool-eraser" :				"E".charCodeAt(0)
	, "tool-line" :					"L".charCodeAt(0)
	, "tool-default" :				"R".charCodeAt(0)
	, "tool-width-" :				"Q".charCodeAt(0)
	, "tool-width+" :				"W".charCodeAt(0)
	, "tool-opacity-" :				CTRL + "Q".charCodeAt(0)
	, "tool-opacity+" :				CTRL + "W".charCodeAt(0)
	, "tool-shadow-" :				SHIFT + "Q".charCodeAt(0)
	, "tool-shadow+" :				SHIFT + "W".charCodeAt(0)

	, "app-help" :					112 //F1
	, "app-compatible" :			114 //F3
	, "app-settings" :				115 //F4

	, "debug-mode" :				12 //CLEAR
};

	kbLayout = (!!window.localStorage && !!window.localStorage.layout) ? JSON.parse(window.localStorage.layout) : kbLayout;

for (i = 1; i <= 10; i ++) {
	kbLayout["tool-opacity." + i] = (i == 10 ? 0 : i) + 48 + CTRL; 
	kbLayout["tool-width." + i] = (i == 10 ? 0 : i) + 48; 
}

var actLayout = { 
	  "history-undo" :				{"operation" :	"history.undo()",	"title" : "&#x2190;",	"small": "UNDO",	"description" : "Назад"}
	, "history-redo" :				{"operation" :	"history.redo()",	"title" : "&#x2192;",	"small": "REDO",	"description" : "Вперёд"}
	, "history-store" :				{"operation" :	"picTransfer('toLS')",	"title" : "&#x22C1;",	"small": "STORE",	"description" : "Сделать back-up",	"once" : true}
	, "history-extract" :			{"operation" :	"picTransfer('fromLS')","title" : "&#x22C0;",	"small": "EXTRACT",	"description" : "Извлечь back-up",	"once" : true}

	, "canva-fill" :				{"operation" :	"clearScreen(0)",		"title" : "",			"small": "FORE",	"description" : "Закрасить полотно основным цветом",	"once" : true}
	, "canva-delete" :				{"operation" :	"clearScreen(1)",		"title" : "",			"small": "BACK",	"description" : "Закрасить полотно фоновым цветом",		"once" : true}
	, "canva-invert" :				{"operation" :	"invertColors()",		"title" : "&#x25D0;",	"small": "INVERT",	"description" : "Инверсия полотна",		"once" : true}
	, "canva-jpeg" :				{"operation" :	"picTransfer('toJPG')",	"title" : "",			"small": "JPEG",	"description" : "Сохранить в JPEG",		"once" : true}
	, "canva-png" :					{"operation" :	"picTransfer('toPNG')",	"title" : "",			"small": "PNG",		"description" : "Сохранить в PNG",		"once" : true}
	, "canva-send" :				{"operation" :	"picTransfer('send')",	"title" : "&#x21B5;",	"small": "SEND",	"description" : "Отправить на сервер",	"once" : true}

	, "tool-antialiasing" :			{"operation" :	"switchMode('tool-antialiasing')",		"title" : "&#x22A1;",	"small": "AA",		"description" : "Anti-Aliasing",			"once" : true}
	, "tool-preview" :				{"operation" :	"switchMode('tool-preview')",			"title" : "&#x25CF;",	"small": "PREVIEW",	"description" : "Предпросмотр кисти",		"once" : true}
	, "tool-lowquality" :			{"operation" :	"switchMode('tool-lowquality')",		"title" : "&#x25A0;",	"small": "LOW Q",	"description" : "Режим низкого качества",	"once" : true}
	, "tool-smooth" :				{"operation" :	"switchMode('tool-smooth')",			"title" : "Ω",			"small": "SMOOTH",	"description" : "Режим сглаживания линии",	"once" : true}
	, "tool-line" :					{"operation" :	"switchMode('tool-line')",				"title" : "&#x2014",	"small": "LINE",	"description" : "Режим прямых линий",		"once" : true}
	, "tool-colorpick" :			{"operation" :	"cCopyColor()"}
	, "tool-swap" :					{"operation" :	"setTool('swap')",		"title" : "&#x2194;",	"small": "SWAP",	"description" : "Поменять инструменты местами",					"once" : true}
	, "tool-eraser" :				{"operation" :	"setTool(2)",			"title" : "&#x25EF;",	"small": "ERASER",	"description" : "Заменить инструмент на стандартный ластик",	"once" : true}
	, "tool-pencil" :				{"operation" :	"setTool(3)",			"title" : "i",			"small": "PENCIL",	"description" : "Заменить инструмент на стандартный карандаш",	"once" : true}
	, "tool-default" :				{"operation" :	"setTool('reset')",		"title" : "&#x2300;",	"small": "RESET",	"description" : "Восстановить значения по умолчанию",	"once" : true}
	, "tool-width-" :				{"operation" :	"toolModify(0, 'width', -1)",		"title" : "-",		"description" : "Уменьшить"}
	, "tool-width+" :				{"operation" :	"toolModify(0, 'width', +1)",		"title" : "+",		"description" : "Увеличить"}
	, "tool-opacity-" :				{"operation" :	"toolModify(0, 'opacity', -0.05)",	"title" : "-",		"description" : "Уменьшить"}
	, "tool-opacity+" :				{"operation" :	"toolModify(0, 'opacity', +0.05)",	"title" : "+",		"description" : "Увеличить"}
	, "tool-shadow-" :				{"operation" :	"toolModify(0, 'shadow', -1)",		"title" : "-",		"description" : "Уменьшить"}
	, "tool-shadow+" :				{"operation" :	"toolModify(0, 'shadow', +1)",		"title" : "+",		"description" : "Увеличить"}

	, "tool-width" : 				{"title" : "Толщина"}
	, "tool-opacity" : 				{"title" : "Непрозрачность"}
	, "tool-shadow" : 				{"title" : "Тень"}
	, "tool-color" : 				{"title" : "Код цвета"}
	, "tool-palette" : 				{"title" : "Палитра"}

	, "app-compatible" :			{"operation" :	"switchMode('app-compatible')",	"title" : "?",		"small": "COMPAT",	"description" : "Режим совместимости",	"once" : true}
	, "app-help" :					{"operation" :	"switchMode('app-help')",	"title" : "?",			"small": "HELP",	"description" : "Помощь",	"once" : true}
	, "app-settings" :				{"operation" :	"alert('Not done yet.')",	"title" : "&#x263C;",	"small": "SETTINGS","description" : "Настройки","once" : true}

	, "debug-mode" :				{"operation" :	"switchMode('debug-mode')"}
};

//List of buttons to display
var guiButtons = ["history-undo", "history-redo", "|", "canva-fill", "tool-swap", "canva-delete", "canva-invert", "|", "tool-default", "tool-pencil", "tool-eraser", "|", 
					"tool-line", "tool-preview", "tool-smooth", "tool-lowquality", "|",
					"history-store", "history-extract", "canva-jpeg", "canva-png", sendButton ? "|" : "", sendButton ? "canva-send" : "", "|", "app-help"];

for (i = 1; i <= 10; i ++) {
	actLayout["tool-opacity." + i] = {"operation" : "toolModify(0, 0, 0, " + (i / 10) + ")"}; 
	actLayout["tool-width." + i] = {"operation" : "toolModify(0, 1, 0, " + Math.ceil(Math.pow(1.7, i-1)) + ")"}; 
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

	cursor = new Cursor();

	cursor.visual.addEventListener("mousedown", cDrawStart, false);
	cursor.visual.addEventListener("mousemove", cDraw, false);
	canvas.addEventListener("mousedown", cDrawStart, false);
	canvas.addEventListener("mousemove", cDraw, false);
	document.addEventListener("mouseup", cDrawEnd, false);
	canvas.addEventListener("mouseout", cDraw, false);
	canvas.addEventListener("mouseover", cDrawRestore, false);
	document.addEventListener("mousemove", cursor.update, false);
	document.addEventListener("keydown", cHotkeysStart, false);
	document.addEventListener("keyup", cHotkeysEnd, false);

	canvas.setAttribute("oncontextmenu", "return false;");
	canvas.setAttribute("onscroll", "return false;");

	cursor.visual.setAttribute("oncontextmenu", "return false;");
	cursor.visual.setAttribute("onscroll", "return false;");

	canvas.addEventListener("wheel", cLWChange, false);
	canvas.addEventListener("mousewheel", cLWChange, false);
	canvas.addEventListener("scroll", cLWChange, false);

	cursor.visual.addEventListener("wheel", cLWChange, false);
	cursor.visual.addEventListener("mousewheel", cLWChange, false);
	cursor.visual.addEventListener("scroll", cLWChange, false);

	canvas.width = cWidth;
	canvas.height = cHeight;

	context = canvas.getContext("2d");

	context.fillStyle = "white";
	context.fillRect(0, 0, cWidth, cHeight);

	history = new History(32);

	sideElem = document.createElement("span");
	sideElem.id = "tools";
	sketcher.appendChild(sideElem);

	helpElem = document.createElement("span");
	helpElem.id = "help";
	sketcher.appendChild(helpElem);
	helpElem.style.display = "none";
	helpElem.innerHTML = "Управление:<br />\
Левая кнопка мыши — рисовать основным инструментом.<br />Правая кнопка мыши — рисовать вторичным инструментом.<br />\
Средняя кнопка мыши (или клавиша " + descKeyCode(kbLayout["tool-colorpick"]) + ") — выбор цвета из холста<br />\
Колёсико / " + descKeyCode(kbLayout["tool-width-"]) + " / " + 
descKeyCode(kbLayout["tool-width+"]) + " / " + 
descKeyCode(kbLayout["tool-width.10"]) + "—" + descKeyCode(kbLayout["tool-width.9"]) + " — изменение толщины.<br />\
Если зажать Ctrl или Shift, будет происхотить изменение прозрачности или тени соответственно.<br />\
Остальные хоткеи можно подсмотреть на соответствующих кнопках.<br />\
Курсор обязательно должен находиться над холстом!<br /><br />\
В поле код можно вводить цвета в трёх видах: «#xxxxxx», «#xxx», «d,d,d», где x  — любая шестнадцатиречная цифра (0—f), d — десятеричное число в диапазоне от 0 до 255. Всё это в формате RGB.<br /><br />\
Feijoa Sketch " + infoVersion + " by Genius,  " + infoDate;

	var e = document.createElement("input"),
		a = ["shadow", "opacity", "width"], 
		i = a.length;
	while (i--) { 
		var et;
		var rangeElemSupport = (e.type = "range") == e.type;
		if (rangeElemSupport) {
			et = document.createElement("input");
			et.id = "tool-" + a[i];
			et.type = "range";
			et.value = tool[a[i]];
			et.min = toolLimits[a[i]][0];
			et.max = toolLimits[a[i]][1];
			et.step = toolLimits[a[i]][2];
			et.setAttribute("onchange", "updateSliders(1);");
			sideElem.appendChild(et);
			sliders[et.id] = et;
		}

		if (!rangeElemSupport)
			setToolButton(a[i], "-");

		et = document.createElement("input");
		et.id = "tool-" + a[i] + "-text";
		et.value = eval("tool." + a[i]);
		et.type = "text";
		et.setAttribute("onchange", "updateSliders(2);");
		sideElem.appendChild(et);
		sliders[et.id] = et;

		if (!rangeElemSupport)
			setToolButton(a[i], "+");

		et = document.createElement("span");
		et.innerHTML = " " + actLayout["tool-" + a[i]].title;
		sideElem.appendChild(et);

		sideElem.appendChild(document.createElement("br"));
	};

	e = document.createElement("span");
	e.innerHTML = actLayout["tool-palette"].title + ": ";
	sideElem.appendChild(e);

	paletteSelect = document.createElement("select");
	paletteSelect.id = "palette-select";
	paletteSelect.setAttribute("onchange", "updatePalette();");
	sideElem.appendChild(paletteSelect);

	paletteElem = document.createElement("div");
	paletteElem.id = "palette";
	sideElem.appendChild(paletteElem);

	for (tPalette in paletteDesc) {
		paletteSelect.options[paletteSelect.options.length] = new Option(paletteDesc[tPalette], tPalette);
		if (tPalette == currentPalette)
			paletteSelect.options[paletteSelect.options.length - 1].selected = true;
	}

	e = document.createElement("span");
	e.innerHTML = actLayout["tool-color"].title + ": ";
	sideElem.appendChild(e);

	colorCodeElem = document.createElement("input");
	sideElem.appendChild(colorCodeElem);
	colorCodeElem.type = "color"; //It's IE! I ain't gotta fix its shit. Blame MS right here.
	colorCodeElem.id = "color";
	colorCodeElem.setAttribute("onchange", "updateColor()");

	bottomElem = document.createElement("div");	
	sketcher.appendChild(bottomElem);

	for(i in guiButtons) {
		var tElem = document.createElement("span");	
		if(guiButtons[i] != "")
			if(guiButtons[i] != "|") {
				tElem.id = guiButtons[i];
				tElem.className = (guiButtons[i] =="tool-antialiasing" && modes["tool-antialiasing"]) ? "button-active" : "button";
				tElem.setAttribute("onclick", actLayout[guiButtons[i]].operation);
				bottomElem.appendChild(tElem);	
				setElemDesc(guiButtons[i],null,true);
			} else {
				tElem.className = "vertical";	
				tElem.innerHTML = "&nbsp;";
				bottomElem.appendChild(tElem);	
			}
	}

	updateColor(tools[0].color, 0);
	updateColor(tools[1].color, 1);

	debugElem = document.createElement("div");	
	sketcher.appendChild(debugElem);

	setTool('reset');
	updateDebugScreen();
	updatePalette();
	updateButtons();
	updateSliders();
}

function setToolButton(property, sign) {
	var button = "tool-" + property + sign;
	var et = document.createElement("span");
	et.id = button;
	et.className = "button button-mini";
	et.innerHTML = actLayout[button].title;
	et.setAttribute("onclick", actLayout[button].operation);
	sideElem.appendChild(et);	
	setElemDesc(button);
}

function setElemDesc(elem, desc, info) {
	info = info || false;
	desc = desc || actLayout[elem].description;
	var k = kbLayout[elem];
	var tElem = document.getElementById(elem);
	tElem.title = desc + ((kbLayout[elem] && !info) ?  (" (" + 
		descKeyCode(k) + ")") : "");
	if (info)
		tElem.innerHTML = "<div class='hotkey'>" + (kbLayout[elem] ? descKeyCode(k) : "&nbsp;") + "</div>"
		 + (actLayout[elem].title || "&nbsp;") + "<br />" +
		 "<span class='small'>" + (actLayout[elem].small || "&nbsp;") + "</span>";
	else
		tElem.innerHTML = actLayout[elem].title;
}

function generatePalette(name, step, slice) { //safe palette generator, step recomended to be: 1, 3, 5, 15, 17, 51, 85, 255
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
			palettine.setAttribute("onclick", "updateColor('" + c + "', 0);");
			palettine.setAttribute("oncontextmenu", "updateColor('" + c + "', 1); return false;");
			paletteCell.appendChild(palettine);
			paletteRow.appendChild(paletteCell);
		}
		colCount ++;
	}
	paletteTable.appendChild(paletteRow);
}

function cDraw(event) {
	cursor.update(event);

	updateDebugScreen();

	if ((cursor.flushNext || cursor.neverFlush) && !(modes["tool-lowquality"] && activeDrawing)) {
		context.putImageData(history.current(), 0, 0);
	}

	if (activeDrawing) {
		if (!modes["tool-line"])  {
			var tX = cursor.prevX, tY = cursor.prevY;
			cursor.prevX = modes["tool-smooth"] ? parseInt(cursor.posX * 0.08 + cursor.prevX * 0.92) : cursor.posX;
			cursor.prevY = modes["tool-smooth"] ? parseInt(cursor.posY * 0.08 + cursor.prevY * 0.92) : cursor.posY;
		}
		if (!modes["tool-antialiasing"]) { //This probably would require massive optimization. Blame W3C.
			while (1) {
				for (i = 0; i < tool.width; i++) {
					var rC = Math.sqrt(1 - Math.pow(-1 + (i + 0.5) / tool.width * 2, 2));
					context.moveTo(parseInt(tX - tool.width * rC / 2 - 0.5) + globalOffs_1, tY + globalOffset - parseInt(tool.width / 2) + i);
					context.lineTo(parseInt(tX + tool.width * rC / 2 - 0.5) - globalOffset, tY + globalOffset - parseInt(tool.width / 2) + i);
					context.stroke();
				}
				tX = parseInt((pX + tX) / 2);
				tY = parseInt((pY + tY) / 2);
					break;
			}			
		} else {
			if(modes["tool-line"]) {
				context.putImageData(history.current(), 0, 0);
				context.beginPath();
				context.moveTo(cursor.prevX + globalOffset, cursor.prevY + globalOffset);
				context.lineTo(cursor.posX + globalOffset, cursor.posY + globalOffset);
				context.stroke();
				context.closePath();
			} else {
				context.lineTo(cursor.prevX + globalOffset, cursor.prevY + globalOffset);
				context.stroke();
			}
		}
	} else
		if (cursor.neverFlush && !modes["tool-lowquality"])
			cursor.draw();
}

function cDrawStart(event) {
	cursor.prevX = cursor.posX;
	cursor.prevY = cursor.posY;

	cursor.update(event);
	cursor.hide();
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
		context.putImageData(history.current(), 0, 0);
		activeDrawing = true;
		context.lineWidth = modes["tool-antialiasing"] ? t.width : 1;
		context.shadowBlur = t.shadow;
		context.strokeStyle = "rgba(" + t.color + ", " + t.opacity + ")";
		if (context.shadowBlur == 0)
			context.shadowColor = 'transparent';
		else
			context.shadowColor = "rgb(" + t.color + ")";
		
		context.lineJoin = "round";
		context.lineCap = "round";
		context.beginPath();
		if(modes["tool-antialiasing"]) {
			context.moveTo(cursor.posX + globalOffset, cursor.posY + globalOffset);
			context.lineTo(cursor.posX + globalOffs_1, cursor.posY + globalOffs_1);
			context.stroke();
		}
		else
			cDraw(event);
		vX = cursor.posX;
		vY = cursor.posY;
	}
	return false;
}

function cDrawEnd(event) {
	//Saving in history:
	if (activeDrawing) {
		context.putImageData(history.current(), 0, 0);
		context.stroke();
		context.closePath();
		history.push();
	}
	activeDrawing = false;
	updateDebugScreen();
}

function cDrawRestore(event) {
	if (activeDrawing)
		context.moveTo(cursor.posX + globalOffset, cursor.posY + globalOffset);
	cursor.update(event);
	cursor.prevX = cursor.posX;
	cursor.prevY = cursor.posY;
}

function cDrawCancel() {
	if (activeDrawing) {
		history.undo();
		history.redo();
	}
	activeDrawing = false;
	updateDebugScreen();
}

function cCopyColor() {
	var rgba = history.current().data, i = (cursor.posX + cursor.posY * cWidth) * 4;
	var hex = (rgba[i] * 65536 + rgba[i + 1] * 256 + rgba[i + 2]).toString(16);
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
	if (modes["debug-mode"]) {
		debugElem.innerHTML = "Cursor @" + cursor.posX + ":" + cursor.posY + "<br />Diff: " + (cursor.posX - cursor.prevX) + ":" + (cursor.posY - cursor.prevY) + "<br />FPS: " + fps + "<br />Ticks: " + ticks;
		ticks ++;
	}
}

function clearScreen(toolIndex) {
	context.fillStyle = "rgb(" + tools[toolIndex].color + ")";
	context.fillRect(0, 0, cWidth, cHeight);
	history.push();
}

function invertColors() {
	var buffer = history.current();
	for (var i = 0; i < buffer.data.length; i += 4)
		for (var j = 0; j < 3; j++)
			buffer.data[i + j] = 255 - buffer.data[i + j];
	context.putImageData(buffer, 0, 0);
	history.push();
}

function updateSliders(initiator) {
	var m = initiator || 0;

	if (m > 0) {
		var s = (m == 2 ? "-text" : "");
		tool.shadow	= document.getElementById("tool-shadow" + s).value;
		tool.width	= document.getElementById("tool-width" + s).value;
		tool.opacity	= document.getElementById("tool-opacity" + s).value;
	}

	if (tool.opacity <= toolLimits.opacity[0]) tool.opacity = toolLimits.opacity[0].toFixed(2); else
	if (tool.opacity >= toolLimits.opacity[1]) tool.opacity = toolLimits.opacity[1].toFixed(2);

	if (tool.width <= toolLimits.width[0]) tool.width = toolLimits.width[0]; else
	if (tool.width >= toolLimits.width[1]) tool.width = toolLimits.width[1];

	if (tool.shadow <= toolLimits.shadow[0]) tool.shadow = toolLimits.shadow[0]; else
	if (tool.shadow >= toolLimits.shadow[1]) tool.shadow = toolLimits.shadow[1];

	document.getElementById("tool-shadow-text").value = tool.shadow;
	document.getElementById("tool-width-text").value = tool.width;
	document.getElementById("tool-opacity-text").value = tool.opacity;

	if (document.getElementById("tool-width")) {
		document.getElementById("tool-shadow").value = tool.shadow;
		document.getElementById("tool-width").value = tool.width;
		document.getElementById("tool-opacity").value = tool.opacity;
	}

	cDrawEnd();
	var w = Math.max(tool.width, tools[1].width) + Math.max(tool.shadow, tools[1].shadow) * 2.5 + 7;
	context.putImageData(history.current(), 0, 0,
		parseInt(cursor.posX) - w / 2, parseInt(cursor.posY) - w / 2, w, w);
	cursor.draw();
}

function setTool(toolID) {
	if(toolID >= 0) {
		for (key in tool)
			tool[key] = toolPresets[toolID][key];
	}
	else if (toolID == 'swap') {
		var back = tools[0];
		tool = tools[0] = tools[1];
		tools[1] = back;
		updateColor(0,1);
	}
	else if (toolID == 'reset') {
		for (key in tool)
			tool[key] = toolPresets[0][key];
		for (key in tool)
			tools[1][key] = toolPresets[1][key];
		updateColor(tools[1].color, 1);
	}
	updateColor(tool.color);
	updateSliders();
}

function updateColor(value, toolIndex) {
	var t = tools[toolIndex || 0];
	var c = colorCodeElem;
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
		if (cursor.posX >= 0 && cursor.posX < cWidth &&
			cursor.posY >= 0 && cursor.posY < cHeight) {
			event.preventDefault();
			event.returnValue = false;
			if (cHotkeys(k)) {				
				hki = setInterval("cHotkeys(" + k + ")", 100);
			}
		}
	} else {
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
	if (param == "opacity")
		tools[id].opacity = (inc == 0 ? value : (parseFloat(tools[id].opacity) + inc)).toFixed(2);
	else
		tools[id][param] = (inc == 0 ? value : (tools[id][param] + inc));

	updateSliders();
}

function switchMode(mode) {
	if(document.getElementById(mode))
		document.getElementById(mode).className = (modes[mode] = !modes[mode]) ? "button-active" : "button";
	if (mode == "debug-mode") {
		debugElem.innerHTML = "";

		if (modes["debug-mode"])
			fpsi = setInterval("fpsCount()", 100);
		else
			clearInterval(fpsi);
	}

	if (mode == "tool-line") {		
		history.push();
		context.moveTo(cursor.posX + globalOffset, cursor.posY + globalOffset);
	}

	if (mode == "app-help") {		
		sideElem.style.display = modes["app-help"] ? "none" : "";
		helpElem.style.display = modes["app-help"] ? "" : "none";
	}

	if (mode == "app-compatible") {		
		cursor.hide();
	}

	if (!!window.localStorage)
		window.localStorage.modes = JSON.stringify(modes);
}

function picTransfer(value, auto) {
	var a = auto || false;
	switch (value) {
		case "send":
			if(sendButton)
				if (a || confirm("Вы уверены, что хотите загрузить изображение на сервер?")) {
					var imageToSend = document.createElement("input");
					var jpgData = canvas.toDataURL("image/jpeg");
					var pngData = canvas.toDataURL();
					imageToSend.value = (jpgData.length < pngData.length ? jpgData : pngData);
					imageToSend.name = "content";
					imageToSend.type = "hidden";
					sendForm.appendChild(imageToSend);
					sendForm.submit();
				}
		break;
		case "toJPG": picTab = window.open(canvas.toDataURL("image/jpeg"), "_blank"); break;
		case "toPNG": picTab = window.open(canvas.toDataURL(), "_blank"); break;
		case "toLS":
			if (a || confirm("Вы уверены, что хотите загрузить данные в Local Storage?")) {
				var jpgData = canvas.toDataURL("image/jpeg");
				var pngData = canvas.toDataURL();
				if(!!window.localStorage)
					window.localStorage.recovery = (jpgData.length < pngData.length ? jpgData : pngData);
				else if (!a)
					alert("Local Storage не поддерживается.");
			}
		break;
		case "fromLS":
			if (a || confirm("Вы уверены, что хотите загрузить данные из Local Storage?")) {
				var image = new Image();
				if (!!window.localStorage) {
					image.src = window.localStorage.recovery;
					context.drawImage(image, 0, 0);
					history.push();
				} else if (!a)
					alert("Local Storage не поддерживается.");
			}
		break;
		default: alert("Недопустимое значение (обновите кэш).");
	}
}

function fpsCount() {
	fps = ticks;
	ticks = 0;
}

function descKeyCode(k) {
	return (k & CTRL ? "Ctrl + ":"") + 
		(k & ALT ? "Alt + ":"") + 
		(k & META ? "Meta + ":"") + 
		(k & SHIFT ? "Shift + ":"") + 
		(kbDesc[k % 256] ? kbDesc[k % 256] : String.fromCharCode(k % 256));
}
