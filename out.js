const figlet = require('figlet');
const chalk = require('chalk');

// Colorear un string
const colorize= (msg, color)=>{
  if(typeof color !== "undefined"){
     msg = chalk[color].bold(msg);
  }
  return msg;
};

// Escribir un mensaje log.
const log = (msg, color)=>{
  console.log(colorize(msg,color));
};

// Escribe un mensaje de log grande.
const biglog= (msg, color)=>{
  log(figlet.textSync(msg,{horizontalLayout: 'full'}),color);
};

// Escribe mensaje de error.
const errorlog = (emsg) =>{
  console.log(`${colorize("Error","red")}: ${colorize(colorize(emsg,"red"),"bgYellowBright")}`);
};

exports = module.exports = {
	colorize,
	log,
	biglog,
	errorlog
};