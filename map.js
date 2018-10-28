var canvas;
var context;
var lid = 1;
var centerX = 0;
var centerY = 0;
var centerRA = 0;
var centerDec = 0;
var centerDecSin = 0;
var centerDecCos = 0;
var currentRA = 0;
var currentDec = 0;
var touchRA = 0;
var touchDec = 0;
var currentX = 0;
var currentY = 0;
var currentScale = 1;
var maxMag = 0;
var clickRA = 0;
var clickDec = 0;
var clickId = 0;
var clickFlag = false;
var dragFlag = false;
var touchX = 0;
var touchY = 0;
var starText = "";
var RAD = Math.PI / 180;
var DEG = 180 / Math.PI;
var PI2 = Math.PI * 2;
var BETA = -1 / (2 * Math.sqrt(Math.PI));
var SCREEN_R = 500;
var GREEK = ["α","β","γ","δ","ε","ζ","η","θ","ι","κ","λ","μ","ν","ξ","ο","π","ρ","σ","τ","υ","φ","χ","ψ","ω"];
var CONSTELLATION_ABBR = ["And","Ant","Aps","Aql","Aqr","Ara","Ari","Aur","Boo","Cae","Cam","Cap","Car","Cas","Cen","Cep","Cet","Cha","Cir","CMa","CMi","Cnc","Col","Com","CrA","CrB","Crt","Cru","Crv","CVn","Cyg","Del","Dor","Dra","Equ","Eri","For","Gem","Gru","Her","Hor","Hya","Hyi","Ind","Lac","Leo","Lep","Lib","LMi","Lup","Lyn","Lyr","Men","Mic","Mon","Mus","Nor","Oct","Oph","Ori","Pav","Peg","Per","Phe","Pic","PsA","Psc","Pup","Pyx","Ret","Scl","Sco","Sct","Ser","Sex","Sge","Sgr","Tau","Tel","TrA","Tri","Tuc","UMa","UMi","Vel","Vir","Vol","Vul"];
var RGB = ["rgb(155,178,255)","rgb(178,197,255)","rgb(211,221,255)","rgb(233,236,255)","rgb(254,249,255)","rgb(255,243,234)","rgb(255,235,214)","rgb(255,229,198)","rgb(255,219,176)","rgb(255,213,161)","rgb(255,200,133)","rgb(255,183,101)","rgb(255,169,75)","rgb(255,149,35)","rgb(255,123,0)","rgb(255,82,0)"];
window.addEventListener("load",loadListener,false);

function setLanguage()
{
	var l = "";
	var ua = window.navigator.userAgent.toLowerCase();

	try
	{
		if(ua.indexOf('chrome') != -1)
		{
			l = (navigator.languages[0] || navigator.browserLanguage || navigator.language || navigator.userLanguage).substr(0, 2);
		}
		else
		{
			l = (navigator.browserLanguage || navigator.language || navigator.userLanguage).substr(0, 2);
		}
	}
	catch(e)
	{
		l = undefined;
	}

	if(l == 'ja')
	{
		lid = 2;
	}
}

function loadListener()
{
	var queue = null;
	canvas = document.getElementById("lower");
	var body = d3.select("body");
	body.on("click", clickBody);
	body.on("mousedown", touchBody);
	body.on("touchstart", touchBody);
	body.call(d3.behavior.zoom().scale(1).scaleExtent([1,1920000]).on("zoom", zoomBody));
	body.call(d3.behavior.drag().on("drag", dragBody));
	window.addEventListener("resize",function(){clearTimeout(queue);queue=setTimeout(function(){setCanvasSize();drawCanvas();drawUpperCanvas();},300);},false);
	setLanguage();
	setCanvasSize();
	drawCanvas();
}

function clickBody(d)
{
	if(dragFlag)
	{
		dragFlag = false;
	}
	else
	{
		var x = d3.mouse(this)[0];
		var y = d3.mouse(this)[1];
		currentX = x;
		currentY = y;
		setCurrentPoint();
		setNeighborhoodStarId();
		clickFlag = true;
		drawCanvas();
	}
}

function touchBody(d)
{
	touchX = d3.mouse(this)[0];
	touchY = d3.mouse(this)[1];
	touchRA = centerRA;
	touchDec = centerDec;
	clickFlag = false;
}

function dragBody(d)
{
	var x = d3.mouse(this)[0];
	var y = d3.mouse(this)[1];
	var dX = (x - touchX) * 0.2 / (currentScale * 0.5);
	var dY = (y - touchY) * 0.2 / (currentScale * 0.5);
	centerRA = dX + touchRA;
	centerDec = dY + touchDec;

	if(centerRA < 0)
	{
		centerRA += 360;
	}
	else if(centerRA >= 360)
	{
		centerRA -= 360;
	}

	if(centerDec < -90)
	{
		centerDec = -90;
	}
	else if(centerDec > 90)
	{
		centerDec = 90;
	}

	dragFlag = true;
	drawCanvas();
}

function zoomBody(d)
{
	currentScale = Math.pow(d3.event.scale, 1 / Math.PI);
	SCREEN_R = currentScale * 500;
	clickFlag = false;
	drawCanvas();
}

function setCanvasSize()
{
	var container = document.getElementById("canvasContainer");
	canvas.width = container.offsetWidth;
	canvas.height = container.offsetHeight;
	centerX = canvas.width / 2;
	centerY = canvas.height / 2;
}

function setCurrentPoint()
{
	var x = -1 * (currentX - canvas.width / 2);
	var y = -1 * (currentY - canvas.height / 2);
	var rho = Math.sqrt(x * x + y * y);
	var c = 2 * Math.atan(rho / SCREEN_R);
	var tanX = rho * Math.cos(centerDec * RAD) * Math.cos(c) - y * Math.sin(centerDec * RAD) * Math.sin(c);
	var tanY = x * Math.sin(c);
	currentRA = centerRA + DEG * Math.atan(tanY / tanX);
	currentDec = DEG * Math.asin(Math.cos(c) * Math.sin(centerDec * RAD) + y * Math.sin(c) * Math.cos(centerDec * RAD) / rho);

	if(tanX < 0)
	{
		currentRA += 180;
	}
	else if(tanX >= 0 && tanY < 0)
	{
		currentRA += 360;
	}

	if(currentRA >= 360)
	{
		currentRA -= 360;
	}
}

function setNeighborhoodStarId()
{
	var i = 0;
	var d = 0;
	var minD = 1000;
	var id = 0;

	for(i = 0; i < STAR.length; i++)
	{
		if(STAR[i][3] < maxMag && STAR[i][6] > 0 && STAR[i][6] < canvas.width && STAR[i][7] > 0 && STAR[i][7] < canvas.height)
		{
			d = Math.sqrt(Math.pow(STAR[i][6] - currentX, 2) + Math.pow(STAR[i][7] - currentY, 2));

			if(d < minD)
			{
				minD = d;
				id = i;
			}
		}
	}

	clickId = id;
	starText = "";

	for(i = 0; i < STAR_NAME.length; i++)
	{
		if(STAR[clickId][0] == STAR_NAME[i][0])
		{
			if(STAR_NAME[i][2] == 0)
			{
				if(STAR_NAME[i][3] == 0)
				{
					starText += STAR_NAME[i][4] + CONSTELLATION_ABBR[STAR_NAME[i][1] - 1] + " ";
				}
				else
				{
					starText += STAR_NAME[i][3] + CONSTELLATION_ABBR[STAR_NAME[i][1] - 1] + " ";
				}
			}
			else
			{
				starText += GREEK[STAR_NAME[i][2] - 1] + CONSTELLATION_ABBR[STAR_NAME[i][1] - 1] + " ";
				break;
			}
		}
	}
}

function drawCanvas()
{
	var i = 0;
	var j = 0;
	var k = 0;
	var l = 0;
	var n = 0;
	var x1 = 0;
	var x2 = 0;
	var y1 = 0;
	var y2 = 0;
	var RA = 0;
	var Dec = 0;
	var sinRA = 0;
	var cosRA = 0;
	var sinDec = 0;
	var cosDec = 0;
	maxMag = Math.log(currentScale) * 1.5 + 3.5;
	context = canvas.getContext("2d");
	context.fillStyle = "rgb(0,0,0)";
	context.fillRect(0, 0, canvas.width, canvas.height);
	centerDecSin = Math.sin(centerDec * RAD);
	centerDecCos = Math.cos(centerDec * RAD);
	context.lineWidth = 1;
	context.strokeStyle = "rgb(0,32,64)";

	for(i = 0; i < 360; i += 15)
	{
		RA = (i - centerRA) * RAD;
		sinRA = Math.sin(RA);
		cosRA = Math.cos(RA);

		for(j = -90; j < 90; j += 10)
		{
			Dec = j * RAD;
			sinDec = Math.sin(Dec);
			cosDec = Math.cos(Dec);
			k = getK(cosRA, sinDec, cosDec);
			x1 = getX(sinRA, cosDec, k); 
			y1 = getY(cosRA, sinDec, cosDec, k);
			Dec = (j + 10) * RAD;
			sinDec = Math.sin(Dec);
			cosDec = Math.cos(Dec);
			k = getK(cosRA, sinDec, cosDec);
			x2 = getX(sinRA, cosDec, k); 
			y2 = getY(cosRA, sinDec, cosDec, k);

			if(Math.abs(x2 - x1) < canvas.width && Math.abs(y2 - y1) < canvas.height)
			{
				context.beginPath();
				context.moveTo(x1, y1);
				context.lineTo(x2, y2);
				context.stroke();
			}
		}	
	}

	for(i = -80; i < 90; i += 10)
	{
		Dec = i * RAD;
		sinDec = Math.sin(Dec);
		cosDec = Math.cos(Dec);

		for(j = 0; j < 360; j += 5)
		{
			RA = (j - centerRA) * RAD;
			sinRA = Math.sin(RA);
			cosRA = Math.cos(RA);
			k = getK(cosRA, sinDec, cosDec);
			x1 = getX(sinRA, cosDec, k); 
			y1 = getY(cosRA, sinDec, cosDec, k);
			RA = (j + 5 - centerRA) * RAD;
			sinRA = Math.sin(RA);
			cosRA = Math.cos(RA);
			k = getK(cosRA, sinDec, cosDec);
			x2 = getX(sinRA, cosDec, k); 
			y2 = getY(cosRA, sinDec, cosDec, k);

			if(Math.abs(x2 - x1) < canvas.width && Math.abs(y2 - y1) < canvas.height)
			{
				context.beginPath();
				context.moveTo(x1, y1);
				context.lineTo(x2, y2);
				context.stroke();
			}
		}
	}

	for(i = 0; i < STAR.length; i++)
	{
		RA = (STAR[i][1] - centerRA) * RAD;
		sinRA = Math.sin(RA);
		cosRA = Math.cos(RA);
		Dec = STAR[i][2] * RAD;
		sinDec = Math.sin(Dec);
		cosDec = Math.cos(Dec);
		k = getK(cosRA, sinDec, cosDec);
		STAR[i][6] = getX(sinRA, cosDec, k);
		STAR[i][7] = getY(cosRA, sinDec, cosDec, k);

		if(STAR[i][3] < maxMag && STAR[i][6] > 0 && STAR[i][6] < canvas.width && STAR[i][7] > 0 && STAR[i][7] < canvas.height)
		{
			STAR[i][9] = true;
			STAR[i][8] = getStarR(STAR[i][3]);
		}
		else
		{
			STAR[i][9] = false;
		}
	}

	context.font = "10px Verdana";
	context.lineWidth = 2;
	context.strokeStyle = "rgb(51,51,51)";

	for(i = 0; i < CONSTELLATION_LINE.length; i++)
	{
		x1 = STAR[CONSTELLATION_LINE[i][0]][6];
		y1 = STAR[CONSTELLATION_LINE[i][0]][7];
		x2 = STAR[CONSTELLATION_LINE[i][1]][6];
		y2 = STAR[CONSTELLATION_LINE[i][1]][7];

		if(Math.abs(x2 - x1) < canvas.width && Math.abs(y2 - y1) < canvas.height)
		{
			context.beginPath();
			context.moveTo(x1, y1);
			context.lineTo(x2, y2);
			context.stroke();
		}
	}

	for(i = 0; i < STAR.length; i++)
	{
		if(STAR[i][9])
		{
			context.fillStyle = RGB[STAR[i][4] + 2];
			context.beginPath();
			context.arc(STAR[i][6], STAR[i][7], STAR[i][8], 0, PI2, false);
			context.fill();
		}
	}

	context.fillStyle = "rgb(0,153,153)";

	for(i = 0; i < STAR_PROPER_NAME.length; i++)
	{
		if(STAR[STAR_PROPER_NAME[i][0]][9])
		{
			context.fillText(STAR_PROPER_NAME[i][lid], STAR[STAR_PROPER_NAME[i][0]][6], STAR[STAR_PROPER_NAME[i][0]][7]);
		}
	}

	if(clickFlag)
	{
		context.strokeStyle = "rgb(0,255,0)";
		context.beginPath();
		context.arc(STAR[clickId][6], STAR[clickId][7], 5, 0, PI2, false);
		context.stroke();
		context.fillStyle = "rgb(0,255,0)";
		context.fillText(starText, STAR[clickId][6] + 5, STAR[clickId][7] + 10);
	}

	context.fillStyle = "rgb(255,255,255)";
	context.fillText("[" + strRA(centerRA) + ", " + strDec(centerDec) + ", x" + Math.round(currentScale * 10) / 10 + "]", 5, canvas.height - 10);
}

function getK(cosRA, sinDec, cosDec)
{
	return SCREEN_R / (1 + centerDecSin * sinDec + centerDecCos * cosDec * cosRA);
}

function getX(sinRA, cosDec, k)
{
	return -k * cosDec * sinRA + centerX;
}

function getY(cosRA, sinDec, cosDec, k)
{
	return -k * (centerDecCos * sinDec - centerDecSin * cosDec * cosRA) + centerY;
}

function getStarR(mag)
{
	return currentScale * Math.exp(mag * BETA) * 1.618;
}

function strRA(ra)
{
	var ret, h, m, s;
	ret = ra / 15;
	h = Math.floor(ret);
	m = 60 * (ret - h);
	s = 60 * (m - Math.floor(m));
	m = Math.floor(m);
	s = Math.floor(s);

	if(h < 10)
	{
		h = "0" + h;
	}

	if(m < 10)
	{
		m = "0" + m;
	}

	if(s < 10)
	{
		s = "0" + s;
	}

	ret = h + "h" + m + "m" + s + "s";

	return ret;
}

function strDec(dec)
{
	var ret, d, m, s;

	ret = dec;

	if(dec < 0)
	{
		ret *= -1;
	}

	d = Math.floor(ret);
	m = 60 * (ret - d);
	s = 60 * (m - Math.floor(m));
	m = Math.floor(m);
	s = Math.floor(s);

	if(dec < 0)
	{
		ret = "-";
	}
	else
	{
		ret = "+";
	}

	if(d < 10)
	{
		d = "00" + d;
	}
	else if(d < 100)
	{
		d = "0" + d;
	}

	if(m < 10)
	{
		m = "0" + m;
	}

	if(s < 10)
	{
		s = "0" + s;
	}

	ret += d + "\u00b0" + m + "\u2032" + s + "\u2033";

	return ret;
}