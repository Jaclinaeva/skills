// Sample data for prototypes: made-up, Australian, and seeded so the same prototype shows the same data every time.
//
//   Sample.people(45)              → [{ first, last, name, initials, phone, email, suburb }]
//   Sample.orgs(80, 'Allied Health') → [{ name, initials, suburb }], some with branch suffixes
//   Sample.pick(list), Sample.int(min, max), Sample.money(min, max) → '$1,240.50'
//   Sample.date(new Date(2026, 10, 10)) → '10 Nov 2026';  Sample.dateShort(…) → '10/11/2026'
//   Sample.seed(42)                resets the sequence
var Sample = (function () {
  var s = 1;
  function seed(n) { s = n || 1; }
  function rand() { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }
  function int(a, b) { return a + Math.floor(rand() * (b - a + 1)); }
  function pick(list) { return list[int(0, list.length - 1)]; }

  var FIRST = ['Aaliyah', 'Aarav', 'Amelia', 'Anh', 'Arthur', 'Beatrice', 'Chen', 'Chloe', 'Daniel', 'Doris', 'Eleni', 'Emre', 'Fatima', 'Georgia', 'Hamish', 'Harold', 'Hiroshi', 'Isla', 'Jack', 'Jarrah', 'Joyce', 'Kai', 'Kevin', 'Lachlan', 'Leila', 'Lillian', 'Mai', 'Margaret', 'Mateo', 'Mia', 'Mohammed', 'Nikolai', 'Noah', 'Olivia', 'Priya', 'Rangi', 'Ronald', 'Rosa', 'Sanjay', 'Siobhan', 'Sofia', 'Tamsin', 'Thanh', 'Tom', 'Wei', 'Yasmin', 'Zara'];
  var LAST = ['Abdullah', 'Baker', 'Campbell', 'Chen', 'Costa', 'Davies', 'Fitzgerald', 'Gallo', 'Haddad', 'Ivanova', 'Jackson', 'Kaur', 'Kowalski', 'Le', 'Lim', 'MacDonald', "Martin", 'Morgan', 'Nguyen', 'Nikolaidis', "O'Brien", 'Okafor', 'Papadopoulos', 'Patel', 'Rahman', 'Rossi', 'Santos', 'Sharma', 'Singh', 'Smith', 'Tanaka', 'Tran', 'Walker', 'Watson', 'Williams', 'Wong', 'Yilmaz', 'Zhang'];
  var SUBURBS = ['Ballarat VIC', 'Bendigo VIC', 'Box Hill VIC', 'Footscray VIC', 'Geelong VIC', 'Parramatta NSW', 'Penrith NSW', 'Wollongong NSW', 'Newcastle NSW', 'Chermside QLD', 'Toowoomba QLD', 'Townsville QLD', 'Fremantle WA', 'Joondalup WA', 'Elizabeth SA', 'Glenelg SA', 'Launceston TAS', 'Hobart TAS', 'Belconnen ACT', 'Palmerston NT'];
  var ORG_WORDS = ['Ashwhistle', 'Banksia', 'Bluegum', 'Coastline', 'Hallowmere', 'Ironbark', 'Kookaburra', 'Merriweather', 'Oakhollow', 'Riverbend', 'Saltbush', 'Southern Cross', 'Thistledown', 'Wattle', 'Willowbrook'];
  var ORG_TYPES = ['Allied Health', 'Community Care', 'Foot Clinic', 'Home Services', 'Mobility Hire', 'Nursing', 'Physiotherapy', 'Podiatry', 'Transport'];

  function initials(n) { return n.split(/\s+/).filter(function (w) { return /^[A-Z]/.test(w); }).slice(0, 2).map(function (w) { return w[0]; }).join(''); }
  function phone() { return '04' + int(10, 99) + ' ' + int(100, 999) + ' ' + int(100, 999); }
  function people(n) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var f = pick(FIRST), l = pick(LAST), name = f + ' ' + l;
      out.push({ first: f, last: l, name: name, initials: initials(name), phone: rand() < 0.1 ? null : phone(), email: rand() < 0.1 ? null : (f + '.' + l).toLowerCase().replace(/[^a-z.]/g, '') + '@example.com', suburb: pick(SUBURBS) });
    }
    return out;
  }
  function orgs(n, type) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var base = pick(ORG_WORDS) + ' ' + (type || pick(ORG_TYPES)), suburb = pick(SUBURBS);
      var name = rand() < 0.4 ? base + ' – ' + suburb.replace(/ [A-Z]+$/, '') : base;
      out.push({ name: name, initials: initials(name), suburb: suburb });
    }
    return out;
  }
  function money(a, b) { return '$' + (a + rand() * (b - a)).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function date(d) { return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); }
  function dateShort(d) { return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear(); }

  return { seed: seed, int: int, pick: pick, people: people, orgs: orgs, money: money, date: date, dateShort: dateShort };
})();
