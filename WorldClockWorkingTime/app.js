const $ = (s) => document.querySelector(s);
const localTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
let S = {
  zones: ["America/Chicago", "America/Denver", "America/Los_Angeles"],
  ws: 9,
  we: 17,
  ds: 6,
  de: 18,
  win: 72,
  dur: 30,
};
try {
  const r = JSON.parse(localStorage.getItem("overlap-tz"));
  if (r && Array.isArray(r.zones)) S = Object.assign(S, r);
} catch (e) {}
// Always open with a 30 minute meeting box that the user can stretch or shrink.
S.dur = 30;
const save = () => {
  try {
    localStorage.setItem("overlap-tz", JSON.stringify(S));
  } catch (e) {}
};
let T = null,
  D = 0,
  B0 = 0,
  W0 = 0,
  Wms = 0,
  lastW = innerWidth;
const city = (z) => z.split("/").pop().replace(/_/g, " ");
const WT = `-12:00|International Date Line West|Etc/GMT+12
-11:00|Coordinated Universal Time-11|Etc/GMT+11
-10:00|Aleutian Islands|America/Adak
-10:00|Hawaii|Pacific/Honolulu
-09:30|Marquesas Islands|Pacific/Marquesas
-09:00|Alaska|America/Anchorage
-09:00|Coordinated Universal Time-09|Etc/GMT+9
-08:00|Baja California|America/Tijuana
-08:00|Pacific Time (US & Canada)|America/Los_Angeles
-07:00|Arizona|America/Phoenix
-07:00|La Paz, Mazatlan|America/Mazatlan
-07:00|Mountain Time (US & Canada)|America/Denver
-07:00|Yukon|America/Whitehorse
-06:00|Central America|America/Guatemala
-06:00|Central Time (US & Canada)|America/Chicago
-06:00|Easter Island|Pacific/Easter
-06:00|Guadalajara, Mexico City, Monterrey|America/Mexico_City
-06:00|Saskatchewan|America/Regina
-05:00|Bogota, Lima, Quito, Rio Branco|America/Bogota
-05:00|Chetumal|America/Cancun
-05:00|Eastern Time (US & Canada)|America/New_York
-05:00|Haiti|America/Port-au-Prince
-05:00|Havana|America/Havana
-05:00|Indiana (East)|America/Indiana/Indianapolis
-05:00|Turks and Caicos|America/Grand_Turk
-04:00|Asuncion|America/Asuncion
-04:00|Atlantic Time (Canada)|America/Halifax
-04:00|Caracas|America/Caracas
-04:00|Cuiaba|America/Cuiaba
-04:00|Georgetown, La Paz, Manaus, San Juan|America/La_Paz
-04:00|Santiago|America/Santiago
-03:30|Newfoundland|America/St_Johns
-03:00|Araguaina|America/Araguaina
-03:00|Brasilia|America/Sao_Paulo
-03:00|Cayenne, Fortaleza|America/Cayenne
-03:00|City of Buenos Aires|America/Argentina/Buenos_Aires
-03:00|Greenland|America/Nuuk
-03:00|Montevideo|America/Montevideo
-03:00|Punta Arenas|America/Punta_Arenas
-03:00|Saint Pierre and Miquelon|America/Miquelon
-03:00|Salvador|America/Bahia
-02:00|Coordinated Universal Time-02|Etc/GMT+2
-01:00|Azores|Atlantic/Azores
-01:00|Cabo Verde Is.|Atlantic/Cape_Verde
|Coordinated Universal Time|UTC
+00:00|Dublin, Edinburgh, Lisbon, London|Europe/London
+00:00|Monrovia, Reykjavik|Atlantic/Reykjavik
+00:00|Sao Tome|Africa/Sao_Tome
+01:00|Casablanca|Africa/Casablanca
+01:00|Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna|Europe/Berlin
+01:00|Belgrade, Bratislava, Budapest, Ljubljana, Prague|Europe/Budapest
+01:00|Brussels, Copenhagen, Madrid, Paris|Europe/Paris
+01:00|Sarajevo, Skopje, Warsaw, Zagreb|Europe/Warsaw
+01:00|West Central Africa|Africa/Lagos
+02:00|Amman|Asia/Amman
+02:00|Athens, Bucharest|Europe/Bucharest
+02:00|Beirut|Asia/Beirut
+02:00|Cairo|Africa/Cairo
+02:00|Chisinau|Europe/Chisinau
+02:00|Damascus|Asia/Damascus
+02:00|Gaza, Hebron|Asia/Hebron
+02:00|Harare, Pretoria|Africa/Johannesburg
+02:00|Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius|Europe/Kiev
+02:00|Jerusalem|Asia/Jerusalem
+02:00|Juba|Africa/Juba
+02:00|Kaliningrad|Europe/Kaliningrad
+02:00|Khartoum|Africa/Khartoum
+02:00|Tripoli|Africa/Tripoli
+02:00|Windhoek|Africa/Windhoek
+03:00|Baghdad|Asia/Baghdad
+03:00|Istanbul|Europe/Istanbul
+03:00|Kuwait, Riyadh|Asia/Riyadh
+03:00|Minsk|Europe/Minsk
+03:00|Moscow, St. Petersburg|Europe/Moscow
+03:00|Nairobi|Africa/Nairobi
+03:30|Tehran|Asia/Tehran
+04:00|Abu Dhabi, Muscat|Asia/Dubai
+04:00|Astrakhan, Ulyanovsk|Europe/Astrakhan
+04:00|Baku|Asia/Baku
+04:00|Izhevsk, Samara|Europe/Samara
+04:00|Port Louis|Indian/Mauritius
+04:00|Saratov|Europe/Saratov
+04:00|Tbilisi|Asia/Tbilisi
+04:00|Volgograd|Europe/Volgograd
+04:00|Yerevan|Asia/Yerevan
+04:30|Kabul|Asia/Kabul
+05:00|Ashgabat, Tashkent|Asia/Tashkent
+05:00|Ekaterinburg|Asia/Yekaterinburg
+05:00|Islamabad, Karachi|Asia/Karachi
+05:00|Qyzylorda|Asia/Qyzylorda
+05:30|Chennai, Kolkata, Mumbai, New Delhi|Asia/Kolkata
+05:30|Sri Jayawardenepura|Asia/Colombo
+05:45|Kathmandu|Asia/Kathmandu
+06:00|Astana|Asia/Almaty
+06:00|Dhaka|Asia/Dhaka
+06:00|Omsk|Asia/Omsk
+06:30|Yangon (Rangoon)|Asia/Yangon
+07:00|Bangkok, Hanoi, Jakarta|Asia/Bangkok
+07:00|Barnaul, Gorno-Altaysk|Asia/Barnaul
+07:00|Hovd|Asia/Hovd
+07:00|Krasnoyarsk|Asia/Krasnoyarsk
+07:00|Novosibirsk|Asia/Novosibirsk
+07:00|Tomsk|Asia/Tomsk
+08:00|Beijing, Chongqing, Hong Kong, Urumqi|Asia/Shanghai
+08:00|Irkutsk|Asia/Irkutsk
+08:00|Kuala Lumpur, Singapore|Asia/Singapore
+08:00|Perth|Australia/Perth
+08:00|Taipei|Asia/Taipei
+08:00|Ulaanbaatar|Asia/Ulaanbaatar
+08:45|Eucla|Australia/Eucla
+09:00|Chita|Asia/Chita
+09:00|Osaka, Sapporo, Tokyo|Asia/Tokyo
+09:00|Pyongyang|Asia/Pyongyang
+09:00|Seoul|Asia/Seoul
+09:00|Yakutsk|Asia/Yakutsk
+09:30|Adelaide|Australia/Adelaide
+09:30|Darwin|Australia/Darwin
+10:00|Brisbane|Australia/Brisbane
+10:00|Canberra, Melbourne, Sydney|Australia/Sydney
+10:00|Guam, Port Moresby|Pacific/Port_Moresby
+10:00|Hobart|Australia/Hobart
+10:00|Vladivostok|Asia/Vladivostok
+10:30|Lord Howe Island|Australia/Lord_Howe
+11:00|Bougainville Island|Pacific/Bougainville
+11:00|Chokurdakh|Asia/Srednekolymsk
+11:00|Magadan|Asia/Magadan
+11:00|Norfolk Island|Pacific/Norfolk
+11:00|Sakhalin|Asia/Sakhalin
+11:00|Solomon Is., New Caledonia|Pacific/Guadalcanal
+12:00|Anadyr, Petropavlovsk-Kamchatsky|Asia/Kamchatka
+12:00|Auckland, Wellington|Pacific/Auckland
+12:00|Coordinated Universal Time+12|Etc/GMT-12
+12:00|Fiji|Pacific/Fiji
+12:45|Chatham Islands|Pacific/Chatham
+13:00|Coordinated Universal Time+13|Etc/GMT-13
+13:00|Nuku'alofa|Pacific/Tongatapu
+13:00|Samoa|Pacific/Apia
+14:00|Kiritimati Island|Pacific/Kiritimati`;
const canon = (z) => {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: z }).resolvedOptions().timeZone;
  } catch (e) {
    return null;
  }
};
const WZ = WT.split("\n")
  .map((l) => {
    const [o, n, z] = l.split("|");
    return { o, n, z, c: canon(z) };
  })
  .filter((x) => x.c);
const WN = {};
WZ.forEach((x) => {
  if (!WN[x.c]) WN[x.c] = x.n;
});
const nmt = (z) => WN[canon(z)] || city(z);
const nm = (z) => nmt(z).replace(/&/g, "&amp;");
const wh = (z) => (S.wh && S.wh[z]) || [S.ws, S.we];
const zones = () => [localTZ, ...S.zones.filter((z) => canon(z) !== canon(localTZ))];

const baseDay = () => {
  const b = new Date();
  b.setHours(0, 0, 0, 0);
  return b.getTime();
};

const fc = {};
function lp(tz, d) {
  const f =
    fc[tz] ||
    (fc[tz] = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      hour: "2-digit",
      minute: "2-digit",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    }));
  const o = {};
  f.formatToParts(d).forEach((x) => (o[x.type] = x.value));
  return { h: +o.hour % 24, m: +o.minute, key: +(o.year + o.month + o.day), wd: o.weekday };
}
function off(tz, d) {
  try {
    const p = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" })
      .formatToParts(d)
      .find((x) => x.type === "timeZoneName");
    return p ? p.value.replace("GMT", "UTC") : "UTC";
  } catch (e) {
    return "";
  }
}
function abbr(z, d) {
  let a = "";
  try {
    a = new Intl.DateTimeFormat("en-US", { timeZone: z, timeZoneName: "short" })
      .formatToParts(d)
      .find((x) => x.type === "timeZoneName").value;
  } catch (e) {}
  const o = off(z, d);
  return /^(GMT|UTC)/.test(a) || !a ? o : a + " " + o;
}
function segs(tz) {
  const st = W0 - 36 * 36e5,
    en = W0 + Wms + 36 * 36e5,
    step = 9e5,
    out = [];
  let ps = st,
    pk = lp(tz, new Date(st)).key;
  for (let t = st + step; t <= en; t += step) {
    const k = lp(tz, new Date(t)).key;
    if (k !== pk) {
      out.push({ s: ps, e: t });
      ps = t;
      pk = k;
    }
  }
  out.push({ s: ps, e: en });
  return out.filter((x) => x.e > W0 && x.s < W0 + Wms);
}
function cat(mode, k, z) {
  if (mode === "w") {
    const w = wh(z);
    return k >= w[0] && k < w[1] ? "d" : "n";
  }
  return k >= S.ds && k < S.de ? "d" : k === S.ds - 1 || k === S.de ? "t" : "n";
}
function ruler() {
  const step = (S.win <= 24 ? 2 : S.win <= 48 ? 3 : 6) * (innerWidth < 600 ? 2 : 1);
  let h = "";
  for (let i = 0; i <= S.win; i++) {
    const l = (i / S.win) * 100;
    h += `<i class="tk${i % step ? "" : " mj"}" style="left:${l}%"></i>`;
    if (i % step === 0 && i < S.win)
      h += `<span class="tl" style="left:${l}%">${new Date(W0 + i * 36e5).toLocaleTimeString(undefined, { hour: "numeric" })}</span>`;
  }
  return `<div class="ruler">${h}</div>`;
}
function sec(mode, title, foot) {
  const zs = zones(),
    mid = new Date(W0 + Wms / 2);
  const rows = zs
    .map((z, i) => {
      const sg = segs(z);
      const pills = sg
        .map((x) => {
          let b = "";
          for (let k = 0; k < 24; k++) b += `<i class="${cat(mode, k, z)}"></i>`;
          return `<div class="pill" data-s="${x.s}" data-e="${x.e}" style="left:calc(${((x.s - W0) / Wms) * 100}% + 2px);width:calc(${((x.e - x.s) / Wms) * 100}% - 4px)">${b}</div>`;
        })
        .join("");
      const labs = sg
        .map((x) => {
          const a = Math.max(x.s, W0),
            c = Math.min(x.e, W0 + Wms);
          const fmtOpts =
            c - a < 7 * 36e5
              ? { timeZone: z, weekday: "short", day: "numeric" }
              : { timeZone: z, weekday: "short", month: "short", day: "numeric" };
          const d = new Date((a + c) / 2).toLocaleDateString(undefined, fmtOpts);
          return `<span class="plab" style="left:${(((a + c) / 2 - W0) / Wms) * 100}%;width:${((c - a) / Wms) * 100}%">${d}</span>`;
        })
        .join("");
      return `<div class="zrow"><div class="zl"><span class="zn">${nm(z)}</span><span class="za">${abbr(z, mid)}</span>${mode === "w" ? `<span class="za">works ${wh(z)[0]} to ${wh(z)[1]}</span>` : ""}${i ? "" : '<span class="you">you</span>'}</div><div class="track">${pills}${labs}<span class="zmk" data-zm="${z}"></span></div></div>`;
    })
    .join("");
  return `<section class="panel ${mode === "w" ? "work" : ""}"><h2>${title}</h2><div class="chart">${ruler()}${rows}<div class="layer"><div class="box"><i class="rh" title="Drag to change the meeting length"></i></div><div class="bdg"><b class="bt"></b><small>your local time</small></div></div></div><p class="foot">${foot}</p></section>`;
}
const dateVal = (d) =>
  d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
function render() {
  B0 = baseDay();
  const vd = new Date(B0);
  vd.setDate(vd.getDate() + D);
  W0 = vd.getTime() - ((S.win - 24) / 2) * 36e5;
  Wms = S.win * 36e5;
  $("#goto").value = dateVal(vd);
  $("#app").innerHTML =
    sec(
      "d",
      "1. Daylight overlap",
      "Light blue is daytime and dark blue is night in the current day of each zone. Grey is the days before and after.",
    ) + sec("w", "2. Working hours overlap", "Green is working time in the current day of each zone.");
  document.querySelectorAll(".chart").forEach((c) => {
    let drag = false,
      resize = false;
    const at = (e) => {
      const r = c.getBoundingClientRect();
      return W0 + Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * Wms;
    };
    const set = (e) => {
      if (resize) {
        const st = T == null ? Date.now() : T;
        S.dur = Math.max(15, Math.min(1440, Math.round((at(e) - st) / 9e5) * 15));
        syncDur();
      } else T = Math.round(at(e) / 9e5) * 9e5;
      tick();
    };
    const end = () => {
      if (drag && resize) save();
      drag = resize = false;
    };
    c.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button")) return;
      drag = true;
      resize = !!e.target.closest(".rh");
      c.setPointerCapture(e.pointerId);
      if (!resize) set(e);
    });
    c.addEventListener("pointermove", (e) => {
      if (drag) set(e);
    });
    c.addEventListener("pointerup", end);
    c.addEventListener("pointercancel", end);
  });
  $("#clocks").innerHTML =
    zones()
      .map(
        (z, i) =>
          `<div class="ck">${i ? `<button class="ckx" data-rm="${z}" aria-label="Remove ${nm(z)}">&times;</button>` : ""}<div class="ckn" title="${nm(z)}">${nm(z)}${i ? "" : "<em>you</em>"}</div><div class="ckt" data-ct="${z}"></div><div class="ckm"><span class="cka">${abbr(z, new Date())}</span> <span class="ckd" data-cd="${z}"></span></div><label class="ckw">Works <input type="number" min="0" max="23" value="${wh(z)[0]}" data-wz="${z}" data-wi="0" aria-label="${nm(z)} work start hour"> to <input type="number" min="1" max="24" value="${wh(z)[1]}" data-wz="${z}" data-wi="1" aria-label="${nm(z)} work end hour"></label></div>`,
      )
      .join("") +
    '<div class="ck-add"><button class="addtile" id="addzone" aria-label="Add a time zone">+</button></div>';
  tick();
}
function tick() {
  if (baseDay() !== B0) {
    render();
    return;
  }
  const now = Date.now(),
    t = T == null ? now : T,
    td = new Date(t);
  $("#big").textContent = new Date(now).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
  $("#date").textContent =
    new Date(now).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) +
    " in " +
    nmt(localTZ) +
    " (" +
    off(localTZ, new Date(now)) +
    ")";
  const nd = new Date(now);
  document.querySelectorAll(".ck").forEach((c) => {
    const ct = c.querySelector("[data-ct]"),
      z = ct.dataset.ct,
      f = lp(z, nd),
      h = f.h + f.m / 60;
    c.classList.toggle("dn", h >= S.ds && h < S.de);
    ct.textContent = nd.toLocaleTimeString(undefined, {
      timeZone: z,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
    c.querySelector("[data-cd]").textContent =
      nd.toLocaleDateString(undefined, { timeZone: z, weekday: "short", month: "short", day: "numeric" }) +
      (h >= wh(z)[0] && h < wh(z)[1] ? "," : "");
  });
  const dm = S.dur * 6e4,
    f = (t - W0) / Wms,
    fe = (t + dm - W0) / Wms,
    vis = fe >= 0 && f <= 1,
    mid = (f + fe) / 2,
    half = S.dur ? 84 : 46,
    en = new Date(t + dm);
  const span = (z) =>
    td.toLocaleString(undefined, { timeZone: z, weekday: "short", hour: "numeric", minute: "2-digit" }) +
    (S.dur ? " \u2013 " + en.toLocaleTimeString(undefined, { timeZone: z, hour: "numeric", minute: "2-digit" }) : "");
  document.querySelectorAll("[data-zm]").forEach((e) => {
    e.style.display = vis ? "block" : "none";
    e.style.left = `clamp(${half}px,${mid * 100}%,calc(100% - ${half}px))`;
    e.textContent = span(e.dataset.zm);
  });
  document.querySelectorAll(".box").forEach((e) => {
    e.style.display = vis ? "block" : "none";
    e.style.left = Math.max(f, 0) * 100 + "%";
    e.style.width = (Math.min(fe, 1) - Math.max(f, 0)) * 100 + "%";
    e.querySelector(".rh").style.display = fe > 1 ? "none" : "block";
  });
  document.querySelectorAll(".bdg").forEach((e) => {
    e.style.display = vis ? "block" : "none";
    e.style.left = `clamp(${half}px,${mid * 100}%,calc(100% - ${half}px))`;
    e.querySelector(".bt").textContent = span(undefined);
    e.querySelector("small").textContent = "your local time" + (S.dur ? " \u00b7 " + durText() : "");
  });
  document.querySelectorAll(".pill").forEach((p) => p.classList.toggle("cur", t >= +p.dataset.s && t < +p.dataset.e));
  const lv = $("#live");
  lv.textContent = T == null ? "Live" : "Back to live";
  lv.classList.toggle("on", T == null);
}
function add(z) {
  if (!z) return;
  const c = canon(z);
  if (c !== canon(localTZ) && !S.zones.some((x) => canon(x) === c)) {
    S.zones.push(z);
    save();
  }
  render();
}
function openPicker(tile) {
  const have = new Set(zones().map(canon));
  tile.innerHTML =
    '<select class="addsel" aria-label="Select a time zone"><option value="">Select a time zone</option>' +
    WZ.filter((x) => !have.has(x.c))
      .map((x) => `<option value="${x.z}">(UTC${x.o}) ${x.n.replace(/&/g, "&amp;")}</option>`)
      .join("") +
    "</select>";
  const sel = tile.firstChild;
  sel.onchange = () => add(sel.value);
  sel.onblur = () => render();
  sel.focus();
  try {
    sel.showPicker();
  } catch (err) {}
}
$("#clocks").onclick = (e) => {
  const rm = e.target.closest("[data-rm]");
  if (rm) {
    S.zones = S.zones.filter((x) => x !== rm.dataset.rm);
    save();
    render();
    return;
  }
  const btn = e.target.closest("#addzone");
  if (btn) openPicker(btn.parentElement);
};
$("#clocks").onchange = (e) => {
  const z = e.target.dataset.wz;
  if (!z) return;
  const i = +e.target.dataset.wi,
    v = Math.max(0, Math.min(24, parseInt(e.target.value, 10))),
    a = wh(z).slice();
  if (!isNaN(v)) {
    a[i] = v;
    if (a[0] < a[1]) {
      S.wh = S.wh || {};
      S.wh[z] = a;
      save();
    }
  }
  render();
};
const nbsp = (s) => s.replace(/[\u202f\u00a0]/g, " ");
function tzShort(z, d) {
  let a = "";
  try {
    a = new Intl.DateTimeFormat("en-US", { timeZone: z, timeZoneName: "short" })
      .formatToParts(d)
      .find((x) => x.type === "timeZoneName").value;
  } catch (e) {}
  return /^(GMT|UTC)/.test(a) || !a ? off(z, d) : a;
}
function durText() {
  const h = Math.floor(S.dur / 60),
    m = S.dur % 60;
  return (h ? h + " hr" : "") + (h && m ? " " : "") + (m ? m + " min" : "");
}
function setDur(m) {
  S.dur = Math.max(5, Math.min(1440, Math.round(m)));
  save();
  syncDur();
  tick();
}
$("#durup").onclick = () => setDur((Math.floor(S.dur / 15) + 1) * 15);
$("#durdn").onclick = () => setDur(Math.max(15, (Math.ceil(S.dur / 15) - 1) * 15));
$("#durnum").onchange = (e) => {
  const v = parseInt(e.target.value, 10);
  if (isNaN(v)) syncDur();
  else setDur(v);
};
function syncDur() {
  if (document.activeElement !== $("#durnum")) $("#durnum").value = S.dur || "";
  $("#mdesc").textContent = S.dur
    ? durText() + " \u00b7 drag the right edge of the box to change"
    : "Drag the right edge of the line to set a meeting length";
  $("#outlook").disabled = $("#ics").disabled = !S.dur;
  $("#outlook").title = $("#ics").title = S.dur ? "" : "Drag the right edge of the line to set a meeting length first";
}
// Builds the meeting from the box start (snapped to 15 min when the time line is live).
function meeting() {
  if (!S.dur) return null;
  if (T == null) {
    T = Math.ceil(Date.now() / 9e5) * 9e5;
    tick();
  }
  const s = new Date(T),
    e = new Date(T + S.dur * 6e4),
    zs = zones(),
    hm = { hour: "numeric", minute: "2-digit" };
  // One line per time zone; the subject is left blank for the user to type.
  const lines = zs.map((z) =>
    nbsp(
      nmt(z) +
        ": " +
        s.toLocaleString(undefined, {
          timeZone: z,
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
          ...hm,
        }) +
        " - " +
        e.toLocaleTimeString(undefined, { timeZone: z, ...hm }) +
        " " +
        tzShort(z, s),
    ),
  );
  return { s, e, subject: "", lines, body: lines.join("\r\n") };
}
$("#outlook").onclick = () => {
  const m = meeting();
  if (!m) return;
  // Local wall-clock time without a "Z", so Outlook shows the time exactly as selected here
  // instead of converting it into the time zone configured in the Outlook account.
  const p2 = (n) => String(n).padStart(2, "0"),
    iso = (d) =>
      `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}:00`,
    q = encodeURIComponent;
  window.open(
    "https://outlook.office.com/calendar/0/deeplink/compose?path=" +
      q("/calendar/action/compose") +
      "&rru=addevent&startdt=" +
      q(iso(m.s)) +
      "&enddt=" +
      q(iso(m.e)) +
      "&subject=" +
      q(m.subject) +
      "&body=" +
      q(m.lines.map((l) => l.replace(/&/g, "&amp;").replace(/</g, "&lt;")).join("<br>")),
    "_blank",
    "noopener",
  );
};
$("#ics").onclick = () => {
  const m = meeting();
  if (!m) return;
  const stamp = (d) =>
      d
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}Z$/, "Z"),
    esc = (s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"),
    fold = (l) => (l.length > 73 ? l.slice(0, 73) + "\r\n " + fold(l.slice(73)) : l);
  const ics =
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//SPBasic Tools//World Clock//EN",
      "BEGIN:VEVENT",
      "UID:" + Date.now() + Math.random().toString(36).slice(2) + "@spbasic",
      "DTSTAMP:" + stamp(new Date()),
      "DTSTART:" + stamp(m.s),
      "DTEND:" + stamp(m.e),
      "SUMMARY:" + esc(m.subject),
      "DESCRIPTION:" + esc(m.body),
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .map(fold)
      .join("\r\n") + "\r\n";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  a.download = "meeting.ics";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
$("#live").onclick = () => {
  T = null;
  D = 0;
  render();
};
function shiftDays(n) {
  if (!n) return;
  const t = new Date(T == null ? Date.now() : T);
  t.setDate(t.getDate() + n);
  T = t.getTime();
  D += n;
  render();
}
$("#prev").onclick = () => shiftDays(-1);
$("#next").onclick = () => shiftDays(1);
$("#goto").onchange = (e) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(e.target.value);
  if (!m) return;
  const target = new Date(+m[1], +m[2] - 1, +m[3]).getTime(),
    cur = new Date(B0);
  cur.setDate(cur.getDate() + D);
  shiftDays(Math.round((target - cur.getTime()) / 864e5));
};
let wheelAt = 0;
$("#app").addEventListener(
  "wheel",
  (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 8) return;
    e.preventDefault();
    const n = Date.now();
    if (n - wheelAt < 250) return;
    wheelAt = n;
    shiftDays(e.deltaX > 0 ? 1 : -1);
  },
  { passive: false },
);
addEventListener("resize", () => {
  if (innerWidth !== lastW) {
    lastW = innerWidth;
    render();
  }
});
// First-visit help popup. A separate storage key keeps it independent of the saved zones.
const HELP_KEY = "overlap-tz-help";
function showHelp() {
  $("#helpbox").hidden = false;
  $("#helpok").focus();
}
function hideHelp() {
  $("#helpbox").hidden = true;
  try {
    localStorage.setItem(HELP_KEY, "1");
  } catch (e) {}
  $("#help").focus();
}
$("#help").onclick = showHelp;
$("#helpok").onclick = hideHelp;
$("#helpbox").onclick = (e) => {
  if (e.target === $("#helpbox")) hideHelp();
};
addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("#helpbox").hidden) hideHelp();
});
syncDur();
render();
setInterval(tick, 1000);
try {
  if (!localStorage.getItem(HELP_KEY)) showHelp();
} catch (e) {
  showHelp();
}
