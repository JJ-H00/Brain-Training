(function () {
  function renderSchulteStage(state, elements, mode) {
    elements.stage.classList.add("mode-schulte");
    elements.stage.classList.remove("mode-reaction", "mode-focus");
    elements.focusTarget.classList.add("hidden");
    elements.focusTarget.classList.remove("alert");
    elements.distractorLayer.classList.add("hidden");
    elements.distractorLayer.innerHTML = "";
    elements.stimulus.classList.add("hidden");
    elements.schulteBoard.classList.remove("hidden");

    if (!state || !state.board) {
      elements.schulteBoard.innerHTML = "";
      return;
    }

    var fragment = document.createDocumentFragment();
    var clickedNumbers = state.clickedNumbers || [];

    state.board.forEach(function (number) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "schulte-cell";
      button.dataset.value = String(number);
      button.textContent = number;

      if (state.difficulty === "easy" && clickedNumbers.indexOf(number) !== -1) {
        button.classList.add("done");
      }

      fragment.appendChild(button);
    });

    elements.schulteBoard.innerHTML = "";
    elements.schulteBoard.style.setProperty("--grid-size", mode.gridSize);
    elements.schulteBoard.appendChild(fragment);
  }

  function shuffle(items) {
    var array = items.slice();
    for (var index = array.length - 1; index > 0; index -= 1) {
      var swapIndex = Math.floor(Math.random() * (index + 1));
      var temp = array[index];
      array[index] = array[swapIndex];
      array[swapIndex] = temp;
    }
    return array;
  }

  function createSchulteSession(options) {
    var mode = options.mode;
    var difficulty = options.difficulty;
    var onStimulus = options.onStimulus;
    var onStats = options.onStats;
    var onFeedback = options.onFeedback;
    var onSessionState = options.onSessionState;
    var onTimer = options.onTimer;
    var onRound = options.onRound;
    var onComplete = options.onComplete;
    var state = {
      running: false,
      timerTickId: null,
      startedAt: 0,
      nextNumber: 1,
      board: [],
      rounds: 0,
      hits: 0,
      misses: 0,
      falseAlarms: 0,
      targets: 0,
      reactionTimes: [],
      lastCorrectAt: 0,
      lastOutcome: "等待开始",
      clickedNumbers: []
    };

    function buildSnapshot() {
      var avgReaction = 0;
      if (state.reactionTimes.length) {
        avgReaction = Math.round(state.reactionTimes.reduce(function (sum, value) {
          return sum + value;
        }, 0) / state.reactionTimes.length);
      }

      return {
        rounds: state.rounds,
        targets: state.targets,
        hits: state.hits,
        misses: state.misses,
        falseAlarms: state.falseAlarms,
        hitRate: state.targets ? Math.round((state.hits / state.targets) * 100) : 0,
        missRate: state.targets ? Math.round((state.misses / state.targets) * 100) : 0,
        falseAlarmRate: (state.hits + state.falseAlarms) ? Math.round((state.falseAlarms / (state.hits + state.falseAlarms)) * 100) : 0,
        avgReaction: avgReaction,
        lastOutcome: state.lastOutcome,
        elapsedMs: state.startedAt ? Date.now() - state.startedAt : 0
      };
    }

    function stopTimers() {
      clearInterval(state.timerTickId);
    }

    function emitBoard() {
      onStimulus({
        board: state.board,
        nextNumber: state.nextNumber,
        clickedNumbers: state.clickedNumbers.slice(),
        difficulty: difficulty
      });
    }

    return {
      get running() {
        return state.running;
      },
      start: function start() {
        var numbers = [];
        for (var number = 1; number <= mode.maxNumber; number += 1) {
          numbers.push(number);
        }

        state.running = true;
        state.rounds = 1;
        state.hits = 0;
        state.misses = 0;
        state.falseAlarms = 0;
        state.targets = mode.maxNumber;
        state.reactionTimes = [];
        state.lastOutcome = "从 1 开始";
        state.clickedNumbers = [];
        state.board = shuffle(numbers);
        state.nextNumber = 1;
        state.startedAt = Date.now();
        state.lastCorrectAt = state.startedAt;

        onSessionState("running");
        onRound(state.rounds);
        onTimer(0);
        emitBoard();
        onStats(buildSnapshot());

        state.timerTickId = setInterval(function () {
          if (!state.running) {
            return;
          }
          onTimer(Date.now() - state.startedAt);
        }, 100);
      },
      stop: function stop(reason) {
        if (!state.running) {
          return;
        }
        state.running = false;
        stopTimers();
        onComplete(buildSnapshot(), reason || "stopped");
      },
      registerBoardClick: function registerBoardClick(value) {
        if (!state.running) {
          return;
        }

        var number = Number(value);
        if (number !== state.nextNumber) {
          state.falseAlarms += 1;
          state.lastOutcome = "错误点击";
          onStats(buildSnapshot());
          onFeedback({ type: "error", label: "错误" });
          return;
        }

        var now = Date.now();
        var reactionTime = Math.max(0, now - state.lastCorrectAt);
        state.hits += 1;
        state.reactionTimes.push(reactionTime);
        state.lastCorrectAt = now;
        state.lastOutcome = "正确 " + number;
        state.clickedNumbers.push(number);

        if (number === mode.maxNumber) {
          emitBoard();
          onStats(buildSnapshot());
          state.lastOutcome = "完成一轮";
          this.stop("finished");
          return;
        }

        state.nextNumber += 1;
        emitBoard();
        onStats(buildSnapshot());
      }
    };
  }

  window.FocusTrainerModes = window.FocusTrainerModes || {};
  window.FocusTrainerModes.schulte = {
    renderStage: renderSchulteStage
  };

  window.FocusTrainerSessions = window.FocusTrainerSessions || {};
  window.FocusTrainerSessions.createSchulteSession = createSchulteSession;
})();
