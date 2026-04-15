(function () {
  var config = window.FocusTrainerConfig;
  var statsModule = window.FocusTrainerStats;
  var engineModule = window.FocusTrainerEngine;
  var modeRenderers = window.FocusTrainerModes;

  var elements = {
    modeList: document.getElementById("mode-list"),
    startButton: document.getElementById("start-button"),
    stopButton: document.getElementById("stop-button"),
    modeHint: document.getElementById("mode-hint"),
    stageTitle: document.getElementById("stage-title"),
    stage: document.getElementById("stage"),
    stageOverlay: document.getElementById("stage-overlay"),
    stimulus: document.getElementById("stimulus"),
    focusCross: document.getElementById("focus-cross"),
    focusTarget: document.getElementById("focus-target"),
    distractorLayer: document.getElementById("distractor-layer"),
    timerLabel: document.getElementById("timer-label"),
    streakLabel: document.getElementById("streak-label"),
    responseLabel: document.getElementById("response-label"),
    targetRule: document.getElementById("target-rule"),
    hitRate: document.getElementById("hit-rate"),
    missRate: document.getElementById("miss-rate"),
    falseRate: document.getElementById("false-rate"),
    avgReaction: document.getElementById("avg-reaction"),
    sessionState: document.getElementById("session-state")
  };

  var selectedMode = config.modes.reaction;
  var currentEngine = null;
  var currentStats = null;

  function formatTime(ms) {
    var totalSeconds = Math.ceil(ms / 1000);
    var minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    var seconds = String(totalSeconds % 60).padStart(2, "0");
    return minutes + ":" + seconds;
  }

  function setOverlay(title, copy) {
    elements.stageOverlay.innerHTML =
      "<div><p class='overlay-title'>" + title + "</p><p class='overlay-copy'>" + copy + "</p></div>";
    elements.stageOverlay.classList.remove("hidden");
  }

  function hideOverlay() {
    elements.stageOverlay.classList.add("hidden");
  }

  function renderModeSelector() {
    elements.modeList.innerHTML = "";

    Object.keys(config.modes).forEach(function (modeKey) {
      var mode = config.modes[modeKey];
      var button = document.createElement("button");
      button.type = "button";
      button.className = "mode-button" + (mode.id === selectedMode.id ? " active" : "");
      button.innerHTML = "<strong>" + mode.name + "</strong><span>" + mode.shortDescription + "</span>";
      button.addEventListener("click", function () {
        if (currentEngine && currentEngine.running) {
          return;
        }
        selectedMode = mode;
        renderModeSelector();
        syncModeText();
        renderIdleStage();
      });
      elements.modeList.appendChild(button);
    });
  }

  function syncModeText() {
    elements.stageTitle.textContent = selectedMode.name;
    elements.modeHint.textContent = selectedMode.instructions;
    elements.targetRule.textContent = selectedMode.targetRule;
  }

  function updateStats(snapshot) {
    elements.hitRate.textContent = snapshot.hitRate + "%";
    elements.missRate.textContent = snapshot.missRate + "%";
    elements.falseRate.textContent = snapshot.falseAlarmRate + "%";
    elements.avgReaction.textContent = snapshot.avgReaction + " ms";
    elements.responseLabel.textContent = snapshot.lastOutcome;
  }

  function updateSessionState(state) {
    elements.sessionState.textContent =
      state === "running" ? "进行中" : (state === "finished" ? "已完成" : "未开始");
    elements.sessionState.className = "status-pill " + state;
  }

  function renderIdleStage() {
    modeRenderers[selectedMode.id].renderStage(null, elements, selectedMode);
    setOverlay("准备开始", selectedMode.instructions);
    elements.timerLabel.textContent = formatTime(config.sessionDurationMs);
    elements.streakLabel.textContent = "轮次 0";
  }

  function startSession() {
    currentStats = statsModule.createStatsTracker();
    updateStats(currentStats.getSnapshot());
    syncModeText();
    hideOverlay();

    currentEngine = new engineModule.StimulusEngine({
      mode: selectedMode,
      stats: currentStats,
      onStimulus: function (trial) {
        modeRenderers[selectedMode.id].renderStage(trial, elements, selectedMode);
      },
      onStats: updateStats,
      onSessionState: updateSessionState,
      onTimer: function (remainingMs) {
        elements.timerLabel.textContent = formatTime(remainingMs);
      },
      onRound: function (roundNumber) {
        elements.streakLabel.textContent = "轮次 " + roundNumber;
      },
      onComplete: function (snapshot, reason) {
        elements.startButton.disabled = false;
        elements.stopButton.disabled = true;
        renderIdleStage();

        if (reason === "finished") {
          setOverlay(
            "本轮结束",
            "命中率 " + snapshot.hitRate + "% ，误触率 " + snapshot.falseAlarmRate + "% ，平均反应 " + snapshot.avgReaction + " ms。"
          );
        } else {
          setOverlay("已停止训练", "你可以切换模式后重新开始，继续验证哪种玩法更容易让人完成一轮。");
        }
      }
    });

    elements.startButton.disabled = true;
    elements.stopButton.disabled = false;
    currentEngine.start();
  }

  function stopSession() {
    if (currentEngine) {
      currentEngine.stop("stopped");
    }
  }

  function registerUserResponse(event) {
    if (event.type === "keydown" && event.code !== "Space") {
      return;
    }

    if (event.type === "keydown") {
      event.preventDefault();
    }

    if (currentEngine && currentEngine.running) {
      currentEngine.registerResponse();
    }
  }

  elements.startButton.addEventListener("click", startSession);
  elements.stopButton.addEventListener("click", stopSession);
  elements.stage.addEventListener("click", registerUserResponse);
  window.addEventListener("keydown", registerUserResponse);

  renderModeSelector();
  syncModeText();
  updateSessionState("idle");
  updateStats(statsModule.createStatsTracker().getSnapshot());
  renderIdleStage();
})();
