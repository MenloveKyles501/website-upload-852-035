(function () {
  var hlsPromise = null;

  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  ready(function () {
    document.querySelectorAll('[data-player-panel]').forEach(function (panel) {
      var video = panel.querySelector('video[data-video-src]');
      var button = panel.querySelector('[data-player-start]');
      var message = panel.querySelector('[data-player-message]');

      if (!video || !button) {
        return;
      }

      button.addEventListener('click', function () {
        startPlayback(video, button, message);
      });
    });
  });

  function startPlayback(video, button, message) {
    var source = video.getAttribute('data-video-src');

    if (!source) {
      showMessage(message, '视频地址不可用');
      return;
    }

    button.classList.add('hidden');
    showMessage(message, '正在加载视频...');

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      video.play().catch(function () {
        showMessage(message, '请再次点击视频控件开始播放');
      });
      hideMessageSoon(message);
      return;
    }

    loadHls().then(function () {
      if (!window.Hls || !window.Hls.isSupported()) {
        video.src = source;
        video.play().catch(function () {
          showMessage(message, '当前浏览器可能不支持 HLS 播放');
        });
        return;
      }

      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      hls.loadSource(source);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
        hideMessageSoon(message);
        video.play().catch(function () {
          showMessage(message, '请再次点击视频控件开始播放');
        });
      });
      hls.on(window.Hls.Events.ERROR, function (event, data) {
        if (data && data.fatal) {
          showMessage(message, '视频加载失败，请稍后再试');
        }
      });
      video._hlsInstance = hls;
    }).catch(function () {
      video.src = source;
      video.play().catch(function () {
        showMessage(message, '播放器初始化失败，请更换浏览器再试');
      });
    });
  }

  function loadHls() {
    if (window.Hls) {
      return Promise.resolve();
    }

    if (hlsPromise) {
      return hlsPromise;
    }

    hlsPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return hlsPromise;
  }

  function showMessage(message, text) {
    if (!message) {
      return;
    }
    message.textContent = text;
    message.classList.add('show');
  }

  function hideMessageSoon(message) {
    if (!message) {
      return;
    }
    setTimeout(function () {
      message.classList.remove('show');
    }, 1200);
  }
})();
