// Served at /setup/app.js
// No fancy syntax: keep it maximally compatible.

(function () {
  var statusEl = document.getElementById('status');
  var authGroupEl = document.getElementById('authGroup');
  var authChoiceEl = document.getElementById('authChoice');
  var logEl = document.getElementById('log');

  // Debug console
  var consoleCmdEl = document.getElementById('consoleCmd');
  var consoleArgEl = document.getElementById('consoleArg');
  var consoleRunEl = document.getElementById('consoleRun');
  var consoleOutEl = document.getElementById('consoleOut');

  // Config editor
  var configPathEl = document.getElementById('configPath');
  var configTextEl = document.getElementById('configText');
  var configReloadEl = document.getElementById('configReload');
  var configSaveEl = document.getElementById('configSave');
  var configOutEl = document.getElementById('configOut');

  // Import
  var importFileEl = document.getElementById('importFile');
  var importRunEl = document.getElementById('importRun');
  var importOutEl = document.getElementById('importOut');

  function setStatus(s) {
    statusEl.textContent = s;
  }

  function renderAuth(groups) {
    authGroupEl.innerHTML = '';
    for (var i = 0; i < groups.length; i++) {
      var g = groups[i];
      var opt = document.createElement('option');
      opt.value = g.value;
      opt.textContent = g.label + (g.hint ? ' - ' + g.hint : '');
      authGroupEl.appendChild(opt);
    }

    authGroupEl.onchange = function () {
      var sel = null;
      for (var j = 0; j < groups.length; j++) {
        if (groups[j].value === authGroupEl.value) sel = groups[j];
      }
      authChoiceEl.innerHTML = '';
      var opts = (sel && sel.options) ? sel.options : [];
      for (var k = 0; k < opts.length; k++) {
        var o = opts[k];
        var opt2 = document.createElement('option');
        opt2.value = o.value;
        opt2.textContent = o.label + (o.hint ? ' - ' + o.hint : '');
        authChoiceEl.appendChild(opt2);
      }
    };

    authGroupEl.onchange();
  }

  function httpJson(url, opts) {
    opts = opts || {};
    opts.credentials = 'same-origin';
    return fetch(url, opts).then(function (res) {
      if (!res.ok) {
        // Try to parse error response as JSON first
        return res.text().then(function (t) {
          // Try to extract meaningful error message from JSON response
          try {
            const jsonErr = JSON.parse(t);
            if (jsonErr.error) {
              throw new Error('HTTP ' + res.status + ': ' + jsonErr.error);
            }
          } catch (_) {
            // Not JSON or no error field, use text as-is
          }
          throw new Error('HTTP ' + res.status + ': ' + (t || res.statusText));
        });
      }
      return res.json();
    });
  }

  function refreshStatus() {
    setStatus('Loading...');
    return httpJson('/setup/api/status').then(function (j) {
      var ver = j.openclawVersion ? (' | ' + j.openclawVersion) : '';
      setStatus((j.configured ? 'Configured - open /openclaw' : 'Not configured - run setup below') + ver);
      renderAuth(j.authGroups || []);

      // Attempt to load config editor content if present.
      if (configReloadEl && configTextEl) {
        loadConfigRaw();
      }

    }).catch(function (e) {
      setStatus('Error: ' + String(e));
    });
  }

  document.getElementById('run').onclick = function () {
    var payload = {
      flow: document.getElementById('flow').value,
      authChoice: authChoiceEl.value,
      authSecret: document.getElementById('authSecret').value,
      telegramToken: document.getElementById('telegramToken').value,
      discordToken: document.getElementById('discordToken').value,
      slackBotToken: document.getElementById('slackBotToken').value,
      slackAppToken: document.getElementById('slackAppToken').value,
      whatsappPhoneNumberId: document.getElementById('whatsappPhoneNumberId').value,
      whatsappAccessToken: document.getElementById('whatsappAccessToken').value,
      whatsappBusinessAccountId: document.getElementById('whatsappBusinessAccountId').value,
      whatsappVerifyToken: document.getElementById('whatsappVerifyToken').value,
      whatsappPersonalEnabled: document.getElementById('whatsappPersonalEnabled') ? document.getElementById('whatsappPersonalEnabled').checked : false,
      signalApiUrl: document.getElementById('signalApiUrl').value,
      signalPhoneNumber: document.getElementById('signalPhoneNumber').value,
      signalAccount: document.getElementById('signalAccount').value,
      signalSendAs: document.getElementById('signalSendAs').value,
      signalRecipients: document.getElementById('signalRecipients').value
    };

    logEl.textContent = 'Running...\n';

    fetch('/setup/api/run', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res.text();
    }).then(function (text) {
      var j;
      try { j = JSON.parse(text); } catch (_e) { j = { ok: false, output: text }; }
      logEl.textContent += (j.output || JSON.stringify(j, null, 2));
      return refreshStatus();
    }).catch(function (e) {
      logEl.textContent += '\nError: ' + String(e) + '\n';
    });
  };

  // Debug console runner
  function runConsole() {
    if (!consoleCmdEl || !consoleRunEl) return;
    var cmd = consoleCmdEl.value;
    var arg = consoleArgEl ? consoleArgEl.value : '';
    if (consoleOutEl) consoleOutEl.textContent = 'Running ' + cmd + '...\n';

    return httpJson('/setup/api/console/run', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cmd: cmd, arg: arg })
    }).then(function (j) {
      if (consoleOutEl) consoleOutEl.textContent = (j.output || JSON.stringify(j, null, 2));
      return refreshStatus();
    }).catch(function (e) {
      if (consoleOutEl) consoleOutEl.textContent += '\nError: ' + String(e) + '\n';
    });
  }

  if (consoleRunEl) {
    consoleRunEl.onclick = runConsole;
  }

  // Config raw load/save
  function loadConfigRaw() {
    if (!configTextEl) return;
    if (configOutEl) configOutEl.textContent = '';
    return httpJson('/setup/api/config/raw').then(function (j) {
      if (configPathEl) {
        configPathEl.textContent = 'Config file: ' + (j.path || '(unknown)') + (j.exists ? '' : ' (does not exist yet)');
      }
      configTextEl.value = j.content || '';
    }).catch(function (e) {
      if (configOutEl) configOutEl.textContent = 'Error loading config: ' + String(e);
    });
  }

  function saveConfigRaw() {
    if (!configTextEl) return;
    if (!confirm('Save config and restart gateway? A timestamped .bak backup will be created.')) return;
    if (configOutEl) configOutEl.textContent = 'Saving...\n';
    return httpJson('/setup/api/config/raw', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content: configTextEl.value })
    }).then(function (j) {
      if (configOutEl) configOutEl.textContent = 'Saved: ' + (j.path || '') + '\nGateway restarted.\n';
      return refreshStatus();
    }).catch(function (e) {
      if (configOutEl) configOutEl.textContent += '\nError: ' + String(e) + '\n';
    });
  }

  if (configReloadEl) configReloadEl.onclick = loadConfigRaw;
  if (configSaveEl) configSaveEl.onclick = saveConfigRaw;

  // Import backup
  function runImport() {
    if (!importRunEl || !importFileEl) return;
    var f = importFileEl.files && importFileEl.files[0];
    if (!f) {
      alert('Pick a .tar.gz file first');
      return;
    }
    if (!confirm('Import backup? This overwrites files under /data and restarts the gateway.')) return;

    if (importOutEl) importOutEl.textContent = 'Uploading ' + f.name + ' (' + f.size + ' bytes)...\n';

    return f.arrayBuffer().then(function (buf) {
      return fetch('/setup/import', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/gzip' },
        body: buf
      });
    }).then(function (res) {
      return res.text().then(function (t) {
        if (importOutEl) importOutEl.textContent += t + '\n';
        if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + t);
        return refreshStatus();
      });
    }).catch(function (e) {
      if (importOutEl) importOutEl.textContent += '\nError: ' + String(e) + '\n';
    });
  }

  if (importRunEl) importRunEl.onclick = runImport;

  // Pairing approve helper
  var pairingBtn = document.getElementById('pairingApprove');
  if (pairingBtn) {
    pairingBtn.onclick = function () {
      var channel = prompt('Enter channel (telegram, discord, or whatsapp-personal):');
      if (!channel) return;
      channel = channel.trim().toLowerCase();
      if (channel !== 'telegram' && channel !== 'discord' && channel !== 'whatsapp-personal') {
        alert('Channel must be "telegram", "discord", or "whatsapp-personal"');
        return;
      }
      var code = prompt('Enter pairing code (e.g. 3EY4PUYS):');
      if (!code) return;
      logEl.textContent += '\nApproving pairing for ' + channel + '...\n';
      fetch('/setup/api/pairing/approve', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ channel: channel, code: code.trim() })
      }).then(function (r) { return r.text(); })
        .then(function (t) { logEl.textContent += t + '\n'; })
        .catch(function (e) { logEl.textContent += 'Error: ' + String(e) + '\n'; });
    };
  }

  document.getElementById('reset').onclick = function () {
    if (!confirm('Reset setup? This deletes the config file so onboarding can run again.')) return;
    logEl.textContent = 'Resetting...\n';
    fetch('/setup/api/reset', { method: 'POST', credentials: 'same-origin' })
      .then(function (res) { return res.text(); })
      .then(function (t) { logEl.textContent += t + '\n'; return refreshStatus(); })
      .catch(function (e) { logEl.textContent += 'Error: ' + String(e) + '\n'; });
  };

  // --- WhatsApp Personal (Normal WhatsApp) ---
  var waPersonalStartBtn = document.getElementById('waPersonalStart');
  var waPersonalStopBtn = document.getElementById('waPersonalStop');
  var waPersonalRefreshBtn = document.getElementById('waPersonalRefresh');
  var waPersonalStatusText = document.getElementById('waPersonalStatusText');
  var waPersonalClientInfo = document.getElementById('waPersonalClientInfo');
  var waPersonalQrContainer = document.getElementById('waPersonalQrContainer');
  var waPersonalQr = document.getElementById('waPersonalQr');
  var waPersonalTestTo = document.getElementById('waPersonalTestTo');
  var waPersonalTestMessage = document.getElementById('waPersonalTestMessage');
  var waPersonalSendTestBtn = document.getElementById('waPersonalSendTest');
  var waPersonalOut = document.getElementById('waPersonalOut');

  var waPersonalPollInterval = null;

  function waPersonalLog(msg) {
    if (waPersonalOut) {
      waPersonalOut.textContent = msg + '\n' + waPersonalOut.textContent;
    }
  }

  function waPersonalUpdateStatus(data) {
    if (waPersonalStatusText) {
      waPersonalStatusText.textContent = data.status || 'unknown';
    }
    if (data.clientInfo && waPersonalClientInfo) {
      waPersonalClientInfo.textContent = 'Connected as: ' + data.clientInfo.pushName + ' (' + data.clientInfo.number + ')';
    } else if (waPersonalClientInfo) {
      waPersonalClientInfo.textContent = '';
    }
    if (data.authFailure) {
      waPersonalLog('Auth failure: ' + data.authFailure);
    }
    if (data.qr && waPersonalQr) {
      // Check if QR is a data URL (image) or raw text
      if (data.qr.startsWith('data:image')) {
        waPersonalQr.innerHTML = '<img src="' + data.qr + '" alt="QR Code" style="width: 250px; height: 250px; display: block; margin: 0 auto;" />';
      } else {
        // Fallback to text display (e.g., use an external QR service)
        waPersonalQr.innerHTML = '<img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + encodeURIComponent(data.qr) + '" alt="QR Code" style="width: 250px; height: 250px; display: block; margin: 0 auto;" />';
      }
      if (waPersonalQrContainer) waPersonalQrContainer.style.display = 'block';
    }
  }

  function waPersonalRefreshStatus() {
    return httpJson('/setup/api/whatsapp-personal/status')
      .then(function (j) {
        waPersonalUpdateStatus(j);
        return j;
      })
      .catch(function (e) {
        waPersonalLog('Error: ' + String(e));
      });
  }

  function waPersonalStartPolling() {
    if (waPersonalPollInterval) return;
    waPersonalPollInterval = setInterval(function () {
      waPersonalRefreshStatus();
    }, 3000);
  }

  function waPersonalStopPolling() {
    if (waPersonalPollInterval) {
      clearInterval(waPersonalPollInterval);
      waPersonalPollInterval = null;
    }
  }

  if (waPersonalStartBtn) {
    waPersonalStartBtn.onclick = function () {
      waPersonalLog('Starting WhatsApp Personal...');
      httpJson('/setup/api/whatsapp-personal/start', { method: 'POST' })
        .then(function (j) {
          waPersonalLog('Started: ' + (j.message || j.status));
          waPersonalStartPolling();
          return waPersonalRefreshStatus();
        })
        .catch(function (e) {
          waPersonalLog('Error: ' + String(e));
        });
    };
  }

  if (waPersonalStopBtn) {
    waPersonalStopBtn.onclick = function () {
      waPersonalLog('Stopping WhatsApp Personal...');
      waPersonalStopPolling();
      httpJson('/setup/api/whatsapp-personal/stop', { method: 'POST' })
        .then(function (j) {
          waPersonalLog('Stopped: ' + (j.disconnected ? 'Disconnected' : 'Already stopped'));
          if (waPersonalQrContainer) waPersonalQrContainer.style.display = 'none';
          if (waPersonalStatusText) waPersonalStatusText.textContent = 'Stopped';
          if (waPersonalClientInfo) waPersonalClientInfo.textContent = '';
        })
        .catch(function (e) {
          waPersonalLog('Error: ' + String(e));
        });
    };
  }

  if (waPersonalRefreshBtn) {
    waPersonalRefreshBtn.onclick = function () {
      waPersonalRefreshStatus();
    };
  }

  if (waPersonalSendTestBtn) {
    waPersonalSendTestBtn.onclick = function () {
      var to = waPersonalTestTo ? waPersonalTestTo.value.trim() : '';
      var msg = waPersonalTestMessage ? waPersonalTestMessage.value.trim() : '';
      if (!to || !msg) {
        alert('Please enter both phone number and message');
        return;
      }
      waPersonalLog('Sending test message to ' + to + '...');
      httpJson('/setup/api/whatsapp-personal/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ to: to, message: msg })
      })
        .then(function (j) {
          if (j.ok) {
            waPersonalLog('Sent successfully to ' + j.recipient);
          } else {
            waPersonalLog('Error: ' + (j.error || 'Unknown error'));
          }
        })
        .catch(function (e) {
          waPersonalLog('Error: ' + String(e));
        });
    };
  }

  refreshStatus();
})();
