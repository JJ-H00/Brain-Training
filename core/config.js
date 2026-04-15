(function () {
  window.FocusTrainerConfig = {
    sessionDurationMs: 45000,
    countdownTickMs: 100,
    modes: {
      reaction: {
        id: "reaction",
        name: "目标识别训练",
        shortDescription: "训练注意控制与反应抑制",
        instructions: "符号会持续不断切换。看到目标符号“★”时立即操作；看到其他符号时保持不动。",
        targetRule: "看到 ★ 时立即操作",
        targetStimuli: ["★"],
        distractorStimuli: ["●", "▲", "■", "◆", "?"],
        targetProbability: 0.28,
        difficulties: {
          easy: {
            id: "easy",
            name: "简单",
            description: "节奏更慢，更容易分辨",
            intervalMin: 900,
            intervalMax: 2050
          },
          normal: {
            id: "normal",
            name: "正常",
            description: "当前标准训练节奏",
            intervalMin: 650,
            intervalMax: 1700
          }
        }
      },
      focus: {
        id: "focus",
        name: "中央凝视抗干扰",
        shortDescription: "训练持续专注与抗干扰能力",
        instructions: "盯住中心光点。只有中心点变成金色时立即操作，周围文字、符号和 meme 图全部忽略。",
        targetRule: "中心点变金色时立即操作",
        targetStimuli: ["alert"],
        distractorStimuli: ["!", "@", "#", "?", "⚡", "✦", "2", "7", "A", "E", "⌁"],
        targetProbability: 0.22,
        memeAssets: [
          "assets/memes/01-drake-hotline-bling.jpg",
          "assets/memes/02-two-buttons.jpg",
          "assets/memes/03-distracted-boyfriend.jpg",
          "assets/memes/04-uno-draw-25-cards.jpg",
          "assets/memes/05-bernie-i-am-once-again-asking-for-your-support.jpg",
          "assets/memes/06-left-exit-12-off-ramp.jpg",
          "assets/memes/07-always-has-been.png",
          "assets/memes/08-anakin-padme-4-panel.png",
          "assets/memes/09-gru-s-plan.jpg",
          "assets/memes/10-running-away-balloon.jpg",
          "assets/memes/11-sad-pablo-escobar.jpg",
          "assets/memes/12-epic-handshake.jpg",
          "assets/memes/13-disaster-girl.jpg",
          "assets/memes/14-x-x-everywhere.jpg",
          "assets/memes/15-waiting-skeleton.jpg",
          "assets/memes/16-batman-slapping-robin.jpg",
          "assets/memes/17-woman-yelling-at-cat.jpg",
          "assets/memes/18-mocking-spongebob.jpg",
          "assets/memes/19-trade-offer.jpg",
          "assets/memes/20-change-my-mind.jpg"
        ],
        remoteMemeAssets: [
          "https://i.imgflip.com/30b1gx.jpg",
          "https://i.imgflip.com/1g8my4.jpg",
          "https://i.imgflip.com/1ur9b0.jpg",
          "https://i.imgflip.com/3lmzyx.jpg",
          "https://i.imgflip.com/3oevdk.jpg",
          "https://i.imgflip.com/22bdq6.jpg",
          "https://i.imgflip.com/46e43q.png",
          "https://i.imgflip.com/5c7lwq.png",
          "https://i.imgflip.com/26jxvz.jpg",
          "https://i.imgflip.com/261o3j.jpg",
          "https://i.imgflip.com/1c1uej.jpg",
          "https://i.imgflip.com/28j0te.jpg",
          "https://i.imgflip.com/23ls.jpg",
          "https://i.imgflip.com/1ihzfe.jpg",
          "https://i.imgflip.com/2fm6x.jpg",
          "https://i.imgflip.com/9ehk.jpg",
          "https://i.imgflip.com/345v97.jpg",
          "https://i.imgflip.com/1otk96.jpg",
          "https://i.imgflip.com/54hjww.jpg",
          "https://i.imgflip.com/24y43o.jpg",
          "https://i.imgflip.com/43a45p.png",
          "https://i.imgflip.com/21uy0f.jpg",
          "https://i.imgflip.com/1jwhww.jpg",
          "https://i.imgflip.com/1b42wl.jpg",
          "https://i.imgflip.com/1bij.jpg",
          "https://i.imgflip.com/wxica.jpg",
          "https://i.imgflip.com/1o00in.jpg",
          "https://i.imgflip.com/2ybua0.png",
          "https://i.imgflip.com/26am.jpg",
          "https://i.imgflip.com/72epa9.png",
          "https://i.imgflip.com/46hhvr.jpg",
          "https://i.imgflip.com/8d317n.png",
          "https://i.imgflip.com/3pdf2w.png",
          "https://i.imgflip.com/2za3u1.jpg",
          "https://i.imgflip.com/2odckz.jpg",
          "https://i.imgflip.com/1tl71a.jpg",
          "https://i.imgflip.com/38el31.jpg",
          "https://i.imgflip.com/2xscjb.png",
          "https://i.imgflip.com/1wz1x.jpg",
          "https://i.imgflip.com/2gnnjh.jpg"
        ],
        difficulties: {
          easy: {
            id: "easy",
            name: "简单",
            description: "只有符号干扰，密度更高",
            intervalMin: 750,
            intervalMax: 1550,
            distractorCount: 16,
            maxRemoteDistractors: 0,
            useMemeImages: false
          },
          normal: {
            id: "normal",
            name: "正常",
            description: "符号加 meme 图混合干扰",
            intervalMin: 800,
            intervalMax: 1800,
            distractorCount: 12,
            maxRemoteDistractors: 4,
            useMemeImages: true
          }
        }
      },
      schulte: {
        id: "schulte",
        name: "舒尔特方格",
        shortDescription: "训练视觉搜索与注意转换速度",
        instructions: "按照从 1 到 25 的顺序连续点击数字，尽量又快又准。",
        targetRule: "按 1 到 25 顺序点击",
        gridSize: 5,
        maxNumber: 25,
        difficulties: {
          easy: {
            id: "easy",
            name: "简单",
            description: "点击后方块变绿"
          },
          normal: {
            id: "normal",
            name: "正常",
            description: "点击后方块外观不变化"
          }
        }
      }
    }
  };
})();
