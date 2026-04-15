(function () {
  window.FocusTrainerConfig = {
    sessionDurationMs: 45000,
    countdownTickMs: 100,
    modes: {
      reaction: {
        id: "reaction",
        name: "目标识别训练",
        shortDescription: "只在目标符号出现时反应",
        instructions: "看到目标符号“★”时，立即点击舞台或按空格；看到其他符号不要动。",
        targetRule: "看到 ★ 时反应",
        targetStimuli: ["★"],
        distractorStimuli: ["●", "▲", "■", "◆", "?"],
        targetProbability: 0.28,
        intervalMin: 650,
        intervalMax: 1700,
        stimulusDuration: 950,
        responseWindow: 950
      },
      focus: {
        id: "focus",
        name: "中央凝视抗干扰",
        shortDescription: "盯住中心点，忽略外围干扰",
        instructions: "盯住中心光点。只有中心点变成金色时才反应，周围文字和 emoji 都忽略。",
        targetRule: "中心点变金色时反应",
        targetStimuli: ["alert"],
        distractorStimuli: ["!", "@", "#", "?", "⚡", "✦", "2", "7", "A", "E", "⌁"],
        targetProbability: 0.22,
        intervalMin: 800,
        intervalMax: 1800,
        stimulusDuration: 1100,
        responseWindow: 900,
        distractorCount: 10
      }
    }
  };
})();
