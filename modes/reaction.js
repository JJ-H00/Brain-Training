(function () {
  function renderReactionStage(trial, elements) {
    elements.stage.classList.add("mode-reaction");
    elements.stage.classList.remove("mode-focus", "mode-schulte");
    elements.focusTarget.classList.add("hidden");
    elements.focusTarget.classList.remove("alert");
    elements.distractorLayer.classList.add("hidden");
    elements.distractorLayer.innerHTML = "";
    elements.schulteBoard.classList.add("hidden");
    elements.schulteBoard.innerHTML = "";
    elements.stimulus.classList.toggle("hidden", !trial);
    elements.stimulus.textContent = trial ? trial.stimulus : "";
  }

  window.FocusTrainerModes = window.FocusTrainerModes || {};
  window.FocusTrainerModes.reaction = {
    renderStage: renderReactionStage
  };
})();
