pulseaudio_bug = navigator.userAgent.indexOf("Linux")>0;

Songs = {
	Welcome: "egage",
	GameSelected: "CgC",
	Correct: "gCC",
	Wrong: "ec",
	Fail: "egec",
	Winner: "gggeCCC",
	HighBeep: "C",
	LowBeep: "c"
}

Som = {
	SampleRate: 8192,
	TickInterval: 20,
	currentNote: 0,
	isPlayingSong: false,
	songFinishedCallback: function() {},
	toneFinishedPlaying: function() {
		if (!Som.isPlayingSong)
			return;

		if (Som.currentNote >= Som.playQueue.length) {
			Som.currentNote = 0;
			Som.isPlayingSong = false;
			Som.playQueue = [];
			Som.songFinishedCallback();
			PB.enableKeyboard();
		} else {
			Som.playNote(Som.playQueue[Som.currentNote]);
			Som.currentNote++;
		}
	},
	playAndClearQueue: function() {
		Som.isPlayingSong = true;
		PB.disableKeyboard();
		Som.toneFinishedPlaying();
	},
	playSong: function(song, callback) {
		Som.songFinishedCallback = callback || function() {};
		Som.playQueue = [];
		for (note in song) {
			Som.playQueue.push(song[note]);
		}
		Som.playAndClearQueue();
	},
    encodeBase64: function(str) {
        var out, i, len;
        var c1, c2, c3;
        const base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

        len = str.length;
        i = 0;
        out = "";
        while(i < len) {
            c1 = str.charCodeAt(i++) & 0xff;
            if(i == len) {
                out += base64EncodeChars.charAt(c1 >> 2);
                out += base64EncodeChars.charAt((c1 & 0x3) << 4);
                out += "==";
                break;
            }
            c2 = str.charCodeAt(i++);
            if(i == len) {
                out += base64EncodeChars.charAt(c1 >> 2);
                out += base64EncodeChars.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
                out += base64EncodeChars.charAt((c2 & 0xF) << 2);
                out += "=";
                break;
            }
            c3 = str.charCodeAt(i++);
            out += base64EncodeChars.charAt(c1 >> 2);
            out += base64EncodeChars.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
            out += base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >>6));
            out += base64EncodeChars.charAt(c3 & 0x3F);
        }
        return out;
    },
    encode8BitAudio: function(data) {
		var n = data.length;
		var integer = 0, i;

		// 8-bit mono WAVE header template
		var header = "RIFF<##>WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00<##><##>\x01\x00\x08\x00data<##>";

		// Helper to insert a 32-bit little endian int.
		function insertLong(value) {
			var bytes = "";
			for (i = 0; i < 4; ++i) {
				bytes += String.fromCharCode(value % 256);
				value = Math.floor(value / 256);
			}
			header = header.replace('<##>', bytes);
		}

		insertLong(36 + n); // chunk size
		insertLong(Som.SampleRate); // sample rate
		insertLong(Som.SampleRate); // byte rate
		insertLong(n); // subchunk2 size

		// Output sound data
		for (var i = 0; i < n; ++i) {
			header += String.fromCharCode(data[i] * 255);
		}

		return 'data:audio/wav;base64,' + Som.encodeBase64(header);
    },
    newTone: function (f) {
        var audio = new Audio();
        const numberOfSamples = Math.ceil(Som.SampleRate * Som.TickInterval / 100);
        const dt = 1 / Som.SampleRate;
        var samples = [];
        for (var i = 0; i < numberOfSamples; ++i) {
	        const x = f * (i * dt);
	        const y = x - Math.floor(x);
					const envelope = Math.min(1, 5*(1 - i/numberOfSamples));
					//square wave
	        samples.push(envelope * !!(y >= 0.5));
					//sawtooth wave
	        //samples.push(envelope * y);
					//sine wawe
					//samples.push(envelope * (Math.sin(2*3.1415*x)/2.0 + 0.5));
        }

        audio.setAttribute("src", Som.encode8BitAudio(samples));

        if (!pulseaudio_bug){
          audio.addEventListener("ended", function() {
			      Som.toneFinishedPlaying();
		      }, false);
        }

        audio.autoplay = false;
        return function() {
          audio.load();
          audio.play();
          if (pulseaudio_bug){
            window.setTimeout("Som.toneFinishedPlaying()",300);
          }
        };
    },
	  NoteToToneTable: null,
    playNote: function (n) {

      console.log("NOTE: "+ n);

      //real note frequency values:
      const FREQ_C4 = 261.63;
      const FREQ_D4 = 293.66;
      const FREQ_E4 = 329.63;
      const FREQ_F4 = 349.23;
      const FREQ_Fsust4 = 369.994;
      const FREQ_G4 = 392.00;
      const FREQ_A4 = 440.00;
      const FREQ_B4 = 493.88;
      const FREQ_C5 = 523.25;
      const FREQ_Csust5 = 554.365;
      const FREQ_D5 = 587.33;		        
      const FREQ_E5 = 659.255;

		  if (!Som.NoteToToneTable) {
        if (PB.bugfix == false){
			    Som.NoteToToneTable = {
		            "c": Som.newTone(FREQ_D4),
		            "d": Som.newTone(FREQ_E4),
		            "e": Som.newTone(FREQ_Fsust4),
		            "f": Som.newTone(FREQ_G4),
		            "g": Som.newTone(FREQ_A4),
		            "a": Som.newTone(FREQ_B4),
		            "b": Som.newTone(FREQ_Csust5),
		            "C": Som.newTone(FREQ_D5),
		            "D": Som.newTone(FREQ_E5),
		            "p": function() {
						PB.delay(3, Som.toneFinishedPlaying);
					}
			    }
        } else {
			    Som.NoteToToneTable = {
		            "c": Som.newTone(FREQ_C4),
		            "d": Som.newTone(FREQ_D4),
		            "e": Som.newTone(FREQ_E4),
		            "f": Som.newTone(FREQ_F4),
		            "g": Som.newTone(FREQ_G4),
		            "a": Som.newTone(FREQ_A4),
		            "b": Som.newTone(FREQ_B4),
		            "C": Som.newTone(FREQ_C5),
		            "D": Som.newTone(FREQ_D5),
		            "p": function() {
						PB.delay(3, Som.toneFinishedPlaying);
					}
			    }
        }
	    }
      var tone = Som.NoteToToneTable[n];
      if (tone === undefined) {
          return;
      }
      tone();
    }
};

//------------------------------------------------------------------------------
Aritmetica = {
    firstRun: true,
    reset: function(possibleOperations) {
		  Aritmetica.possibleOperations = possibleOperations || "+-/*";
		  Aritmetica.points = 0;
      Aritmetica.currentQuestion = 0;
      Aritmetica.numQuestions = 10;
		  Aritmetica.showResultFlag = false;
		  Aritmetica.showOperatorFlag = true;

      if (Aritmetica.firstRun){
        Aritmetica.firstRun = false;
		    Som.playSong(Songs.GameSelected, function(){Aritmetica.advanceQuestion();});
      } else {
        Aritmetica.advanceQuestion();
      }
  	},
    oneLoopIteration: function() {
		if (!Prompt.done) {
			PB.prompt();
		} else {
			Aritmetica.answerQuestion(parseInt(Prompt.getInput(), 10) == Aritmetica.answer);
		}
	},
  answerQuestion: function(correct){
    if (correct){
      Aritmetica.correct();
    } else {
      Aritmetica.incorrect();
    };
  },
  incorrect: function(){
		Aritmetica.tries++;
		if (Aritmetica.tries >= 3) {
			Som.playSong(Songs.Fail);
			Aritmetica.showCorrectAnswer();
			Aritmetica.advanceQuestion();
		} else {
			Som.playSong(Songs.Wrong);
		}
  },
  correct: function(){
    Aritmetica.currentQuestion++;

		Som.playSong(Songs.Correct, function() {
			Aritmetica.points += PB.pointsByNumberOfTries(Aritmetica.tries);
      if (Aritmetica.currentQuestion < Aritmetica.numQuestions){
  			Aritmetica.advanceQuestion();
      } else {
        PB.delay(10, function(){//pequena pausa de 1 segundo. TODO: medir qual é o tempo correto
          PB.clearDisplay();
          PB.showNumberAtDigit(Aritmetica.points, 7);
          PB.blinkAll();
          Som.playSong(Songs.Winner); // TODO: play it faster!
          PB.delay(50, Aritmetica.reset); //this means 50 ticks, which is 5 seconds TODO: check correct timing
        });
      }
		});
  },
    showCorrectAnswer: function() {
        //PB.blinkDisplayAFewTimesBeforeResuming(Aritmetica.answer);
        if (Aritmetica.showOperator) {
			PB.setDisplay(Aritmetica.answer);
		} else {
			Aritmetica.showOperator();
		}
    },
    showOperator: function() {
		if (Aritmetica.showOperatorFlag) {
			switch(Aritmetica.operation) {
			case "*": PB.setSpecialDigit("x"); break;
			case "/": PB.setSpecialDigit("%"); break;
			default:
				PB.setSpecialDigit(Aritmetica.operation);
			}
		} else {
			PB.blinkSpecialDigit("#");
		}
	},
  buttonPress: function(b) {},
  buttonRelease: function(b) {},
  advanceQuestion: function() {
		PB.clearDisplay();
		Aritmetica.tries = 0;

    var forbiddenCombination=true;
    while (forbiddenCombination){
  		Aritmetica.operation = Aritmetica.possibleOperations[Math.round(Math.random() * (Aritmetica.possibleOperations.length - 1))];
		  Aritmetica.firstDigit = Math.round(Math.random() * 99);
		  Aritmetica.secondDigit = Math.round(Math.random() * 9);

  		forbiddenCombination = ((Aritmetica.operation == "/") && (Aritmetica.secondDigit == 0)) ||
                             ((Aritmetica.operation in ["-", "+"]) && (Aritmetica.secondDigit == 0)) ||
                             ((Aritmetica.operation in ["/", "*"]) && (Aritmetica.secondDigit == 1));
    }

		Aritmetica.firstDigit -= Aritmetica.firstDigit % Aritmetica.secondDigit;

		const operatorFunctionTable = {
			"+": function(a, b) { return a + b; },
			"-": function(a, b) { return a - b; },
			"/": function(a, b) { return a / b; },
			"*": function(a, b) { return a * b; }
		};
		Aritmetica.answer = operatorFunctionTable[Aritmetica.operation](Aritmetica.firstDigit, Aritmetica.secondDigit);

    PB.showNumberAtDigit(Aritmetica.firstDigit, 2);
    PB.showNumberAtDigit(Aritmetica.secondDigit, 4);
		if (Aritmetica.showResultFlag) {
        PB.showNumberAtDigit(Aritmetica.answer, 7);
		}

		Aritmetica.showOperator();
		PB.setSpecialDigit2("=");

  }
};

//------------------------------------------------------------------------------
Adicao = {
    reset: function() {
		PB.clearDisplay();
		Aritmetica.reset("+");
    },
    oneLoopIteration: Aritmetica.oneLoopIteration,
    buttonPress: Aritmetica.buttonPress,
    buttonRelease: Aritmetica.buttonRelease
};

//------------------------------------------------------------------------------
Subtracao = {
    reset: function() {
		PB.clearDisplay();
		Aritmetica.reset("-");
    },
    oneLoopIteration: Aritmetica.oneLoopIteration,
    buttonPress: Aritmetica.buttonPress,
    buttonRelease: Aritmetica.buttonRelease
};

//------------------------------------------------------------------------------
Multiplicacao = {
    reset: function() {
		PB.clearDisplay();
		Aritmetica.reset("*");
    },
    oneLoopIteration: Aritmetica.oneLoopIteration,
    buttonPress: Aritmetica.buttonPress,
    buttonRelease: Aritmetica.buttonRelease
};

//------------------------------------------------------------------------------
Divisao = {
    reset: function() {
		PB.clearDisplay();
		Aritmetica.reset("/");
    },
    oneLoopIteration: Aritmetica.oneLoopIteration,
    buttonPress: Aritmetica.buttonPress,
    buttonRelease: Aritmetica.buttonRelease
};

//------------------------------------------------------------------------------
Operacao = {
    reset: function() {
		PB.clearDisplay();
		Aritmetica.reset();
    Aritmetica.showOperatorFlag = false;
		Aritmetica.showResultFlag = true;		
	},
    oneLoopIteration: function() {},
    buttonPress: function(b) {
		switch (b) {
		case "+":
		case "-":
		case "*":
		case "/":
      Aritmetica.answerQuestion(b == Aritmetica.operation);
			break;
		default:
			PB.highBeep();
		}
	},
    buttonRelease: function() {},
};

//------------------------------------------------------------------------------
SigaMe = {
    reset: function() {
		PB.clearDisplay();
		SigaMe.guessIndex = 0;
		SigaMe.sequence = [];
		Som.playSong(Songs.GameSelected, function() {
			SigaMe.addRandomNote();
		});
	},
	addRandomNote: function() {
		SigaMe.sequence.push(Math.round(Math.random() * 9));
		SigaMe.playSequence();
	},
	oneLoopIteration: function() {},
	playSequence: function() {
		for (var i=0; i<SigaMe.sequence.length; i++) {
			Som.playNote("cdefgabCDE"[SigaMe.sequence[i]]);
			PB.clearDisplay();
			PB.setDigit(7, SigaMe.sequence[i]);
		}
	},
	buttonPress: function(b) {
		if (b in ["0","1","2","3","4","5","6","7","8","9"]) {
			if (SigaMe.guessIndex < SigaMe.sequence.length) {
				if (b == SigaMe.sequence[SigaMe.guessIndex]) {
					if (SigaMe.sequence.length == 15) {
						Som.playSong(Songs.Winner, function() {
							SigaMe.reset();
						});
						return;
					}
					Som.playNote(b);
					PB.setDigit(7, b);
					SigaMe.guessIndex++;
				} else {
					Som.playSong(Songs.Wrong, function() {
						PB.delay(1, function() {
							SigaMe.playSequence();
							SigaMe.guessIndex = 0;
						});
					});
				}
			} else {
				SigaMe.addRandomNote();
				SigaMe.guessIndex=0;
			}
		}
	},
	buttonRelease: function() {},
};

//------------------------------------------------------------------------------
MemoriaTons = {
	reset: function() {
		PB.clearDisplay();
		Som.playSong(Songs.GameSelected);
	},
	oneLoopIteration: function() {},
	buttonPress: function(b) {
		if (b == 'ENTER') {
			Som.playAndClearQueue();
			return;
		}
		const buttonToNoteTable = {
			"0": "p", "1": "c", "2": "d", "3": "e",
			"4": "f", "5": "g", "6": "a", "7": "b",
			"8": "C", "9": "D"
		};
		var note = buttonToNoteTable[b];
		if (note === undefined) {
			PB.lowBeep();
			return;
		}
		Som.playQueue.push(note);
		Som.playNote(note);
	},
	buttonRelease: function(b) {}
};

//------------------------------------------------------------------------------
AdivinheONumero = {
    doMeio:false,
    maxtries:10,
    reset: function() {
		PB.clearDisplay();
		AdivinheONumero.points = 0;
		Som.playSong(Songs.GameSelected, function() {
			AdivinheONumero.advanceQuestion();
		});
	},
	advanceQuestion: function() {
		PB.clearDisplay();
		AdivinheONumero.firstDigit = Math.round(Math.random() * 50);
		AdivinheONumero.secondDigit = AdivinheONumero.firstDigit + Math.round(Math.random() * 47) + 2;

    if (AdivinheONumero.doMeio)
  		AdivinheONumero.answer = Math.round((AdivinheONumero.firstDigit + AdivinheONumero.secondDigit) / 2);
    else
  		AdivinheONumero.answer = AdivinheONumero.firstDigit + Math.round(Math.random() * (AdivinheONumero.secondDigit - AdivinheONumero.firstDigit));

		AdivinheONumero.tries = 0;
		PB.showNumberAtDigit(AdivinheONumero.firstDigit, 2);
		PB.showNumberAtDigit(AdivinheONumero.secondDigit, 6);
		console.log(AdivinheONumero.firstDigit + " - " + AdivinheONumero.answer + " - " + AdivinheONumero.secondDigit);
	},
	showAnswer: function(s) {
		PB.clearDisplay();
		Som.playSong(s, function() {
			PB.setSpecialDigit("~");
			PB.setSpecialDigit2("-");
			PB.showNumberAtDigit(AdivinheONumero.firstDigit, 2);
			PB.showNumberAtDigit(AdivinheONumero.secondDigit, 6);
			PB.showNumberAtDigit(AdivinheONumero.answer, 4);
			PB.delay(20, function() {
				PB.clearDisplay();
				PB.delay(3, AdivinheONumero.advanceQuestion);
			});
		});
	},
    oneLoopIteration: function() {
		if (!Prompt.done) {
			PB.prompt(4, 2);
		} else {
      var guess = Prompt.getInput();
      if (guess != AdivinheONumero.answer) {
        if (!AdivinheONumero.doMeio){
          if (guess < AdivinheONumero.answer)
            AdivinheONumero.firstDigit = guess;
          else
            AdivinheONumero.secondDigit = guess;

		      PB.showNumberAtDigit(AdivinheONumero.firstDigit, 2);
		      PB.showNumberAtDigit(AdivinheONumero.secondDigit, 6);
		      console.log(AdivinheONumero.firstDigit + " - " + AdivinheONumero.answer + " - " + AdivinheONumero.secondDigit);
        }

			  AdivinheONumero.tries++;
			  if (AdivinheONumero.tries < AdivinheONumero.maxtries) {
				  Som.playSong(Songs.Wrong);
				  return;
			  }
			  AdivinheONumero.showAnswer(Songs.Fail);
		  } else {
			  AdivinheONumero.showAnswer(Songs.Correct);
			  AdivinheONumero.points += PB.pointsByNumberOfTries(AdivinheONumero.tries);
		  }
    }
	},
    buttonPress: function() {},
    buttonRelease: function() {},
};

//------------------------------------------------------------------------------
NumeroDoMeio = {
    reset: function() {
      AdivinheONumero.doMeio=true;
      AdivinheONumero.maxtries=3;
		  AdivinheONumero.reset();
    },
    oneLoopIteration: AdivinheONumero.oneLoopIteration,
    buttonPress: AdivinheONumero.buttonPress,
    buttonRelease: AdivinheONumero.buttonRelease
};

//------------------------------------------------------------------------------
Livro = {
    StateChoosingBook: 0,
    StateQuestioning: 1,
    reset: function() {
		Som.playSong(Songs.GameSelected);
		Livro.state = Livro.StateChoosingBook;
    },
    oneLoopIteration: function() {
		switch (Livro.state) {
		case Livro.StateChoosingBook:
			if (!Prompt.done) {
				PB.clearDisplay(); //TODO: PB.blinkDisplay("      -");
				PB.prompt();
			} else {
				var book = parseInt(Prompt.getInput());
				console.log("Selected book: " + book);
				if (book > 0 && book < 999) {
					Livro.book = book;
					Livro.question = 0;
					Livro.tries = 0;
					Livro.points = 0;
					Livro.state = Livro.StateQuestioning;

					Livro.advanceQuestion();
				}
			}
		break;
		case Livro.StateQuestioning:
      PB.showNumberAtDigit(Livro.question, 3);
      for (var i=4;i<=7; i++)
        PB.blinkDigit(i, "_");
		}
	},
    showCorrectAnswer: function() {
        console.log("The correct answer was: " + Livro.getCorrectAnswer());
    },
	advanceQuestion: function() {
		if (Livro.question >= 0) {
			Livro.points += PB.pointsByNumberOfTries(Livro.tries);
		}
		Livro.tries = 0;
		Livro.question++;
	},
    getCorrectAnswer: function() {
        const answerPattern = "CDDBAADCBDAADCBB";
        return answerPattern[(Livro.book + Livro.question) & 15];
    },
    buttonPress: function(b) {
        switch (Livro.state) {
        case Livro.StateChoosingBook:
            break;
        case Livro.StateQuestioning:
            switch (b) {
            case "A":
            case "B":
            case "C":
            case "D":
                if (Livro.getCorrectAnswer(b) == b) {
                    Livro.advanceQuestion();
                    return;
                }
                Livro.tries++;
                if (Livro.tries >= 3) {
                    Livro.showCorrectAnswer();
                    Livro.advanceQuestion();
                }
                break;
            default:
                PB.lowBeep();
            }
            break;
        }
    },
    buttonRelease: function(b) {}
}

//------------------------------------------------------------------------------
Welcome = {
	reset: function() {
		PB.clearDisplay();
		PB.blinkSpecialDigit("*");
		Som.playSong(Songs.Welcome);
	},
    oneLoopIteration: function() {},
    buttonPress: function(b) {
		  const newActivity = PB.buttonToTable[b];
		  if (newActivity === undefined) {
        PB.lowBeep();
			  return;
		  }
		  PB.setActivity(newActivity);
    },
    buttonRelease: function(b) {}
};

//------------------------------------------------------------------------------
Standby = {
	reset: function() {
		PB.clearDisplay();
		PB.disableKeyboard();
	},
	oneLoopIteration: function() {},
	buttonPress: function(b) {},
	buttonRelease: function(b) {}
};

//------------------------------------------------------------------------------
Prompt = {
	maxDigitSize: 3,
	initialDigit: 7,
	reset: function() {
		Prompt.done = false;
		Prompt.input = "   ";
		PB.clearDisplay(Prompt.initialDigit - Prompt.maxDigitSize + 1, Prompt.initialDigit);
		if (Prompt.initialDigit == 4 && Prompt.maxDigitSize == 2) {
			PB.setSpecialDigit(" ");
			PB.setSpecialDigit2(" ");
		}
		PB.blinkDigit(Prompt.initialDigit, "-");
	},
	getInput: function() {
		const value = Prompt.input;
		Prompt.reset();
		return value;
	},
	ready: false,
	oneLoopIteration: function() {},
	redrawPrompt: function() {
		PB.showNumberAtDigit(Prompt.input, Prompt.initialDigit);
	},
	buttonPress: function(b) {
		if (b == "ENTER") {
			Prompt.done = true;
			PB.activity = PB.previousActivity;
			return;
		}
		if (b in ["0","1","2","3","4","5","6","7","8","9"]) {
			PB.lowBeep();
			PB.disableBlink();
			if (Prompt.initialDigit == 4 && Prompt.maxDigitSize == 2) {
				PB.setSpecialDigit("~");
				PB.setSpecialDigit2("-");
			}
			switch (Prompt.maxDigitSize) {
			case 1: Prompt.input = b; break;
			case 2: Prompt.input = Prompt.input[1] + b; break;
			default: Prompt.input = Prompt.input[1] + Prompt.input[2] + b; break;
			}
			Prompt.redrawPrompt();
		} else {
			//blink and HighBeep
			PB.highBeep();
		}
	},
	buttonRelease: function(b) {}
};

//------------------------------------------------------------------------------
PB = {
  bugfix: false, /* we are simulating all the bugs from the original machine */
  activity: null,
  ticks: 0,
  delayTable: {},
  keyboardEnabled: true,
  displayOnPhase: true,
  init: function() {
    PB.setActivity(Standby);
    PB.reset();
    setInterval('PB.oneLoopIteration()', 100);
  },
  reset: function() {
	PB.delayTable = {};
	PB.enableKeyboard();
	PB.ticks = 0;
    if (PB.activity) {
      PB.activity.reset();
    }
  },
	delay: function(ticks, callback) {
		PB.delayTable[PB.ticks + ticks] = callback;
	},
  oneLoopIteration: function() {
    ++PB.ticks;

    if (PB.ticks%10<3){
	  if (!PB.displayOnPhase) {
	      for (var d=0; d<7; d++){
	        if (PB.blinkTable[d]) PB.setDigit(d+1, " ", true);
	      }
	      if (PB.blinkTable[7]) PB.setSpecialDigit(" ", true);
	      if (PB.blinkTable[8]) PB.setSpecialDigit2(" ", true);
		  PB.displayOnPhase = true;
	   }
    } else {
	  if (PB.displayOnPhase) {
	      for (var d=0; d<7; d++){
	        if (PB.blinkTable[d]) PB.setDigit(d+1, PB.displayContents[d], true);
	      }
	      if (PB.blinkTable[7]) PB.setSpecialDigit(PB.displayContents[7], true);
	      if (PB.blinkTable[8]) PB.setSpecialDigit2(PB.displayContents[8], true);
	      PB.displayOnPhase = false;
      }
    }

    for (var delay in PB.delayTable) {
		  if (PB.ticks >= delay) {
			  PB.delayTable[delay]();
			  delete PB.delayTable[delay];
		  }
	  }
    if (PB.activity) {
      PB.activity.oneLoopIteration();
    }
  },
  setActivity: function(m) {
    PB.activity = m;
    PB.reset();
  },
	prompt: function(initialDigit, maxDigitSize) {
		Prompt.initialDigit = initialDigit || 7;
		Prompt.maxDigitSize = maxDigitSize || 3;
		PB.previousActivity = PB.activity;
		PB.setActivity(Prompt);
	},
  getActivity: function(){
    for (i in PB.buttonToTable){
      if (PB.activity==PB.buttonToTable[i]) return i;
    }
    if (PB.activity==Welcome) return "Welcome";
    if (PB.activity==Standby) return "Standby";
    if (PB.activity==Prompt) return "Prompt)";

    return "Invalid Activity";
  },
  buttonPress: function(b) {
      switch (b) {
      case 'LIGA': PB.setActivity(Welcome); return;
      case 'DESL': PB.setActivity(Standby); return;
      default:
        if (PB.keyboardEnabled && PB.activity) {
            console.log("atividade atual: "+PB.getActivity()+" | botao: "+b);
            if ((PB.activity!=Welcome) && (b in PB.buttonToTable)) {
                PB.highBeep();
                return;
            }
            console.log("repassando o buttonpress para a atividade atual");            
            PB.activity.buttonPress(b);
          }
        }
    },
    enableKeyboard: function() {
		PB.keyboardEnabled = true;
	},
	disableKeyboard: function() {
		PB.keyboardEnabled = false;
	},
    buttonRelease: function(b) {
        if (b == 'LIGA' || b == 'DESL') {
            return;
        }
        if (PB.keyboardEnabled && PB.activity) {
            PB.activity.buttonRelease(b);
        }
    },
    buttonToTable: {
        "ADIVINHE-O-NÚMERO": AdivinheONumero,
        "ADIÇÃO": Adicao,
        "MULTIPLICAÇÃO": Multiplicacao,
        "DIVISÃO": Divisao,
        "ARITMÉTICA": Aritmetica,
        "OPERAÇÃO": Operacao,
        "SIGA-ME": SigaMe,
        "MEMÓRIA-TONS": MemoriaTons,
        "NÚMERO-DO-MEIO": NumeroDoMeio,
        "SUBTRAÇÃO": Subtracao,
        "LIVRO": Livro,
    },
    lowBeep: function() {
        Som.playNote(Songs.LowBeep);
    },
    highBeep: function() {
        Som.playNote(Songs.HighBeep);
    },
    SpecialFontTable: {
		" ": [[0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0]],
		"+": [[0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 1, 0, 0, 1, 0, 0]],
		"-": [[0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 0]],
		"~": [[0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1]],
		"*": [[0, 0, 0, 0, 0, 0, 1, 0], [1, 1, 1, 1, 1, 1, 0, 0]],
		"x": [[0, 0, 0, 0, 0, 0, 0, 0], [1, 1, 0, 1, 1, 0, 0, 0]],
		"%": [[0, 0, 0, 0, 0, 0, 1, 1], [0, 0, 0, 0, 0, 0, 1, 0]],
		"#": [[0, 0, 0, 0, 0, 0, 1, 1], [1, 1, 1, 1, 1, 1, 1, 0]]
	},
	FontTable: {
		"0": [1, 1, 1, 1, 1, 1, 0],
		"1": [1, 1, 0, 0, 0, 0, 0],
		"2": [1, 0, 1, 1, 0, 1, 1],
		"3": [1, 1, 1, 0, 0, 1, 1],
		"4": [1, 1, 0, 0, 1, 0, 1],
		"5": [0, 1, 1, 0, 1, 1, 1],
		"6": [0, 1, 1, 1, 1, 1, 1],
		"7": [1, 1, 0, 0, 0, 1, 0],
		"8": [1, 1, 1, 1, 1, 1, 1],
		"9": [1, 1, 1, 0, 1, 1, 1],
		"-": [0, 0, 0, 0, 0, 0, 1],
		"_": [0, 0, 1, 0, 0, 0, 0],
		" ": [0, 0, 0, 0, 0, 0, 0],
		"a": [1, 1, 0, 1, 1, 1, 1],
		"b": [0, 1, 1, 1, 1, 0, 0],
		"c": [0, 0, 1, 1, 1, 1, 0],
		"d": [0, 0, 0, 0, 0, 0, 0],
		"e": [0, 0, 0, 0, 0, 0, 0],
		"f": [0, 0, 0, 0, 0, 0, 0],
		"*": [0, 0, 0, 0, 0, 0, 1],
	},
    setSegmentById: function(id, state) {
        var s = document.getElementById(id);
        s.setAttribute('visibility', state ? 'hidden' : 'visible');
    },
    setSegment: function(i, seg, state) {
        PB.setSegmentById("d" + i + "_" + seg, state);
    },
	clearDisplay: function(begin, end) {
		begin = begin || 1;
		end = end || 7;

		for (var i = begin; i <= end; ++i) {
			PB.setDigit(i, ' ');
		}

		PB.setSpecialDigit(" ");
		PB.setSpecialDigit2(" ");
    PB.disableBlink();
	},
  blinkTable: [false, false, false, false, false, false, false, false, false],
  disableBlink: function(){
    PB.blinkTable = [false, false, false, false, false, false, false, false, false];
	},
  blinkAll: function(){
    PB.blinkTable = [true, true, true, true, true, true, true, true, true];
	},
	blinkDigit: function(which, c){
    if (c) PB.setDigit(which, c);
    PB.blinkTable[which-1]=true;    
  },
	blinkSpecialDigit: function(c){
    if (c) PB.setSpecialDigit(c);
    PB.blinkTable[7]=true;    
  },
	blinkSpecialDigit2: function(c){
    if (c) PB.setSpecialDigit2(c);
    PB.blinkTable[8]=true;
  },
	stopBlinking: function(which){
    PB.blinkTable[which-1]=false;    
  },
	setDisplay: function(c) {
		for (var i = 1; i <= 7; ++i) {
			PB.setDigit(i, c[i - 1]);
		}
	},
  displayContents: ["?","?","?","?","?","?","?","?","?"],
  setDigit: function(i, c, tmp) {
    if (tmp === undefined){
      PB.displayContents[i-1]=c;
    }

		var state = PB.FontTable[c];
		if (state === undefined) {
			state = PB.FontTable[' '];
		}
		for (var segment = 1; segment <= 7; segment++) {
			PB.setSegment(i, "abcdefg"[segment - 1], state[segment - 1]);
		}
	},
	showNumberAtDigit: function(n, d) {
		if (typeof(n) == "string") {
			if (n.length == 1) {
				PB.setDigit(d, n[0]);
			} else if (n.length == 2) {
				PB.setDigit(d, n[1]);
				PB.setDigit(d - 1, n[0]);
			} else {
				PB.setDigit(d, n[2]);
				PB.setDigit(d - 1, n[1]);
				PB.setDigit(d - 2, n[0]);
			}
		} else {
			if (n < 10) {
				PB.setDigit(d, n);
			} else if (n < 100) {
				PB.setDigit(d, n % 10);
				PB.setDigit(d - 1, ~~(n / 10) % 10);
			} else {
				PB.setDigit(d, n % 10);
				PB.showNumberAtDigit(~~(n / 10), d - 1);
			}			
		}
	},
  setSpecialDigit: function(c, tmp) {
    if (tmp === undefined){
      PB.displayContents[7]=c;
    }

		if (c in PB.FontTable) {
			PB.setDigit(3, c);
		}

		var state = PB.SpecialFontTable[c];
		if (state === undefined) {
			state = PB.SpecialFontTable[' '];
		}
		for (var segment = 1; segment <= 8; segment++) {
			PB.setSegment("3", "abcdefgh"[segment - 1], state[0][segment - 1]);
			PB.setSegment("8", "abcdefgh"[segment - 1], state[1][segment - 1]);
		}
    },
  setSpecialDigit2: function(c, tmp) {
    if (tmp === undefined){
      PB.displayContents[8]=c;
    }

		if (c == "=") {
			PB.setSegmentById("igual", true);
			PB.setSegmentById("igual2", true);
			return;
		}

		if (c == "-") {
			PB.setSegmentById("igual", true);
			PB.setSegmentById("igual2", false);
			return;
		}

		PB.setSegmentById("igual", false);
		PB.setSegmentById("igual2", false);
	},
  pointsByNumberOfTries: function(t) {
		switch (t) {
			case 0: return 10;
			case 1: return 6;
			case 2: return 4;
		}
		return 0;
    }
};

document.onkeydown = function(event) {
	const EnterKey = 13
	const PauseKey = 19
	const EscKey = 27
	const PKey = 80
	const ZeroKey = 48;
	const NineKey = 57;

	if (event.which >= ZeroKey && event.which <= NineKey) {
		PB.buttonPress(event.which - ZeroKey);
	}

	switch(event.which) {
	case EnterKey: PB.buttonPress("ENTER"); break;
	case PKey: /* fallthrough */
	case PauseKey: PB.buttonPress("PAUSE"); break;
	case EscKey: PB.buttonPress("DESL"); break;
	}
}

//If we want to fix bugs found on the original machine
// then uncomment the following line:
//PB.bugfix = true;
