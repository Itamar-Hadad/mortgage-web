/**
 * Cloud Functions wrapping the pure calculation engine (../mortgageCalc.js,
 * ../mixEngine.js) so the existing HTML can eventually call the same
 * "שעונים" math through HTTPS callables instead of running it client-side.
 *
 * Not deployed/connected to a Firebase project yet — this only defines the
 * callable signatures. To deploy later: `firebase init functions` (point it
 * at this folder), `npm install` here, then `firebase deploy --only functions`.
 *
 * Every callable receives the same plain-object shapes the engine already
 * uses (mixState/params/ratesCtx — see mixEngine.js header), mutates a
 * fresh copy of mixState, and returns it. Swapping ratesCtx for data read
 * from Firestore later is a one-line change inside each handler.
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { calcMix } = require('../mortgageCalc');
const {
  calculateMixToRange, applyAndCalculateClock, calculateAllMixes, loadClockTemplate
} = require('../mixEngine');

function requireMixState(data) {
  if (!data || typeof data !== 'object' || !data.mixState || typeof data.mixState !== 'object') {
    throw new HttpsError('invalid-argument', 'מצופה mixState בגוף הבקשה.');
  }
  return data;
}

/** מחשב שעון בודד (routes בלבד, בלי טווח החזר) — מקביל ל-calcMix הישיר. */
exports.calcMix = onCall((request) => {
  const { routes, params, ratesCtx } = request.data || {};
  if (!Array.isArray(routes)) throw new HttpsError('invalid-argument', 'מצופה מערך routes בגוף הבקשה.');
  return calcMix(routes, params || {}, ratesCtx || {});
});

/** מקביל ל"חשב" בכרטיס תמהיל בודד: מתאים את התקופות לטווח ההחזר המבוקש. */
exports.calculateMixToRange = onCall((request) => {
  const { mixState, params, ratesCtx, key } = requireMixState(request.data);
  if (!key) throw new HttpsError('invalid-argument', 'מצופה key (למשל "t1").');
  const ok = calculateMixToRange(mixState, params || {}, ratesCtx || {}, key);
  return { ok, mixState };
});

/** מקביל ל"טען וחשב שעון": טוען תבנית שעון ומחשב אותה לטווח ההחזר. */
exports.applyAndCalculateClock = onCall((request) => {
  const { mixState, params, ratesCtx, templateKey } = requireMixState(request.data);
  const routes = applyAndCalculateClock(mixState, params || {}, ratesCtx || {}, templateKey || 'clock1');
  return { routes, mixState };
});

/** מקביל ל"חשב 5 הצעות לפי המשכנתא הקיימת": טוען ומחשב את כל חמשת השעונים. */
exports.calculateAllMixes = onCall((request) => {
  const { mixState, params, ratesCtx } = requireMixState(request.data);
  const mixes = calculateAllMixes(mixState, params || {}, ratesCtx || {});
  return { mixes, mixState };
});

/** טוען תבנית שעון בלי לחשב (מקביל ל-loadClockTemplate). */
exports.loadClockTemplate = onCall((request) => {
  const { mixState, ratesCtx, templateKey, targetKey } = requireMixState(request.data);
  loadClockTemplate(mixState, ratesCtx || {}, templateKey || 'clock1', targetKey || 't1');
  return { mixState };
});
