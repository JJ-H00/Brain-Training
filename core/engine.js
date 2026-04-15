(function () {
  function randomBetween(min, max) {
    return Math.round(min + Math.random() * (max - min));
  }

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function StimulusEngine(options) {
    this.mode = options.mode;
    this.stats = options.stats;
    this.onStimulus = options.onStimulus;
    this.onStats = options.onStats;
    this.onSessionState = options.onSessionState;
    this.onTimer = options.onTimer;
    this.onRound = options.onRound;
    this.onComplete = options.onComplete;
    this.running = false;
    this.currentTrial = null;
    this.timeoutId = null;
    this.responseTimerId = null;
    this.sessionTimerId = null;
    this.timerTickId = null;
    this.endsAt = 0;
  }

  StimulusEngine.prototype.start = function start() {
    this.stopTimers();
    this.running = true;
    this.endsAt = Date.now() + window.FocusTrainerConfig.sessionDurationMs;
    this.onSessionState("running");
    this.onTimer(window.FocusTrainerConfig.sessionDurationMs);
    this.scheduleTimerTick();
    this.scheduleNextTrial(300);
  };

  StimulusEngine.prototype.stop = function stop(reason) {
    if (!this.running) {
      return;
    }

    if (this.currentTrial && this.currentTrial.isTarget && !this.currentTrial.responded) {
      this.stats.registerMiss();
      this.onStats(this.stats.getSnapshot());
    }

    this.running = false;
    this.currentTrial = null;
    this.stopTimers();
    this.onStimulus(null);
    this.onSessionState(reason === "finished" ? "finished" : "idle");
    this.onComplete(this.stats.getSnapshot(), reason || "stopped");
  };

  StimulusEngine.prototype.stopTimers = function stopTimers() {
    clearTimeout(this.timeoutId);
    clearTimeout(this.responseTimerId);
    clearTimeout(this.sessionTimerId);
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

  StimulusEngine.prototype.presentTrial = function presentTrial() {
    if (!this.running) {
      return;
    }

    var isTarget = Math.random() < this.mode.targetProbability;
    var stimulus = isTarget ? randomItem(this.mode.targetStimuli) : randomItem(this.mode.distractorStimuli);
    this.currentTrial = {
      stimulus: stimulus,
      isTarget: isTarget,
      shownAt: Date.now(),
      responded: false
    };

    this.stats.registerStimulus(isTarget);
    this.onRound(this.stats.state.rounds);
    this.onStimulus(this.currentTrial);
    this.onStats(this.stats.getSnapshot());

    var self = this;
    this.responseTimerId = setTimeout(function () {
      if (!self.currentTrial || self.currentTrial.responded) {
        return;
      }

      if (self.currentTrial.isTarget) {
        self.stats.registerMiss();
        self.onStats(self.stats.getSnapshot());
      }

      self.currentTrial = null;
      self.onStimulus(null);
      self.scheduleNextTrial();
    }, this.mode.responseWindow);
  };

  StimulusEngine.prototype.registerResponse = function registerResponse() {
    if (!this.running) {
      return;
    }

    if (!this.currentTrial) {
      this.stats.registerFalseAlarm();
      this.onStats(this.stats.getSnapshot());
      return;
    }

    if (this.currentTrial.responded) {
      return;
    }

    this.currentTrial.responded = true;
    var reactionTime = Math.max(0, Date.now() - this.currentTrial.shownAt);

    if (this.currentTrial.isTarget) {
      this.stats.registerHit(reactionTime);
    } else {
      this.stats.registerFalseAlarm();
    }

    this.onStats(this.stats.getSnapshot());
    this.currentTrial = null;
    this.onStimulus(null);
    clearTimeout(this.responseTimerId);
    this.scheduleNextTrial(280);
  };

  window.FocusTrainerEngine = {
    StimulusEngine: StimulusEngine
  };
})();
