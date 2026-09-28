// Filter kata kasar dasar. Ini cuma starting point — gampang ditambah
// sendiri sesuai kebutuhan, tinggal masukin kata baru ke array di bawah.
const BAD_WORDS = ['anjing', 'bangsat', 'goblok', 'tolol', 'bego', 'babi', 'kampret'];

export function censorText(text) {
  let result = text;
  for (const word of BAD_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, (m) => m[0] + '*'.repeat(Math.max(m.length - 1, 1)));
  }
  return result;
}
