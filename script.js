

(function() {

    //Rather than set the vars in one block which is messy we set them dynamically in a for loop
    function setvars(){
     varstoset = ['clock','dateEl','start','end','btnIn','btnOut','status']
     
     for (let v of varstoset){
        eval( v = document.getElementById(v));
     }}    

    setvars()

    function pad(n) {
        return String(n).padStart(2, '0')
    }

    function hm(d) {
        return pad(d.getHours()) + ':' + pad(d.getMinutes())
    }

    function tick() {
        var d = new Date();
        clock.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
        dateEl.textContent = d.toLocaleDateString(undefined, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    tick();
    setInterval(tick, 1000);

    function toMins(v) {
        var p = v.split(':');
        return (+p[0]) * 60 + (+p[1])
    }

    function show() {
        var s = start.value,
            e = end.value,
            html = '';
        if (s && e) {
            var diff = toMins(e) - toMins(s);
            if (diff < 0) {
                html = '<p>Leave time is before start time. Check both times.</p>'
            } else {
                html = '<p>Worked ' + Math.floor(diff / 60) + 'h ' + pad(diff % 60) + 'm</p><p>' + s + ' to ' + e + '</p>'
            }
        } else if (s) {
            html = '<p>Clocked in at ' + s + '.</p>'
        } else {
            html = '<p>Not clocked in. Press Clock in, or enter your times above.</p>'
        }
        status.innerHTML = html;
        btnOut.disabled = !s;
    }

    btnIn.addEventListener('click', function() {
        start.value = hm(new Date());
        end.value = '';
        show()
    });

    btnOut.addEventListener('click', function() {
        end.value = hm(new Date());
        show()
    });
    
    start.addEventListener('input', show);
    end.addEventListener('input', show);

    var wage = document.getElementById('wage'),
        hpw = document.getElementById('hpw'),
        earned = document.getElementById('earned'),
        note = document.getElementById('earnedNote'),
        sHour = document.getElementById('sHour'),
        sMin = document.getElementById('sMin'),
        sSec = document.getElementById('sSec'),
        sPenny = document.getElementById('sPenny'),
        payday = document.getElementById('payday'),
        sLast = document.getElementById('sLast'),
        sNext = document.getElementById('sNext'),
        sMonth = document.getElementById('sMonth');

    (function() {
        var o = document.createElement('option');
        o.value = 'last';
        o.textContent = 'Last day of the month';
        payday.appendChild(o);
        for (var i = 1; i <= 31; i++) {
            o = document.createElement('option');
            o.value = i;
            o.textContent = 'Day ' + i + ' of the month';
            payday.appendChild(o)
        }
        payday.value = 'last';
    })();

    function payFor(y, m) {
        var dim = new Date(y, m + 1, 0).getDate(),
            v = payday.value,
            d = v === 'last' ? dim : Math.min(+v, dim),
            dt = new Date(y, m, d),
            wd = dt.getDay();
        if (wd === 6) dt.setDate(d - 1);
        else if (wd === 0) dt.setDate(d - 2);
        return dt;
    }

    function fmt(d) {
        return d.toLocaleDateString(undefined, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    function paydays() {
        var now = new Date(),
            y = now.getFullYear(),
            m = now.getMonth(),
            today = new Date(y, m, now.getDate()),
            c = [payFor(y, m - 1), payFor(y, m), payFor(y, m + 1)],
            last = c[0],
            next = c[2],
            i;
        for (i = 0; i < 3; i++) {
            if (c[i] <= today) last = c[i]
        }
        for (i = 2; i >= 0; i--) {
            if (c[i] > today) next = c[i]
        }
        var n = Math.round((next - today) / 864e5);
        sLast.textContent = fmt(last);
        sNext.textContent = fmt(next) + ' (' + (n === 1 ? 'tomorrow' : 'in ' + n + ' days') + ')';
        return {
            last: last,
            next: next,
            now: now
        };
    }

    function dur(s) {
        if (!isFinite(s)) return '–';
        if (s < 60) return s.toFixed(1) + ' seconds';
        var m = Math.floor(s / 60);
        return m + ' min ' + Math.round(s % 60) + ' sec';
    }

    function pay() {
        var P = paydays();
        var w = parseFloat(wage.value),
            h = parseFloat(hpw.value) || 37.5;
        if (!(w > 0)) {
            earned.textContent = '£0.00';
            note.textContent = 'Enter your wage to see your earnings.';
            sHour.textContent = sMin.textContent = sSec.textContent = sPenny.textContent = sMonth.textContent = '–';
            return;
        }
        var hourly = w * 12 / 52 / h,
            perSec = hourly / 3600;
        sHour.textContent = '£' + hourly.toFixed(2);
        sMin.textContent = '£' + (hourly / 60).toFixed(4);
        sSec.textContent = (perSec * 100).toFixed(3) + 'p';
        sPenny.textContent = dur(0.01 / perSec);
        var monthVal = w * (P.now - P.last) / (P.next - P.last);

        var s = start.value,
            secs = 0;
        if (s) {
            var now = P.now,
                sp = s.split(':'),
                sd = new Date(now);
            sd.setHours(+sp[0], +sp[1], 0, 0);
            if (sd > now) sd.setDate(sd.getDate() - 1);
            var ed = now;
            if (end.value) {
                var ep = end.value.split(':');
                ed = new Date(sd);
                ed.setHours(+ep[0], +ep[1], 0, 0);
                if (ed < sd) ed.setDate(ed.getDate() + 1);
            }
            secs = Math.max(0, (ed - sd) / 1000);
            monthVal = w * (Math.max(sd, P.last) - P.last) / (P.next - P.last) + secs * perSec;
            note.textContent = end.value ? 'Total earned for this shift.' : 'Earning right now since ' + s + '.';
        } else {
            note.textContent = 'Clock in to start earning.';
        }
        earned.textContent = '£' + (secs * perSec).toFixed(2);
        sMonth.textContent = '£' + monthVal.toFixed(2);
    }

    [wage, hpw, payday, start, end].forEach(function(el) {
        el.addEventListener('input', pay)
    });
    btnIn.addEventListener('click', pay);
    btnOut.addEventListener('click', pay);
    document.getElementById('reset').addEventListener('click', function() {
        start.value = '';
        end.value = '';
        show();
        pay()
    });
    setInterval(pay, 100);

    var savedWage = null,
        wmsg = document.getElementById('wageMsg');
    try {
        var raw = localStorage.getItem('wageSettings');
        if (raw) savedWage = JSON.parse(raw)
    } catch (e) {}

    function say(t) {
        wmsg.textContent = t
    }

    function applySaved() {
        wage.value = savedWage.wage;
        hpw.value = savedWage.hpw;
        payday.value = savedWage.payday;
        pay()
    }
    document.getElementById('wSave').addEventListener('click', function() {
        if (!(parseFloat(wage.value) > 0)) {
            say('Enter a wage first.');
            return
        }
        savedWage = {
            wage: wage.value,
            hpw: hpw.value,
            payday: payday.value
        };
        try {
            localStorage.setItem('wageSettings', JSON.stringify(savedWage))
        } catch (e) {}
        say('Wage saved.');
    });
    document.getElementById('wLoad').addEventListener('click', function() {
        if (!savedWage) {
            say('Nothing saved yet.');
            return
        }
        applySaved();
        say('Saved wage loaded.');
    });
    document.getElementById('wReset').addEventListener('click', function() {
        savedWage = null;
        try {
            localStorage.removeItem('wageSettings')
        } catch (e) {}
        wage.value = '';
        hpw.value = '37.5';
        payday.value = 'last';
        pay();
        say('Wage reset.');
    });
    if (savedWage) {
        applySaved();
        say('Saved wage loaded.')
    }

    show();
    pay();
})();