'use strict';

(function() {
  const URL_BASE = 'https://www.dnd5eapi.co/api';
  const URL_SPELLS = URL_BASE + '/spells';

  window.addEventListener('load', init);

  function init() {
    populateSpells();
    // id('search-btn').addEventListener('click', applyFilters);
    qsa('input').forEach(option => option.addEventListener('change', applyFilters))
    id('check-schools-btn').addEventListener('click', fillCheckBoxes);
    id('check-levels-btn').addEventListener('click', fillCheckBoxes);
    id('check-classes-btn').addEventListener('click', fillCheckBoxes);
  }

  function fillCheckBoxes() {
    let selector;
    switch (this.id) {
      case 'check-schools-btn':
        selector = '#school-options input';
        break;
      case 'check-levels-btn':
        selector = '#level-options input';
        break;
      case 'check-classes-btn':
        selector = '#class-options input';
        break;
      default:
        selector = '';
        break;
    }
    qsa(selector).forEach(box => box.checked = true);
    applyFilters();
  }

  function populateSpells() {
    fetch(URL_SPELLS)
      .then(statusCheck)
      .then(res => res.json())
      .then(processPopulateSpells)
      .catch(handleError);
  }

  function processPopulateSpells(data) {
    data.results.forEach(spell => fetchSpellInfo(spell.index));
  }

  function fetchSpellInfo(spellname) {
    fetch(URL_SPELLS + '/' + spellname)
      .then(statusCheck)
      .then(res => res.json())
      .then(addSpellCard)
      .catch(handleError);
  }

  function addSpellCard(data) {
    const spellCard = gen('div');
    spellCard.classList.add('spell-card', 'hidden');

    const spellName = gen('p');
    spellName.textContent = 'Name: ' + data.name;
    spellCard.appendChild(spellName);

    const spellInfo = makeSpellInfo(data);
    spellCard.appendChild(spellInfo);

    id('spell-card-container').appendChild(spellCard);
  }

  function makeSpellInfo(spellData) {
    const spellInfo = gen('div');
    spellInfo.classList.add('spell-info');

    const spellLevel = gen('p');
    spellLevel.textContent = 'Level: ' + (spellData.level === 0 ? 'C' : spellData.level);
    spellInfo.appendChild(spellLevel);

    const spellSchool = gen('p');
    spellSchool.textContent = 'School: ' + spellData.school.name;
    spellInfo.appendChild(spellSchool);

    const classes = [];
    const spellClasses = gen('p');
    spellData.classes.forEach(cl => classes.push(cl.name));
    spellClasses.textContent = 'Classes: ' + String(classes).replaceAll(',', ', ');
    spellInfo.appendChild(spellClasses);

    const subclasses = [];
    const spellSubclasses = gen('p');
    spellData.subclasses.forEach(sub => subclasses.push(sub.name));
    spellSubclasses.textContent = 'Subclasses: ' + String(subclasses).replaceAll(',', ', ');
    spellInfo.appendChild(spellSubclasses);

    const spellDesc = gen('p');
    spellDesc.textContent = 'Description: ' + spellData.desc;
    spellInfo.appendChild(spellDesc);

    return spellInfo;
  }

  function applyFilters() {
    // Get checked level options
    const levels = [];
    const checkedLevels = qsa('#level-options input:checked')
    checkedLevels.forEach(option => levels.push(option.name.replace('level', '')));
    if (levels.includes('0')) {
      levels.push('C');
    }

    // Get checked school options
    const schools = [];
    qsa('#school-options input:checked').forEach(option => schools.push(option.name));

    // Get checked class options
    const classes = [];
    qsa('#class-options input:checked').forEach(option => classes.push(option.name));

    qsa('.spell-card').forEach(card => {
      let spellLvl = qs('.spell-info > p:nth-child(1)', card).innerText.replace('Level: ', '');
      if (spellLvl === '0') {
        spellLvl = 'C';
      }
      const spellSch = qs('.spell-info > p:nth-child(2)', card).innerText.replace('School: ', '');
      let spellCls = qs('.spell-info > p:nth-child(3)', card).innerText.replace('Classes: ', '');
      spellCls = spellCls.split(', ').map(cl => cl.toLowerCase());

      const spellMatch = levels.includes(spellLvl);
      const schoolMatch = schools.includes(spellSch.toLowerCase());
      const classMatch = intersection(spellCls, classes).length > 0;

      if (spellMatch && schoolMatch && classMatch) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  }

  /**
   * Determine the set intersection of two Arrays
   * Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
   * @param {Array} allClasses
   * @param {Array} cardClasses
   * @returns {Array} Intersection of the two input Arrays
   */
  function intersection(allClasses, cardClasses) {
    let _intersection = [];
    for (let elem of cardClasses) {
      if (allClasses.includes(elem)) {
        _intersection.push(elem);
      }
    }
    return _intersection;
  }

  /**
   * Verifies that the API request received a satisfactory response
   * @param {Response} res - Response from the server
   * @returns {Response} the unchanged response if the status code is ok, throws an error otherwise
   */
  async function statusCheck(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   * Handles errors
   * @param {Error} err - Error from the caller to handle
   */
  function handleError(err) {
    const buttons = ['search-btn', 'home-btn', 'yip-btn'];
    id('yipper-data').classList.add('hidden');
    id('error').classList.remove('hidden');
    id('error').textContent = err.message;
    buttons.forEach(btn => {
      id(btn).disabled = true;
    });
  }

  /**
   * Wrapper for the querySelector function.
   * @param {String} sel - The selector to query for.
   * @param {HTMLElement} src - The source object to query on
   * @returns {Element} the element queried for, if it exists.
   */
  function qs(sel, src = document) {
    return src.querySelector(sel);
  }

  /**
   * Wrapper for the querySelectorAll function.
   * @param {String} sel - The selector to query for.
   * @param {HTMLElement} src - The source object to query on
   * @returns {Array} a list of the elements queried for, or null if none exist.
   */
  function qsa(sel, src = document) {
    return src.querySelectorAll(sel);
  }

  /**
   * Wrapper for the getElementById function.
   * @param {String} name - The the element's ID.
   * @returns {Element} the element queried for, if it exists.
   */
  function id(name) {
    return document.getElementById(name);
  }

  /**
   * Wrapper for the createElement function.
   * @param {String} type - Name of the element to create
   * @returns {HTMLElement} the new element
   */
  function gen(type) {
    return document.createElement(type);
  }
})();