(function() {
  const RULE_FIELDS = [
    { key: 'age', type: 'number' },
    { key: 'grade', type: 'string' },
    { key: 'interests', type: 'array' },
    { key: 'subscribed', type: 'boolean' },
    { key: 'last_event', type: 'string' },
    { key: 'email', type: 'string' },
  ];

  const OPERATORS = {
    string: [ 'equals', 'contains', 'startsWith', 'endsWith', 'notEquals' ],
    number: [ '==', '!=', '>', '>=', '<', '<=' ],
    boolean: [ 'is', 'isNot' ],
    array: [ 'includes', 'notIncludes', 'length>', 'length<' ],
  };

  let contacts = [];
  const ruleBuilder = document.getElementById('rule-builder');
  const joinType = document.getElementById('join-type');
  const addBtn = document.getElementById('add-rule');
  const runBtn = document.getElementById('run');
  const resetBtn = document.getElementById('reset');
  const exportBtn = document.getElementById('export');
  const results = document.getElementById('results');
  const count = document.getElementById('count');

  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    Object.assign(node, props);
    children.forEach(c => node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return node;
  }

  function createRuleRow() {
    const fieldSel = el('select');
    RULE_FIELDS.forEach(f => fieldSel.appendChild(el('option', { value: f.key, textContent: f.key })));

    const opSel = el('select');
    const valueInput = el('input', { placeholder: 'value' });
    const removeBtn = el('button', { textContent: 'Remove' });

    function refreshOps() {
      const field = RULE_FIELDS.find(f => f.key === fieldSel.value);
      opSel.innerHTML = '';
      (OPERATORS[field.type] || []).forEach(op => opSel.appendChild(el('option', { value: op, textContent: op })));
      if (field.type === 'boolean') {
        valueInput.style.display = 'none';
      } else {
        valueInput.style.display = '';
        valueInput.type = field.type === 'number' ? 'number' : 'text';
      }
    }
    fieldSel.addEventListener('change', refreshOps);
    refreshOps();

    const row = el('div', {}, [
      fieldSel,
      opSel,
      valueInput,
      removeBtn,
    ]);
    row.style.display = 'grid';
    row.style.gridTemplateColumns = '160px 160px 1fr auto';
    row.style.gap = '8px';
    row.style.margin = '8px 0';

    removeBtn.addEventListener('click', () => row.remove());
    ruleBuilder.appendChild(row);
  }

  function parseRules() {
    const rules = [];
    ruleBuilder.querySelectorAll('div').forEach(row => {
      const [fieldSel, opSel, valueInput] = row.querySelectorAll('select, input');
      rules.push({ field: fieldSel.value, op: opSel.value, value: valueInput.value });
    });
    return rules;
  }

  function matchRule(contact, rule) {
    const value = contact[rule.field];
    switch (rule.op) {
      case 'equals': return String(value).toLowerCase() === String(rule.value).toLowerCase();
      case 'notEquals': return String(value).toLowerCase() !== String(rule.value).toLowerCase();
      case 'contains': return String(value).toLowerCase().includes(String(rule.value).toLowerCase());
      case 'startsWith': return String(value).toLowerCase().startsWith(String(rule.value).toLowerCase());
      case 'endsWith': return String(value).toLowerCase().endsWith(String(rule.value).toLowerCase());
      case '==': return Number(value) == Number(rule.value);
      case '!=': return Number(value) != Number(rule.value);
      case '>': return Number(value) > Number(rule.value);
      case '>=': return Number(value) >= Number(rule.value);
      case '<': return Number(value) < Number(rule.value);
      case '<=': return Number(value) <= Number(rule.value);
      case 'is': return String(value) === 'true';
      case 'isNot': return String(value) !== 'true';
      case 'includes': return Array.isArray(value) && value.map(v => String(v).toLowerCase()).includes(String(rule.value).toLowerCase());
      case 'notIncludes': return Array.isArray(value) && !value.map(v => String(v).toLowerCase()).includes(String(rule.value).toLowerCase());
      case 'length>': return Array.isArray(value) && value.length > Number(rule.value);
      case 'length<': return Array.isArray(value) && value.length < Number(rule.value);
      default: return false;
    }
  }

  function runFilter() {
    const rules = parseRules();
    if (!rules.length) {
      renderResults(contacts);
      return;
    }
    const join = joinType.value;
    const filtered = contacts.filter(c => {
      const outcomes = rules.map(r => matchRule(c, r));
      return join === 'AND' ? outcomes.every(Boolean) : outcomes.some(Boolean);
    });
    renderResults(filtered);
  }

  function renderResults(list) {
    count.textContent = String(list.length);
    const table = document.createElement('table');
    const head = document.createElement('tr');
    ['id','email','age','grade','interests','subscribed','last_event'].forEach(k => {
      head.appendChild(el('th', { textContent: k }));
    });
    table.appendChild(head);
    list.forEach(c => {
      const tr = document.createElement('tr');
      tr.appendChild(el('td', { textContent: c.id }));
      tr.appendChild(el('td', { textContent: c.email }));
      tr.appendChild(el('td', { textContent: String(c.age) }));
      tr.appendChild(el('td', { textContent: c.grade }));
      tr.appendChild(el('td', { textContent: (c.interests||[]).join(', ') }));
      tr.appendChild(el('td', { textContent: c.subscribed ? 'true' : 'false' }));
      tr.appendChild(el('td', { textContent: c.last_event || '' }));
      table.appendChild(tr);
    });
    results.innerHTML = '';
    results.appendChild(table);
  }

  function toCSV(list) {
    const cols = ['id','email','age','grade','interests','subscribed','last_event'];
    const rows = [cols.join(',')].concat(list.map(c => (
      [c.id, c.email, c.age, c.grade, (c.interests||[]).join('|'), c.subscribed, c.last_event||'']
        .map(v => String(v).replace(/"/g,'""'))
        .map(v => /[",\n]/.test(v) ? `"${v}"` : v)
        .join(',')
    )));
    return rows.join('\n');
  }

  function exportResults() {
    const tableRows = results.querySelectorAll('tr');
    if (!tableRows.length) return;
    const current = [];
    tableRows.forEach((tr, i) => {
      if (i === 0) return; // header
      const tds = tr.querySelectorAll('td');
      current.push({
        id: tds[0].textContent,
        email: tds[1].textContent,
        age: Number(tds[2].textContent),
        grade: tds[3].textContent,
        interests: String(tds[4].textContent).split(',').map(s=>s.trim()).filter(Boolean),
        subscribed: tds[5].textContent === 'true',
        last_event: tds[6].textContent || null,
      });
    });
    const blob = new Blob([toCSV(current)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'segment_results.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function resetRules() {
    ruleBuilder.innerHTML = '';
    createRuleRow();
    renderResults(contacts);
  }

  // Init
  addBtn.addEventListener('click', createRuleRow);
  runBtn.addEventListener('click', runFilter);
  resetBtn.addEventListener('click', resetRules);
  exportBtn.addEventListener('click', exportResults);

  fetch('../assets/data/contacts.json')
    .then(r => r.json())
    .then(data => {
      contacts = data;
      createRuleRow();
      renderResults(contacts);
    })
    .catch(() => {
      contacts = [];
      createRuleRow();
      results.textContent = 'Failed to load contacts.json';
    });
})();


