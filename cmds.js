const Sequelize = require('sequelize');
const {log, biglog, errorlog, colorize} = require("./out");
const {models} = require('./model');

exports.helpCmd = (socket,rl) => {
    log(socket,"Comandos:");
    log(socket,"  h|help - Muestra esta ayuda.");
    log(socket,"  list - Listar los quizzes existentes.");
    log(socket,"  show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
    log(socket,"  add - Añadir un nuevo quiz interactivamente.");
    log(socket,"  delete <id> - Borrar el quiz indicado.");
    log(socket,"  edit <id> - Editar el quiz indicado.");
    log(socket,"  test <id> - Probar el quiz indicado.");
    log(socket,"  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log(socket,"  credits - Créditos.");
    log(socket,"  q|quit - Salir del programa.");
    rl.prompt();
};


exports.listCmd = (socket, rl) => {
    models.quiz.findAll()
    .each(quiz => {
        log(socket,` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then( () =>{
        rl.prompt();
    })
};


const validateId = id =>{
  return new Promise ((resolve, reject) =>{
    if(typeof id === "undefined"){
      reject (new Error(`Falta elparámetro <id>.`));
    }else{
      id = parseInt(id);
      if(Number.isNaN(id)){
        reject(new Error (`Elvalor delparámetro <id> no es un número`));
      }else{
        resolve(id);
      }
    }
  });

};


exports.showCmd = (socket, rl, id) => {
    validateId(id)
    .then( id => models.quiz.findById(id))
    .then(quiz => {
        if (!quiz){
            throw new Error (`No existeun quiz asociado al id=${id}.`)
        }
        log(socket,`[${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
    })
    .catch(error => {
      errorlog(socket, error.message);
    })
    .then(() => {
      rl.prompt()
    })
};


// nuevocomando makeQuestion
//error: return new Sequelize.Promise(blablabla)
const makeQuestion = (rl,text) =>{
  return new Sequelize.Promise((resolve,reject) => {
    rl.question(colorize(text + ': ','red'),answer => {
      resolve(answer.trim());
    });

  });
};

// nuevo-acabadoS
exports.addCmd = (socket, rl) => {
  makeQuestion(rl,'Introduzca una pregunta: ')
  .then(q => {
    return makeQuestion (rl,'Introduzca la respuesta: ')
    .then(a => {
      return {question: q , answer: a};
    });
  })
  .then((quiz) => {
    log(socket, ` ${colorize('Se ha añadido','magenta')}: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`)
  })
  .catch(Sequelize.ValidationError, error => {
    errorlog(socket, 'El quiz es erroneo;');
    error.errors.forEach(({message}) => errorlog(socket, message));
  })
  .catch(error => {
    errorlog(socket,error.message);
  })
  .then(() => {
    rl.prompt();
  });

};


// nuevo- acabado
exports.deleteCmd = (socket,rl, id) => {
    validateId(id)
    .then(id => models.quiz.destroy({where: {id}}))
    .catch(error => {
      errorlog(socket, error.message);
    })
    .then(() => {
      rl.prompt();
    });
};


// nuevo- acabado
exports.editCmd = (socket, rl, id) => {
  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if (!quiz){
      throw new Error (`No existe un quiz asociado al id=${id}.`);
    }
    process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
    return makeQuestion(rl,' Introduzca la pregunta: ')
    .then ( q => {
      process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
      return makeQuestion(rl,' Introduzca la respuesta: ')
      .then(a => {
        quiz.question = q;
        quiz.answer = a;
        return quiz;
      });
    });
  })
  .then(quiz => {
    return quiz.save();
  })
  .then(quiz => {
    log(socket, `Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por : ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`)

  })
  .catch(Sequelize.ValidationError, error => {
    errorlog(socket, 'El quiz es erroneo:');
    error.errors.forEach(({message}) => errorlog(socket, message));
  })
  .catch(error => {
    errorlog(socket, error.message);
  })
  .then(() => {
    rl.prompt();
  });
};


  exports.testCmd = (socket, rl, id) => {
       if(typeof id ==="undefined"){
        errorlog (socket, `Falta el parametro id.`);
        rl.prompt();
       }else{
        let pregunta;
        models.quiz.findById(id)
        .then(quiz => {
          pregunta=quiz;
        })
        .then(()=>{
        makeQuestion(rl,pregunta.question)
        .then(answer => {
          answer= answer.toLowerCase().trim();
          if (answer === pregunta.answer.toLowerCase().trim()){                   
            log(socket, ` correct `);
            rl.prompt();
          }else{
            log(socket, "incorrect");
            rl.prompt();         
          }
        });
       })
       .catch(e =>{
        errorlog(socket, "Error" +e);
        rl.prompt();
       });
   }
  };


//CAMBIAR
exports.playCmd = (socket,rl) => {
     let score = 0;
     var i;
     let toBePlayed =[];
     
     const playOne = () =>{
      return new Promise (function (resolve,reject) {
      if(toBePlayed.length === 0){
      //Mensaje final del play
      log(socket,"Fin");
      log(socket,` No hay más preguntas`);
      log(socket,` Examen finalizado con : ${score} puntos`);
      biglog(socket,score, 'magenta');
      resolve();
      return;
      }

      let pos = Math.floor(Math.random()*(toBePlayed.length-1));
      let quiz = toBePlayed[pos];
      toBePlayed.splice(pos,1);
      
      makeQuestion(rl,quiz.question)
      .then(answer => {
        answer= answer.toLowerCase().trim();
        if (answer === quiz.answer.toLowerCase().trim()){
          score ++;                    
          log(socket,` correct `);
          log(socket,`Lleva  ${score}  aciertos`);
          resolve(playOne());
        }else{
          log(socket,"incorrect");
          log(socket,"Fin ");
          log (socket,"Aciertos: ");
          biglog(socket,`${score}`, 'magenta'); 
          resolve();         
        }
      });
    });
  }

    models.quiz.findAll({raw : true})
    .then(quizzes => {
      toBePlayed = quizzes;
    })
    .then(() => {
      return playOne();
    })
    .catch(e =>{
      errorlog(socket,"Error" +e);
    })
    .then(()=>{
      rl.prompt();
    });
};



exports.creditsCmd = (socket,rl) => {
    log(socket,'Autores de la práctica:');
    log(socket,'ANA DÍEZ', 'green');
    rl.prompt();
};



exports.quitCmd = rl => {
    rl.close();
};

