/*
 * Police awareness and dispatch model. This module changes no artwork and owns no
 * physical actors. The game adapter supplies live actors and geometry, moves cars
 * and officers, applies returned wanted values, and performs fair offscreen spawns.
 *
 * Integration:
 * - Call report(amount, snapshot, {force:true}) for alarms/scripted serious crimes.
 *   A witnessed ordinary crime is reported; a minor unwitnessed crime is not.
 * - Assign world.wanted = reportResult.wanted / updateResult.wanted. Remove the
 *   legacy unconditional wanted decay. Call update even while the player is indoors.
 * - Pursuit uses result.target; search uses the LAST KNOWN position, never the
 *   hidden player's current position. Shoot only when canEngage AND the individual
 *   officer has clear line of sight. Low wanted levels pursue/arrest instead.
 * - spawnRequest and roadblockRequest are requests, not actors. The adapter must
 *   place them offscreen on valid roads, with a safe distance from the player.
 * - On result.arrest, apply the game's arrest/fine transition once and reset().
 * - Persist export(); restore with import(). Functions/actors are never serialized.
 */
(function (root) {
  'use strict';
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const finite = (v, fallback = 0) => Number.isFinite(v) ? v : fallback;
  const point = value => value && Number.isFinite(value.x) && Number.isFinite(value.y)
    ? {x:value.x, y:value.y} : null;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const MODES = new Set(['clear', 'reported', 'pursuit', 'search']);
  const DEFAULTS = Object.freeze({
    witnessRadius:230, footSight:330, vehicleSight:470, reportSeconds:1.4,
    lostSightGrace:.85, searchBase:15, searchPerStar:6, spawnSeconds:2.5,
    roadblockSeconds:20, arrestSeconds:2.5
  });

  class GlowportPolice {
    constructor(options = {}) {
      this.options = {...DEFAULTS};
      for (const [key, value] of Object.entries(options)) {
        if (key in DEFAULTS && Number.isFinite(value) && value > 0) this.options[key] = value;
      }
      this.reset();
    }

    reset() {
      this.state = {
        version:1, wanted:0, mode:'clear', lastKnown:null, lastSeen:-1e9,
        searchRemaining:0, reportDelay:0, lastCrime:-1e9, lastSpawn:-1e9,
        lastRoadblock:-1e9, heat:0, arrestProgress:0, clock:0,
        reports:0, escapes:0, arrests:0
      };
      return this.export();
    }

    _clock(snapshot = {}, dt = 0) {
      return Number.isFinite(snapshot.clock) ? snapshot.clock : this.state.clock + dt;
    }

    _focus(snapshot = {}) {
      // Adapters may supply the actual vehicle as player.inCar or just a boolean.
      const p = snapshot.player || {};
      return point(p.inCar) || point(p) || {x:0, y:0};
    }

    _lineOfSight(a, b, snapshot) {
      // Missing geometry fails closed: there is no omniscient awareness fallback.
      if (typeof snapshot.lineOfSight !== 'function') return false;
      try { return snapshot.lineOfSight(a, b) === true; } catch (_) { return false; }
    }

    _liveCops(snapshot = {}) {
      return (Array.isArray(snapshot.cops) ? snapshot.cops : []).filter(c =>
        point(c) && (c.hp === undefined || c.hp > 0));
    }

    _visibleCops(snapshot = {}) {
      if (snapshot.player?.inside) return [];
      const focus = this._focus(snapshot);
      return this._liveCops(snapshot).filter(c =>
        distance(c, focus) <= (c.foot ? this.options.footSight : this.options.vehicleSight)
        && this._lineOfSight(c, focus, snapshot));
    }

    _witnesses(snapshot = {}) {
      if (snapshot.player?.inside) return [];
      const focus = this._focus(snapshot);
      return (Array.isArray(snapshot.witnesses) ? snapshot.witnesses : []).filter(w =>
        point(w) && (w.hp === undefined || w.hp > 0)
        && distance(w, focus) <= this.options.witnessRadius
        && this._lineOfSight(w, focus, snapshot));
    }

    _searchDuration() {
      return this.options.searchBase + Math.ceil(this.state.wanted) * this.options.searchPerStar;
    }

    _beginSearch() {
      this.state.mode = 'search';
      this.state.searchRemaining = this._searchDuration();
      this.state.reportDelay = 0;
      this.state.arrestProgress = 0;
    }

    _clear(escaped = false) {
      const wasWanted = this.state.wanted > 0;
      this.state.wanted = 0;
      this.state.mode = 'clear';
      this.state.searchRemaining = 0;
      this.state.reportDelay = 0;
      this.state.arrestProgress = 0;
      if (escaped && wasWanted) this.state.escapes++;
    }

    setWanted(value, snapshot = {}) {
      const wanted = clamp(finite(value), 0, 5);
      this.state.clock = this._clock(snapshot);
      this.state.wanted = wanted;
      if (wanted === 0) this._clear(false);
      else {
        this.state.lastKnown = this._focus(snapshot);
        this.state.lastCrime = this.state.clock;
        this._beginSearch();
        if (this._visibleCops(snapshot).length) {
          this.state.mode = 'pursuit';
          this.state.lastSeen = this.state.clock;
        }
      }
      return this._result(snapshot, 0);
    }

    report(amount, snapshot = {}, options = {}) {
      const s = this.state;
      s.clock = this._clock(snapshot);
      if (Number.isFinite(snapshot.wanted)) s.wanted = clamp(snapshot.wanted, 0, 5);
      amount = finite(amount);
      if (amount <= 0) {
        s.wanted = clamp(s.wanted + amount, 0, 5);
        if (!s.wanted) this._clear(false);
        return {accepted:true, witnessed:false, wanted:s.wanted, mode:s.mode, reason:'adjusted'};
      }
      const visibleCops = this._visibleCops(snapshot);
      const witnesses = this._witnesses(snapshot);
      const alarm = options.force === true || snapshot.force === true || amount >= .65;
      const witnessed = visibleCops.length > 0 || witnesses.length > 0;
      if (!witnessed && !alarm) {
        return {accepted:false, witnessed:false, wanted:s.wanted, mode:s.mode, reason:'unwitnessed'};
      }
      s.wanted = clamp(s.wanted + amount, 0, 5);
      s.lastCrime = s.clock;
      s.lastKnown = this._focus(snapshot);
      s.heat = clamp(s.heat + amount * .35, 0, 5);
      s.reports++;
      s.arrestProgress = 0;
      if (visibleCops.length) {
        s.mode = 'pursuit';
        s.lastSeen = s.clock;
        s.reportDelay = 0;
        s.searchRemaining = this._searchDuration();
      } else if (s.mode !== 'pursuit') {
        s.mode = 'reported';
        // A new report refreshes the search; it does not repeatedly restart the
        // dispatch delay when several bullets are heard in the same second.
        s.reportDelay = s.reportDelay > 0 ? s.reportDelay : this.options.reportSeconds;
        s.searchRemaining = this._searchDuration();
      }
      return {accepted:true, witnessed, alarm, wanted:s.wanted, mode:s.mode,
        reason:visibleCops.length ? 'officer-observed' : witnessed ? 'civilian-report' : 'alarm'};
    }

    update(dt, snapshot = {}) {
      const s = this.state;
      dt = clamp(finite(dt), 0, 600);
      const previousWanted = s.wanted;
      s.clock = this._clock(snapshot, dt);
      // Explicit changes from the host (hospital, script, debug, mission) are
      // authoritative. A host must feed back this method's returned wanted value.
      if (Number.isFinite(snapshot.wanted) && Math.abs(snapshot.wanted - s.wanted) > 1e-6) {
        const external = clamp(snapshot.wanted, 0, 5);
        if (!external) this._clear(false);
        else {
          const increased = external > s.wanted;
          s.wanted = external;
          if (increased || s.mode === 'clear') {
            s.lastKnown = this._focus(snapshot);
            s.lastCrime = s.clock;
            this._beginSearch();
          }
        }
      }
      s.heat = Math.max(0, s.heat - dt * .005);
      if (!s.wanted) return this._result(snapshot, previousWanted);

      const visible = this._visibleCops(snapshot);
      if (visible.length) {
        s.mode = 'pursuit';
        s.lastSeen = s.clock;
        s.lastKnown = this._focus(snapshot);
        s.searchRemaining = this._searchDuration();
        s.reportDelay = 0;
      } else if (s.mode === 'reported') {
        s.reportDelay = Math.max(0, s.reportDelay - dt);
        if (!s.reportDelay) this._beginSearch();
      } else if (s.mode === 'pursuit') {
        if (s.clock - s.lastSeen >= this.options.lostSightGrace) this._beginSearch();
      } else if (s.mode === 'clear') {
        this._beginSearch();
      }

      if (s.mode === 'search') {
        s.searchRemaining = Math.max(0, s.searchRemaining - dt);
        // Heat does not drain in an officer's sight. Once hidden, stars fade
        // gently and the finite search window guarantees a possible escape.
        s.wanted = Math.max(.01, s.wanted - dt * (.025 + .01 * (6 - Math.ceil(s.wanted))));
        if (!s.searchRemaining) this._clear(true);
      }

      let arrest = false;
      const focus = this._focus(snapshot);
      const p = snapshot.player || {};
      const near = visible.some(c => c.foot && distance(c, focus) < 23);
      const speed = Math.abs(finite(p.speed));
      const canArrest = near && s.mode === 'pursuit' && s.wanted < 2
        && !p.inCar && !p.firing && !p.moving && speed < 12;
      s.arrestProgress = canArrest ? s.arrestProgress + dt : 0;
      if (s.arrestProgress >= this.options.arrestSeconds) {
        s.arrests++;
        arrest = true;
        this._clear(false);
      }

      const result = this._result(snapshot, previousWanted);
      result.arrest = arrest;
      if (!s.wanted) return result;
      const cops = this._liveCops(snapshot);
      const desired = clamp(Math.ceil(s.wanted), 1, 5);
      if (s.mode !== 'reported' && cops.length < desired
          && s.clock - s.lastSpawn >= this.options.spawnSeconds) {
        s.lastSpawn = s.clock;
        result.spawnRequest = {count:1, desired, reason:cops.length ? 'backup' : 'dispatch'};
      }
      if (s.wanted >= 3 && s.mode !== 'reported' && s.lastKnown
          && s.clock - s.lastRoadblock >= this.options.roadblockSeconds) {
        s.lastRoadblock = s.clock;
        result.roadblockRequest = {at:{...s.lastKnown}, level:Math.ceil(s.wanted)};
      }
      return result;
    }

    _result(snapshot = {}, previousWanted = this.state.wanted) {
      const s = this.state;
      const visible = s.wanted > 0 && this._visibleCops(snapshot).length > 0;
      const target = s.mode === 'pursuit' && visible ? this._focus(snapshot) : point(s.lastKnown);
      return {
        wanted:s.wanted, wantedDelta:s.wanted - previousWanted, mode:s.mode,
        lastKnown:point(s.lastKnown), target, visible,
        canEngage:visible && s.mode === 'pursuit' && (s.wanted >= 2 || snapshot.player?.firing === true),
        spawnRequest:null, roadblockRequest:null, arrest:false,
        arrestProgress:s.arrestProgress, searchRemaining:s.searchRemaining,
        reportDelay:s.reportDelay, clear:s.wanted === 0
      };
    }

    export() { return JSON.parse(JSON.stringify(this.state)); }

    import(saved) {
      this.reset();
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return false;
      const s = this.state;
      s.wanted = clamp(finite(saved.wanted), 0, 5);
      s.mode = MODES.has(saved.mode) ? saved.mode : (s.wanted ? 'search' : 'clear');
      s.lastKnown = point(saved.lastKnown);
      for (const key of ['lastSeen','lastCrime','lastSpawn','lastRoadblock','clock']) {
        s[key] = finite(saved[key], s[key]);
      }
      s.searchRemaining = clamp(finite(saved.searchRemaining, this._searchDuration()), 0, 120);
      s.reportDelay = clamp(finite(saved.reportDelay), 0, 5);
      s.heat = clamp(finite(saved.heat), 0, 5);
      for (const key of ['reports','escapes','arrests']) s[key] = clamp(Math.floor(finite(saved[key])), 0, 1e6);
      // Arrest progress is deliberately not restored, avoiding an unavoidable
      // instant arrest on load. A fresh close-range hold is always required.
      s.arrestProgress = 0;
      if (!s.wanted) this._clear(false);
      else if (s.mode === 'clear' || !s.lastKnown) {
        s.mode = 'search';
        s.searchRemaining = Math.max(1, s.searchRemaining || this._searchDuration());
      }
      return true;
    }
  }
  root.GlowportPolice = GlowportPolice;
})(typeof window !== 'undefined' ? window : globalThis);
