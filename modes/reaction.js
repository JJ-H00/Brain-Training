(function () {
  function renderReactionStage(trial, elements) {
    elements.stage.classList.add("mode-reaction");
    elements.stage.classList.remove("mode-focus");
    elements.focusCross.classList.add("hidden");
    elements.focusTarget.classList.add("hidden");
    elements.focusTarget.classList.remove("alert");
    elements.distractorLayer.classList.add("hidden");
    elements.distractorLayer.innerHTML = "";
    elements.stimulus.classList.remove("hidden");
    elements.stimulus.textContent = trial ? trial.stimulus : "+";
  }

  window.FocusTrainerModes = window.FocusTrainerModes || {};
  window.FocusTrainerModes.reaction = {
    renderStage: renderReactionStage
  };
})();
