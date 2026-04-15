(function () {
  var sampledRemotePool = null;

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function sampleItems(items, count) {
    var array = items.slice();
    var result = [];
    while (array.length && result.length < count) {
      var index = Math.floor(Math.random() * array.length);
      result.push(array.splice(index, 1)[0]);
    }
    return result;
  }

  function getImagePool(mode) {
    var localPool = mode.memeAssets || [];
    if (!mode.useMemeImages) {
      return localPool;
    }
    if (!navigator.onLine || !mode.remoteMemeAssets || !mode.remoteMemeAssets.length) {
      return localPool;
    }

    if (!sampledRemotePool) {
      sampledRemotePool = sampleItems(mode.remoteMemeAssets, Math.max((mode.maxRemoteDistractors || 4) * 2, 6));
    }

    return localPool.concat(sampledRemotePool);
  }

  function buildDistractors(layer, mode, count) {
    var fragment = document.createDocumentFragment();
    var width = layer.clientWidth || 900;
    var height = layer.clientHeight || 420;
    var safeCenterX = width / 2;
    var safeCenterY = height / 2;
    var remoteImageCount = 0;
    var imagePool = getImagePool(mode);

    for (var index = 0; index < count; index += 1) {
      var useImage = mode.useMemeImages && imagePool.length && Math.random() < 0.55;
      var left = Math.random() * width;
      var top = Math.random() * height;

      if (Math.abs(left - safeCenterX) < 150 && Math.abs(top - safeCenterY) < 150) {
        index -= 1;
        continue;
      }

      if (useImage) {
        var img = document.createElement("img");
        var src = randomItem(imagePool);
        var fallback = randomItem(mode.memeAssets);
        img.className = "distractor distractor-image";
        img.src = src;
        img.alt = "meme distractor";
        img.loading = "lazy";
        img.decoding = "async";
        img.referrerPolicy = "no-referrer";
        img.style.left = left + "px";
        img.style.top = top + "px";
        img.style.width = 70 + Math.round(Math.random() * 90) + "px";
        img.style.transform = "translate(-50%, -50%) rotate(" + (-18 + Math.round(Math.random() * 36)) + "deg)";
        img.style.opacity = (0.45 + Math.random() * 0.35).toFixed(2);
        img.onerror = function handleError() {
          if (this.dataset.fallbackApplied === "1") {
            return;
          }
          this.dataset.fallbackApplied = "1";
          this.src = this.dataset.fallbackSrc;
        };
        img.dataset.fallbackSrc = fallback;
        if (sampledRemotePool && sampledRemotePool.indexOf(src) !== -1) {
          remoteImageCount += 1;
          if (remoteImageCount > (mode.maxRemoteDistractors || 4)) {
            img.src = fallback;
          }
        }
        fragment.appendChild(img);
      } else {
        var node = document.createElement("span");
        node.className = "distractor distractor-text";
        node.textContent = randomItem(mode.distractorStimuli);
        node.style.left = left + "px";
        node.style.top = top + "px";
        node.style.fontSize = 22 + Math.round(Math.random() * 32) + "px";
        node.style.opacity = (0.3 + Math.random() * 0.45).toFixed(2);
        fragment.appendChild(node);
      }
    }

    layer.innerHTML = "";
    layer.appendChild(fragment);
  }

  window.addEventListener("online", function () {
    sampledRemotePool = null;
  });

  window.addEventListener("offline", function () {
    sampledRemotePool = null;
  });

  function renderFocusStage(trial, elements, mode) {
    elements.stage.classList.add("mode-focus");
    elements.stage.classList.remove("mode-reaction", "mode-schulte");
    elements.focusTarget.classList.remove("hidden");
    elements.distractorLayer.classList.remove("hidden");
    elements.schulteBoard.classList.add("hidden");
    elements.schulteBoard.innerHTML = "";
    elements.stimulus.classList.add("hidden");
    buildDistractors(elements.distractorLayer, mode, mode.distractorCount);

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
