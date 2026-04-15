(function () {
  function createStatsTracker() {
    var state = {
      rounds: 0,
      targets: 0,
      hits: 0,
      misses: 0,
      falseAlarms: 0,
      reactionTimes: [],
      lastOutcome: "等待开始"
    };

    function safeRate(value, total) {
      if (!total) {
        return 0;
      }
      return Math.round((value / total) * 100);
    }

    return {
      state: state,
      registerStimulus: function registerStimulus(isTarget) {
        state.rounds += 1;
        if (isTarget) {
          state.targets += 1;
        }
      },
      registerHit: function registerHit(reactionTime) {
        state.hits += 1;
        state.reactionTimes.push(reactionTime);
        state.lastOutcome = "命中 " + reactionTime + " ms";
      },
      registerMiss: function registerMiss() {
        state.misses += 1;
        state.lastOutcome = "漏判";
      },
      registerFalseAlarm: function registerFalseAlarm() {
        state.falseAlarms += 1;
        state.lastOutcome = "误触";
      },
      getSnapshot: function getSnapshot() {
        var avgReaction = 0;
        if (state.reactionTimes.length) {
          var total = state.reactionTimes.reduce(function (sum, time) {
            return sum + time;
          }, 0);
          avgReaction = Math.round(total / state.reactionTimes.length);
        }

        return {
          rounds: state.rounds,
          targets: state.targets,
          hits: state.hits,
          misses: state.misses,
          falseAlarms: state.falseAlarms,
          hitRate: safeRate(state.hits, state.targets),
          missRate: safeRate(state.misses, state.targets),
          falseAlarmRate: safeRate(state.falseAlarms, state.rounds),
          avgReaction: avgReaction,
          lastOutcome: state.lastOutcome
        };
      }
    };
  }

  window.FocusTrainerStats = {
    createStatsTracker: createStatsTracker
  };
})();
