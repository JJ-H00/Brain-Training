(function () {
  var config = window.FocusTrainerConfig;
  var statsModule = window.FocusTrainerStats;
  var engineModule = window.FocusTrainerEngine;
  var modeRenderers = window.FocusTrainerModes;
  var sessionFactories = window.FocusTrainerSessions || {};

  var elements = {
    modeList: document.getElementById("mode-list"),
    difficultyPanel: document.getElementById("difficulty-panel"),
    difficultyList: document.getElementById("difficulty-list"),
    stopButton: document.getElementById("stop-button"),
    modeHint: document.getElementById("mode-hint"),
    stageTitle: document.getElementById("stage-title"),
    stage: document.getElementById("stage"),
    stageOverlay: document.getElementById("stage-overlay"),
    overlayStartButton: document.getElementById("overlay-start-button"),
    stageFeedback: document.getElementById("stage-feedback"),
    stimulus: document.getElementById("stimulus"),
    focusTarget: document.getElementById("focus-target"),
    distractorLayer: document.getElementById("distractor-layer"),
    schulteBoard: document.getElementById("schulte-board"),
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
  var selectedDifficultyByMode = {
    reaction: "normal",
    focus: "normal",
    schulte: "normal"
  };
  var currentSession = null;
  var pendingModeSwitch = null;
  var pendingAutoRestart = false;
  var isTouchDevice = window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
  var feedbackTimerId = null;

  function getSelectedDifficultyId(modeId) {
    return selectedDifficultyByMode[modeId] || "normal";
  }

  function getResolvedMode(mode) {
    var difficultyId = getSelectedDifficultyId(mode.id);
    var difficulty = mode.difficulties[difficultyId];
    var resolved = {};

    Object.keys(mode).forEach(function (key) {
      if (key !== "difficulties") {
        resolved[key] = mode[key];
      }
    });

    Object.keys(difficulty).forEach(function (key) {
      if (key !== "id" && key !== "name" && key !== "description") {
        resolved[key] = difficulty[key];
      }
    });

    resolved.selectedDifficultyId = difficultyId;
    resolved.selectedDifficultyName = difficulty.name;
    resolved.selectedDifficultyDescription = difficulty.description;
    return resolved;
  }

  function formatTime(ms) {
    var totalSeconds = Math.floor(ms / 1000);
    var minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    var seconds = String(totalSeconds % 60).padStart(2, "0");
    return minutes + ":" + seconds;
  }

  function clearFeedback() {
    clearTimeout(feedbackTimerId);
    elements.stageFeedback.className = "stage-feedback is-hidden";
    elements.stageFeedback.textContent = "";
    elements.stage.classList.remove("feedback-success", "feedback-error", "feedback-miss");
  }

  function showFeedback(result) {
    clearFeedback();
    elements.stageFeedback.textContent = result.reactionTime ? (result.label + " " + result.reactionTime + " ms") : result.label;
    elements.stageFeedback.className = "stage-feedback " + result.type;
    elements.stage.classList.add("feedback-" + result.type);
    feedbackTimerId = setTimeout(clearFeedback, 650);
  }

  function setOverlay(title, copy, actionLabel) {
    elements.stageOverlay.innerHTML =
      "<div class='overlay-content'><p class='overlay-title'>" + title + "</p><p class='overlay-copy'>" + copy + "</p><button id='overlay-start-button' class='primary-button overlay-button'>" + (actionLabel || "开始训练") + "</button></div>";
    elements.overlayStartButton = document.getElementById("overlay-start-button");
    elements.overlayStartButton.addEventListener("click", function (event) {
      event.stopPropagation();
      startSession();
    });
    elements.stageOverlay.classList.remove("hidden");
  }

  function hideOverlay() {
    elements.stageOverlay.classList.add("hidden");
  }

  function getActionLabel() {
    return isTouchDevice ? "点击屏幕" : "按空格或点击屏幕";
  }

  function getModeInstruction(mode) {
    if (mode.id === "reaction") {
      return mode.selectedDifficultyId === "easy"
        ? "符号会持续不断切换，节奏更慢。看到目标符号“★”时" + getActionLabel() + "；看到其他符号时保持不动。"
        : "符号会持续不断切换。看到目标符号“★”时" + getActionLabel() + "；看到其他符号时保持不动。";
    }

    if (mode.id === "focus") {
      return mode.useMemeImages
        ? "盯住中心光点。只有中心点变成金色时" + getActionLabel() + "，周围文字、符号和 meme 图全部忽略。"
        : "盯住中心光点。只有中心点变成金色时" + getActionLabel() + "，周围更密集的符号全部忽略。";
    }

    return "按照从 1 到 25 的顺序连续点击数字，尽量又快又准。";
  }

  function getModeRule(mode) {
    if (mode.id === "reaction") {
      return "看到 ★ 时" + getActionLabel();
    }

    if (mode.id === "focus") {
      return "中心点变金色时" + getActionLabel();
    }

    return "按 1 到 25 顺序点击";
  }

  function syncModeText() {
    var mode = getResolvedMode(selectedMode);
    elements.stageTitle.textContent = selectedMode.name;
    elements.modeHint.textContent = getModeInstruction(mode);
    elements.targetRule.textContent = getModeRule(mode);
  }

  function updateStats(snapshot) {
    elements.hitRate.textContent = snapshot.hitRate + "%";
    elements.missRate.textContent = snapshot.missRate + "%";
    elements.falseRate.textContent = snapshot.falseAlarmRate + "%";
    elements.avgReaction.textContent = snapshot.avgReaction + " ms";
    elements.responseLabel.textContent = snapshot.lastOutcome;
  }

  function updateSessionState(state) {
    elements.sessionState.textContent = state === "running" ? "进行中" : (state === "finished" ? "已完成" : "未开始");
    elements.sessionState.className = "status-pill " + state;
  }

  function renderStage(state) {
    modeRenderers[selectedMode.id].renderStage(state, elements, getResolvedMode(selectedMode));
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
        switchMode(mode);
      });
      elements.modeList.appendChild(button);
    });
  }

  function renderDifficultySelector() {
    var resolvedMode = getResolvedMode(selectedMode);
    elements.difficultyList.innerHTML = "";

    Object.keys(selectedMode.difficulties).forEach(function (key) {
      var difficulty = selectedMode.difficulties[key];
      var button = document.createElement("button");
      button.type = "button";
      button.className = "difficulty-button" + (resolvedMode.selectedDifficultyId === difficulty.id ? " active" : "");
      button.innerHTML = "<strong>" + difficulty.name + "</strong><span>" + difficulty.description + "</span>";
      button.addEventListener("click", function () {
        selectedDifficultyByMode[selectedMode.id] = difficulty.id;
        renderDifficultySelector();
        syncModeText();

        if (currentSession && currentSession.running) {
          pendingAutoRestart = true;
          stopSession("restarting");
          return;
        }

        renderIdleStage();
      });
      elements.difficultyList.appendChild(button);
    });
  }

  function renderIdleStage() {
    clearFeedback();
    renderStage(null);
    setOverlay("准备开始", getModeInstruction(getResolvedMode(selectedMode)), "开始训练");
    elements.timerLabel.textContent = selectedMode.id === "schulte" ? "00:00" : formatTime(config.sessionDurationMs);
    elements.streakLabel.textContent = selectedMode.id === "schulte" ? "单轮测试" : "轮次 0";
    elements.stopButton.disabled = true;
  }

  function handleSessionComplete(snapshot, reason) {
    currentSession = null;
    elements.stopButton.disabled = true;

    if (reason === "switching" && pendingModeSwitch) {
      selectedMode = pendingModeSwitch;
      pendingModeSwitch = null;
      renderModeSelector();
      renderDifficultySelector();
      syncModeText();
      renderIdleStage();
      return;
    }

    if (reason === "restarting" && pendingAutoRestart) {
      pendingAutoRestart = false;
      renderDifficultySelector();
      syncModeText();
      renderIdleStage();
      startSession();
      return;
    }

    renderIdleStage();

    if (reason === "finished") {
      var summary = selectedMode.id === "schulte"
        ? ("本轮完成，用时 " + formatTime(snapshot.elapsedMs || 0) + "，误触率 " + snapshot.falseAlarmRate + "% 。")
        : ("命中率 " + snapshot.hitRate + "% ，误触率 " + snapshot.falseAlarmRate + "% ，平均反应 " + snapshot.avgReaction + " ms。");
      setOverlay("本轮结束", summary, "重新开始");
    } else if (reason === "stopped") {
      setOverlay("已停止训练", "你可以切换模式后重新开始，继续完成一轮训练。", "重新开始");
    }
  }

  function createEngineSession(mode) {
    var stats = statsModule.createStatsTracker();
    updateStats(stats.getSnapshot());

    return new engineModule.StimulusEngine({
      mode: mode,
      stats: stats,
      onStimulus: renderStage,
      onStats: updateStats,
      onFeedback: showFeedback,
      onSessionState: updateSessionState,
      onTimer: function (remainingMs) {
        elements.timerLabel.textContent = formatTime(remainingMs);
      },
      onRound: function (roundNumber) {
        elements.streakLabel.textContent = "轮次 " + roundNumber;
      },
      onComplete: handleSessionComplete
    });
  }

  function createSession(mode) {
    if (mode.id === "schulte") {
      return sessionFactories.createSchulteSession({
        mode: mode,
        difficulty: mode.selectedDifficultyId,
        onStimulus: renderStage,
        onStats: updateStats,
        onFeedback: showFeedback,
        onSessionState: updateSessionState,
        onTimer: function (elapsedMs) {
          elements.timerLabel.textContent = formatTime(elapsedMs);
        },
        onRound: function (roundNumber) {
          elements.streakLabel.textContent = "第 " + roundNumber + " 轮";
        },
        onComplete: handleSessionComplete
      });
    }

    return createEngineSession(mode);
  }

  function startSession() {
    if (currentSession && currentSession.running) {
      return;
    }

    clearFeedback();
    var mode = getResolvedMode(selectedMode);
    syncModeText();
    hideOverlay();
    currentSession = createSession(mode);
    elements.stopButton.disabled = false;
    currentSession.start();
  }

  function stopSession(reason) {
    if (currentSession && currentSession.running) {
      currentSession.stop(reason || "stopped");
    }
  }

  function switchMode(mode) {
    if (selectedMode.id === mode.id && !(currentSession && currentSession.running)) {
      return;
    }

    if (currentSession && currentSession.running) {
      pendingModeSwitch = mode;
      pendingAutoRestart = false;
      stopSession("switching");
      return;
    }

    pendingModeSwitch = null;
    selectedMode = mode;
    renderModeSelector();
    renderDifficultySelector();
    syncModeText();
    renderIdleStage();
  }

  function registerUserResponse(event) {
    if (!currentSession || !currentSession.running) {
      return;
    }

    var schulteCell = event.type === "click" ? event.target.closest(".schulte-cell") : null;
    if (schulteCell) {
      currentSession.registerBoardClick(schulteCell.dataset.value);
      return;
    }

    if (selectedMode.id === "schulte") {
      return;
    }

    if (event.type === "keydown" && event.code !== "Space") {
      return;
    }

    if (event.type === "keydown") {
      event.preventDefault();
    }

    currentSession.registerResponse();
  }

  elements.stopButton.addEventListener("click", function () {
    pendingAutoRestart = false;
    stopSession("stopped");
  });
  elements.stage.addEventListener("click", registerUserResponse);
  window.addEventListener("keydown", registerUserResponse);

  renderModeSelector();
  renderDifficultySelector();
  syncModeText();
  updateSessionState("idle");
  updateStats(statsModule.createStatsTracker().getSnapshot());
  renderIdleStage();
})();
