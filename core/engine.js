(function () {
  function randomBetween(min, max) {
    return Math.round(min + Math.random() * (max - min));
  }

  function randomItem(items, previous) {
    if (!items.length) {
      return null;
    }
    if (items.length === 1) {
      return items[0];
    }

    var candidate = items[Math.floor(Math.random() * items.length)];
    while (candidate === previous) {
      candidate = items[Math.floor(Math.random() * items.length)];
    }
    return candidate;
  }

  function StimulusEngine(options) {
    this.mode = options.mode;
    this.stats = options.stats;
    this.onStimulus = options.onStimulus;
    this.onStats = options.onStats;
    this.onFeedback = options.onFeedback;
    this.onSessionState = options.onSessionState;
    this.onTimer = options.onTimer;
    this.onRound = options.onRound;
    this.onComplete = options.onComplete;
    this.running = false;
    this.currentTrial = null;
    this.timeoutId = null;
    this.timerTickId = null;
    this.endsAt = 0;
    this.previousStimulus = null;
  }

  StimulusEngine.prototype.start = function start() {
    this.stopTimers();
    this.running = true;
    this.currentTrial = null;
    this.previousStimulus = null;
    this.endsAt = Date.now() + window.FocusTrainerConfig.sessionDurationMs;
    this.onSessionState("running");
    this.onTimer(window.FocusTrainerConfig.sessionDurationMs);
    this.scheduleTimerTick();
    this.presentTrial();
  };

  StimulusEngine.prototype.stop = function stop(reason) {
    if (!this.running) {
      return;
    }

    this.finalizeCurrentTrial(reason !== "switching" && reason !== "restarting");
    this.running = false;
    this.currentTrial = null;
    this.stopTimers();
    this.onStimulus(null);
    this.onSessionState(reason === "finished" ? "finished" : "idle");
    this.onComplete(this.stats.getSnapshot(), reason || "stopped");
  };

  StimulusEngine.prototype.stopTimers = function stopTimers() {
    clearTimeout(this.timeoutId);
    clearInterval(this.timerTickId);
  };

  StimulusEngine.prototype.scheduleTimerTick = function scheduleTimerTick() {
    var self = this;
    this.timerTickId = setInterval(function () {
      if (!self.running) {
        return;
      }

      var remaining = Math.max(0, self.endsAt - Date.now());
      self.onTimer(remaining);
      if (!remaining) {
        self.stop("finished");
      }
    }, window.FocusTrainerConfig.countdownTickMs);
  };

  StimulusEngine.prototype.scheduleNextTrial = function scheduleNextTrial(delay) {
    var self = this;
    this.timeoutId = setTimeout(function () {
      self.presentTrial();
    }, delay == null ? randomBetween(this.mode.intervalMin, this.mode.intervalMax) : delay);
  };

  StimulusEngine.prototype.finalizeCurrentTrial = function finalizeCurrentTrial(shouldCountMiss) {
    if (!this.currentTrial) {
      return;
    }

    if (shouldCountMiss && this.currentTrial.isTarget && !this.currentTrial.responded) {
      this.stats.registerMiss();
      this.onStats(this.stats.getSnapshot());
      this.onFeedback({
        type: "miss",
        label: "错过目标"
      });
    }
  };

  StimulusEngine.prototype.pickStimulus = function pickStimulus(isTarget) {
    var pool = isTarget ? this.mode.targetStimuli : this.mode.distractorStimuli;
    var stimulus = randomItem(pool, this.previousStimulus);
    this.previousStimulus = stimulus;
    return stimulus;
  };

  StimulusEngine.prototype.presentTrial = function presentTrial() {
    if (!this.running) {
      return;
    }

    this.finalizeCurrentTrial(true);

    var isTarget = Math.random() < this.mode.targetProbability;
    var stimulus = this.pickStimulus(isTarget);
    var duration = randomBetween(this.mode.intervalMin, this.mode.intervalMax);

    this.currentTrial = {
      stimulus: stimulus,
      isTarget: isTarget,
      shownAt: Date.now(),
      responded: false,
      duration: duration
    };

    this.stats.registerStimulus(isTarget);
    this.onRound(this.stats.state.rounds);
    this.onStimulus(this.currentTrial);
    this.onStats(this.stats.getSnapshot());
    this.scheduleNextTrial(duration);
  };

  StimulusEngine.prototype.registerResponse = function registerResponse() {
    if (!this.running || !this.currentTrial || this.currentTrial.responded) {
      return;
    }

    this.currentTrial.responded = true;
    var reactionTime = Math.max(0, Date.now() - this.currentTrial.shownAt);

    if (this.currentTrial.isTarget) {
      this.stats.registerHit(reactionTime);
      this.onFeedback({ type: "success", label: "正确", reactionTime: reactionTime });
    } else {
      this.stats.registerFalseAlarm();
      this.onFeedback({ type: "error", label: "错误" });
    }

    this.onStats(this.stats.getSnapshot());
  };

  window.FocusTrainerEngine = {
    StimulusEngine: StimulusEngine
  };
})();
