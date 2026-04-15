(function () {
  function buildDistractors(layer, symbols, count) {
    var fragment = document.createDocumentFragment();
    var width = layer.clientWidth || 900;
    var height = layer.clientHeight || 420;
    var safeCenterX = width / 2;
    var safeCenterY = height / 2;

    for (var index = 0; index < count; index += 1) {
      var node = document.createElement("span");
      var left = Math.random() * width;
      var top = Math.random() * height;

      if (Math.abs(left - safeCenterX) < 120 && Math.abs(top - safeCenterY) < 120) {
        index -= 1;
        continue;
      }

      node.className = "distractor";
      node.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      node.style.left = left + "px";
      node.style.top = top + "px";
      node.style.fontSize = 20 + Math.round(Math.random() * 28) + "px";
      node.style.opacity = (0.3 + Math.random() * 0.5).toFixed(2);
      fragment.appendChild(node);
    }

    layer.innerHTML = "";
    layer.appendChild(fragment);
  }

  function renderFocusStage(trial, elements, mode) {
    elements.stage.classList.add("mode-focus");
    elements.stage.classList.remove("mode-reaction");
    elements.focusCross.classList.remove("hidden");
    elements.focusTarget.classList.remove("hidden");
    elements.distractorLayer.classList.remove("hidden");
    elements.stimulus.classList.add("hidden");
    buildDistractors(elements.distractorLayer, mode.distractorStimuli, mode.distractorCount);

    if (trial && trial.isTarget) {
      elements.focusTarget.classList.add("alert");
    } else {
      elements.focusTarget.classList.remove("alert");
    }
  }

  window.FocusTrainerModes = window.FocusTrainerModes || {};
  window.FocusTrainerModes.focus = {
    renderStage: renderFocusStage
  };
})();
