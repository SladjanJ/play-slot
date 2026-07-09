/** @typedef {{ name_en: string; name_sr: string }} City */

/** @param {string} en @param {string} [sr] @returns {City} */
export function c(en, sr = en) {
  return { name_en: en, name_sr: sr };
}

/** @param {...string} names @returns {City[]} */
export function same(...names) {
  return names.map((name) => ({ name_en: name, name_sr: name }));
}
